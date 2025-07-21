import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BJ24omJ9PPmTnTbuSbFBPLYxxBYIgVoEWgH6mo9NKrg0vovXhKO3oAc9I3_GM554UytSuuGKP_P475LFxmzi3VM',
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    'y9bU5_EP3ZBoQH2_dTskyt0BBHai-LUAA7v6IY4Cj2Y',
};

webpush.setVapidDetails(
  'mailto:support@aieraa.com', // Replace with your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, icon, badge, userId, data } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get user's push subscription(s)
    const targetUserId = userId || session.user.id;
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: targetUserId,
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No push subscriptions found for user',
      });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-192x192.png',
      data: data || { url: '/' },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/icon-192x192.png',
        },
      ],
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
    });

    // Send notifications to all user subscriptions
    const sendPromises = subscriptions.map(async subscription => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error('Failed to send notification:', error);

        // If subscription is invalid, remove it from database
        if (
          error instanceof Error &&
          (error.message.includes('410') || error.message.includes('404'))
        ) {
          await prisma.pushSubscription
            .delete({
              where: { id: subscription.id },
            })
            .catch(() => {
              // Ignore deletion errors
            });
        }

        return {
          success: false,
          endpoint: subscription.endpoint,
          error: error,
        };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${successCount} devices`,
      details: {
        sent: successCount,
        failed: failureCount,
        total: subscriptions.length,
      },
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Helper function to send notifications to specific users
export async function sendNotificationToUser(
  userId: string,
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
  }
) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { success: false, message: 'No subscriptions found' };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-192x192.png',
      data: notification.data || { url: '/' },
      timestamp: Date.now(),
    });

    const sendPromises = subscriptions.map(async subscription => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );
        return { success: true };
      } catch (error) {
        // Remove invalid subscriptions
        if (
          error instanceof Error &&
          (error.message.includes('410') || error.message.includes('404'))
        ) {
          await prisma.pushSubscription
            .delete({
              where: { id: subscription.id },
            })
            .catch(() => {});
        }
        return { success: false };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      sent: successCount,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error('Send notification error:', error);
    return { success: false, error };
  }
}
