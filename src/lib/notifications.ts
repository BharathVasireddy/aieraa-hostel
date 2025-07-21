import { prisma } from './prisma'
import webpush from 'web-push'

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BJCMq4Cs5IHaaYxfTGVTxcTWIuOjZ2LrfE1tUDqnfpB4mIqTQSgzBMx-s0_F1gMf9F1Ks5B5B8zRMA18ityrJ0M',
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    '9cLRVTRpz-vdZxAXmsVPgxvntAgzx-xmvng2YOO8298',
}

webpush.setVapidDetails(
  'mailto:support@aieraa.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

// Helper function to send notifications to specific users
export async function sendNotificationToUser(
  userId: string,
  notification: {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: any
  }
) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      return { success: false, message: 'No subscriptions found' }
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-192x192.png',
      data: notification.data || { url: '/' },
      timestamp: Date.now(),
    })

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
        )
        return { success: true }
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
            .catch(() => {})
        }
        return { success: false }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length

    return {
      success: successCount > 0,
      sent: successCount,
      total: subscriptions.length,
    }
  } catch (error) {
    console.error('Send notification error:', error)
    return { success: false, error }
  }
}

// Order status notification templates
export const ORDER_STATUS_NOTIFICATIONS = {
  APPROVED: {
    title: 'Your order has been approved! 🎉',
    description: 'Your order has been approved and will be prepared soon.',
  },
  PREPARING: {
    title: 'Your order is now being prepared 👨‍🍳',
    description: 'Your order is now being prepared in the kitchen.',
  },
  READY: {
    title: 'Your order is ready for pickup! 🍽️',
    description: 'Your order is ready for pickup! Please collect it from the food counter.',
  },
  SERVED: {
    title: 'Your order has been served. Thank you! ✅',
    description: 'Your order has been served successfully. Thank you for using our service!',
  },
  REJECTED: {
    title: 'Your order has been rejected 😔',
    description: 'Your order has been rejected. Please contact support for more information.',
  },
  CANCELLED: {
    title: 'Your order has been cancelled',
    description: 'Your order has been cancelled. If you have any questions, please contact support.',
  },
}

// Automated order status notification function
export async function sendOrderStatusNotification(
  order: any,
  status: string,
  rejectionReason?: string
) {
  const statusConfig = ORDER_STATUS_NOTIFICATIONS[status as keyof typeof ORDER_STATUS_NOTIFICATIONS]
  
  if (!statusConfig) {
    console.warn(`No notification template for status: ${status}`)
    return { success: false, message: 'No template found' }
  }

  let description = statusConfig.description
  if (status === 'REJECTED' && rejectionReason) {
    description = `Your order has been rejected. Reason: ${rejectionReason}`
  }

  try {
    const notificationResult = await sendNotificationToUser(order.user.id, {
      title: statusConfig.title,
      body: description,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
        url: `/student/orders/${order.orderNumber}`,
        timestamp: Date.now(),
      },
    })

    console.log('📱 ORDER STATUS NOTIFICATION SENT:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      studentName: order.user.name,
      status,
      title: statusConfig.title,
      sent: notificationResult.sent || 0,
      total: notificationResult.total || 0,
      success: notificationResult.success,
    })

    return notificationResult
  } catch (error) {
    console.error('❌ Failed to send order status notification:', error)
    return { success: false, error }
  }
} 