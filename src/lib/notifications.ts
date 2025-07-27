import { PrismaClient } from '@prisma/client'
import { sendWatiOrderNotification } from './wati-whatsapp' // Changed from './whatsapp' to Wati
import { sendOrderNotificationEmail } from './email'

// Web Push Notification Configuration
const webpush = require('web-push')

// Configure VAPID keys for web push notifications
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BKxWwJT3j_4Pk5M4QKZr-nYhO_8UlKtFz7TT5Q_Z4xz6YkQlP8K6Q9rRr5JM4j5kL6Q',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0'
}

webpush.setVapidDetails(
  'mailto:support@aieraa.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

const prisma = new PrismaClient()

// Send push notification to a specific user
export async function sendNotificationToUser(
  userId: string,
  payload: {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: any
  }
) {
  try {
    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId)
      return { success: false, sent: 0, total: 0 }
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-96x96.png',
      tag: payload.tag || 'order-update',
      data: payload.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/icons/icon-96x96.png'
        }
      ]
    })

    let sentCount = 0
    const totalCount = subscriptions.length

    // Send to all subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          notificationPayload
        )
        sentCount++
      } catch (error) {
        console.error('Failed to send push notification:', error)
        // Remove invalid subscription
        await prisma.pushSubscription.delete({
          where: { id: subscription.id }
        }).catch(() => {})
      }
    })

    await Promise.all(promises)

    return {
      success: sentCount > 0,
      sent: sentCount,
      total: totalCount
    }
  } catch (error) {
    console.error('Error sending push notifications:', error)
    return { success: false, sent: 0, total: 0 }
  }
}

// Enhanced automated order status notification function with Wati and Email
export async function sendOrderStatusNotification(
  order: any,
  status: string,
  rejectionReason?: string
) {
  const statusMessages = {
    'APPROVED': 'Your order has been approved and is being prepared!',
    'PREPARING': 'Your order is now being prepared in the kitchen.',
    'READY': 'Your order is ready for pickup! Please come to the counter.',
    'SERVED': 'Your order has been served successfully. Thank you!',
    'CANCELLED': 'Your order has been cancelled.',
    'REJECTED': rejectionReason ? `Your order has been rejected: ${rejectionReason}` : 'Your order has been rejected.'
  }

  const message = statusMessages[status as keyof typeof statusMessages] || 'Your order status has been updated.'

  try {
    // Prepare order details for notifications
    const orderDetails = {
      orderNumber: order.orderNumber,
      studentName: order.user.name,
      studentEmail: order.user.email,
      totalAmount: order.totalAmount,
      status: status,
      orderDate: order.orderDate.toLocaleDateString(),
      items: order.orderItems.map((item: any) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price
      })),
      rejectionReason
    }

    // Send push notification (existing functionality)
    const notificationResult = await sendNotificationToUser(order.user.id, {
      title: `Order ${status}`,
      body: `Order #${order.orderNumber}: ${message}`,
      tag: `order-${order.id}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: status,
        url: `/student/orders/${order.orderNumber}`
      }
    })

    // Send Wati WhatsApp notification (NEW! - Using Wati instead of direct Meta API)
    const watiResult = await sendWatiOrderNotification(order.user.id, orderDetails, 'status_update')

    // Send email notification
    const emailResult = await sendOrderNotificationEmail(order.user.id, orderDetails, 'status_update')

    console.log('📱 MULTI-CHANNEL NOTIFICATION SENT:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      studentName: order.user.name,
      status,
      pushNotification: {
        sent: notificationResult.sent || 0,
        total: notificationResult.total || 0,
        success: notificationResult.success,
      },
      watiNotification: { // Updated from whatsappNotification to watiNotification
        success: watiResult.success,
        messageId: (watiResult as any).messageId || null
      },
      emailNotification: {
        success: emailResult.success,
        messageId: (emailResult as any).messageId || null
      }
    })

    return {
      success: notificationResult.success || watiResult.success || emailResult.success,
      pushNotification: notificationResult,
      watiNotification: watiResult, // Updated name
      emailNotification: emailResult
    }
  } catch (error) {
    console.error('❌ Failed to send multi-channel notification:', error)
    return { success: false, error }
  }
}

// Updated function to send order confirmation via Wati and Email
export async function sendOrderConfirmationNotification(order: any) {
  try {
    const orderDetails = {
      orderNumber: order.orderNumber,
      studentName: order.user.name,
      studentEmail: order.user.email,
      totalAmount: order.totalAmount,
      status: 'PENDING',
      orderDate: order.orderDate.toLocaleDateString(),
      items: order.orderItems.map((item: any) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price
      }))
    }

    // Send Wati WhatsApp confirmation (NEW! - Using Wati)
    const watiResult = await sendWatiOrderNotification(order.user.id, orderDetails, 'confirmation')

    // Send email confirmation
    const emailResult = await sendOrderNotificationEmail(order.user.id, orderDetails, 'confirmation')

    console.log('📱 Multi-channel order confirmation sent:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      watiSuccess: watiResult.success, // Updated from whatsappSuccess
      emailSuccess: emailResult.success
    })

    return {
      success: watiResult.success || emailResult.success,
      watiNotification: watiResult, // Updated name
      emailNotification: emailResult
    }
  } catch (error) {
    console.error('❌ Failed to send multi-channel order confirmation:', error)
    return { success: false, error }
  }
}

// Function to send notifications when order is ready for pickup
export async function sendOrderReadyNotification(order: any) {
  try {
    const orderDetails = {
      orderNumber: order.orderNumber,
      studentName: order.user.name,
      studentEmail: order.user.email,
      totalAmount: order.totalAmount,
      status: 'READY',
      orderDate: order.orderDate.toLocaleDateString(),
      items: order.orderItems.map((item: any) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price
      })),
      estimatedPickupTime: order.estimatedPickupTime || '1 hour'
    }

    // Send push notification
    const notificationResult = await sendNotificationToUser(order.user.id, {
      title: '🎉 Order Ready!',
      body: `Your order #${order.orderNumber} is ready for pickup!`,
      tag: `order-ready-${order.id}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'READY',
        url: `/student/orders/${order.orderNumber}`
      }
    })

    // Send Wati WhatsApp ready notification (NEW! - Using Wati)
    const watiResult = await sendWatiOrderNotification(order.user.id, orderDetails, 'ready')

    // Send email notification
    const emailResult = await sendOrderNotificationEmail(order.user.id, orderDetails, 'status_update')

    console.log('📱 Order ready notifications sent:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      pushSuccess: notificationResult.success,
      watiSuccess: watiResult.success, // Updated name
      emailSuccess: emailResult.success
    })

    return {
      success: notificationResult.success || watiResult.success || emailResult.success,
      pushNotification: notificationResult,
      watiNotification: watiResult, // Updated name
      emailNotification: emailResult
    }
  } catch (error) {
    console.error('❌ Failed to send order ready notifications:', error)
    return { success: false, error }
  }
}