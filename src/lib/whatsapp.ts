import { prisma } from './prisma'

// WhatsApp Business API Configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
// const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN // Reserved for webhook verification

interface WhatsAppMessageRequest {
  to: string
  type: 'text' | 'template' | 'interactive' | 'image'
  text?: {
    body: string
    preview_url?: boolean
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components: any[]
  }
  interactive?: {
    type: 'button' | 'list'
    header?: any
    body: {
      text: string
    }
    action: any
  }
  image?: {
    link: string
    caption?: string
  }
}

interface OrderDetails {
  orderNumber: string
  studentName: string
  totalAmount: number
  status: string
  orderDate: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  qrCodeUrl?: string
  pickupLocation?: string
}

class WhatsAppService {
  private async sendMessage(phoneNumber: string, message: WhatsAppMessageRequest) {
    try {
      if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        throw new Error('WhatsApp API credentials not configured')
      }

      // Format phone number (ensure it has country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber)

      const response = await fetch(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            ...Object.fromEntries(Object.entries(message).filter(([key]) => key !== 'to')),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`)
      }

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
        data: result,
      }
    } catch (error) {
      console.error('WhatsApp send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')
    
    // Add Vietnam country code if not present
    if (cleaned.startsWith('84')) {
      return cleaned
    } else if (cleaned.startsWith('0')) {
      return '84' + cleaned.substring(1)
    } else {
      return '84' + cleaned
    }
  }

  // Send order confirmation message
  async sendOrderConfirmation(phoneNumber: string, orderDetails: OrderDetails) {
    const message: WhatsAppMessageRequest = {
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '🍽️ Order Confirmed!'
        },
        body: {
          text: `Hi ${orderDetails.studentName}!\n\nYour order #${orderDetails.orderNumber} has been placed successfully.\n\n💰 Total: ₫${orderDetails.totalAmount.toLocaleString()}\n📅 Date: ${orderDetails.orderDate}\n\nYour order is now pending approval. You'll receive updates as your order progresses.`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: `track_${orderDetails.orderNumber}`,
                title: 'Track Order'
              }
            },
            {
              type: 'reply',
              reply: {
                id: `help`,
                title: 'Need Help?'
              }
            }
          ]
        }
      }
    }

    return this.sendMessage(phoneNumber, message)
  }

  // Send order status update
  async sendOrderStatusUpdate(phoneNumber: string, orderDetails: OrderDetails) {
    const statusEmojis = {
      'APPROVED': '✅',
      'PREPARING': '👨‍🍳',
      'READY': '🎉',
      'SERVED': '📦',
      'CANCELLED': '❌',
      'REJECTED': '⚠️'
    }

    const statusMessages = {
      'APPROVED': 'Your order has been approved and will be prepared soon!',
      'PREPARING': 'Great news! Your order is now being prepared in the kitchen.',
      'READY': 'Your order is ready for pickup! Please come to the counter.',
      'SERVED': 'Order completed! Thank you for using our service.',
      'CANCELLED': 'Your order has been cancelled.',
      'REJECTED': 'Your order has been rejected. Please contact support.'
    }

    const emoji = statusEmojis[orderDetails.status as keyof typeof statusEmojis] || '📋'
    const statusMessage = statusMessages[orderDetails.status as keyof typeof statusMessages] || 'Order status updated'

    // For READY status, include QR code and pickup details
    if (orderDetails.status === 'READY' && orderDetails.qrCodeUrl) {
      // Send QR code image first
      await this.sendMessage(phoneNumber, {
        to: phoneNumber,
        type: 'image',
        image: {
          link: orderDetails.qrCodeUrl,
          caption: `🎉 Order #${orderDetails.orderNumber} is ready!\n\nShow this QR code at the pickup counter.\n📍 ${orderDetails.pickupLocation || 'Main Hostel Counter'}`
        }
      })

      // Then send interactive message with buttons
      const message: WhatsAppMessageRequest = {
        to: phoneNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: `${emoji} ${statusMessage}\n\nOrder #${orderDetails.orderNumber}\n👤 ${orderDetails.studentName}\n📍 Pickup: ${orderDetails.pickupLocation || 'Main Hostel Counter'}\n\nPlease show the QR code above when collecting your order.`
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: `directions`,
                  title: 'Get Directions'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: `contact_support`,
                  title: 'Contact Support'
                }
              }
            ]
          }
        }
      }

      return this.sendMessage(phoneNumber, message)
    }

    // For other statuses, send regular status update
    const message: WhatsAppMessageRequest = {
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `${emoji} ${statusMessage}\n\nOrder #${orderDetails.orderNumber}\n👤 ${orderDetails.studentName}\n💰 Total: ₫${orderDetails.totalAmount.toLocaleString()}`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: `track_${orderDetails.orderNumber}`,
                title: 'Track Order'
              }
            },
            {
              type: 'reply',
              reply: {
                id: `help`,
                title: 'Need Help?'
              }
            }
          ]
        }
      }
    }

    return this.sendMessage(phoneNumber, message)
  }

  // Send order summary with items
  async sendOrderSummary(phoneNumber: string, orderDetails: OrderDetails) {
    const itemsList = orderDetails.items
      .map(item => `• ${item.name} x${item.quantity} - ₫${(item.price * item.quantity).toLocaleString()}`)
      .join('\n')

    const message: WhatsAppMessageRequest = {
      to: phoneNumber,
      type: 'text',
      text: {
        body: `📋 Order Summary #${orderDetails.orderNumber}\n\n${itemsList}\n\n💰 Total: ₫${orderDetails.totalAmount.toLocaleString()}\n📅 Order Date: ${orderDetails.orderDate}\n\nThank you for your order!`,
        preview_url: false
      }
    }

    return this.sendMessage(phoneNumber, message)
  }

  // Send promotional message
  async sendPromotion(phoneNumber: string, title: string, message: string, imageUrl?: string) {
    if (imageUrl) {
      return this.sendMessage(phoneNumber, {
        to: phoneNumber,
        type: 'image',
        image: {
          link: imageUrl,
          caption: `🎉 ${title}\n\n${message}`
        }
      })
    }

    return this.sendMessage(phoneNumber, {
      to: phoneNumber,
      type: 'text',
      text: {
        body: `🎉 ${title}\n\n${message}`,
        preview_url: true
      }
    })
  }

  // Handle incoming webhooks (for interactive responses)
  async handleWebhook(body: any) {
    try {
      if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
        const message = body.entry[0].changes[0].value.messages[0]
        const from = message.from
        const messageType = message.type

        if (messageType === 'interactive') {
          const buttonReply = message.interactive?.button_reply
          if (buttonReply) {
            await this.handleButtonResponse(from, buttonReply.id)
          }
        } else if (messageType === 'text') {
          const text = message.text.body.toLowerCase()
          if (text.includes('track') || text.includes('order')) {
            await this.handleTrackingRequest(from)
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Webhook handling error:', error)
      return { success: false, error }
    }
  }

  private async handleButtonResponse(phoneNumber: string, buttonId: string) {
    if (buttonId.startsWith('track_')) {
      const orderNumber = buttonId.replace('track_', '')
      await this.sendTrackingInfo(phoneNumber, orderNumber)
    } else if (buttonId === 'help' || buttonId === 'contact_support') {
      await this.sendSupportInfo(phoneNumber)
    } else if (buttonId === 'directions') {
      await this.sendDirections(phoneNumber)
    }
  }

  private async handleTrackingRequest(phoneNumber: string) {
    // Find user's latest order
    const user = await prisma.user.findFirst({
      where: { phone: phoneNumber },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            }
          }
        }
      }
    })

    if (user?.orders?.[0]) {
      const order = user.orders[0]
      const orderDetails: OrderDetails = {
        orderNumber: order.orderNumber,
        studentName: user.name,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate.toLocaleDateString(),
        items: order.orderItems.map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity,
          price: item.price
        }))
      }

      await this.sendOrderStatusUpdate(phoneNumber, orderDetails)
    } else {
      await this.sendMessage(phoneNumber, {
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'No recent orders found. Please place an order through our app first.'
        }
      })
    }
  }

  private async sendTrackingInfo(phoneNumber: string, orderNumber: string) {
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: {
        user: true,
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (order && order.user.phone === phoneNumber) {
      const orderDetails: OrderDetails = {
        orderNumber: order.orderNumber,
        studentName: order.user.name,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate.toLocaleDateString(),
        items: order.orderItems.map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity,
          price: item.price
        }))
      }

      await this.sendOrderStatusUpdate(phoneNumber, orderDetails)
    } else {
      await this.sendMessage(phoneNumber, {
        to: phoneNumber,
        type: 'text',
        text: {
          body: `Order #${orderNumber} not found or doesn't belong to this number.`
        }
      })
    }
  }

  private async sendSupportInfo(phoneNumber: string) {
    await this.sendMessage(phoneNumber, {
      to: phoneNumber,
      type: 'text',
      text: {
        body: '🆘 Need Help?\n\n📞 Call Support: +84 XXX XXX XXX\n📧 Email: support@aieraa.com\n🕐 Hours: 6 AM - 10 PM daily\n\nOr reply with your question and we\'ll get back to you soon!'
      }
    })
  }

  private async sendDirections(phoneNumber: string) {
    await this.sendMessage(phoneNumber, {
      to: phoneNumber,
      type: 'text',
      text: {
        body: '📍 Pickup Location\n\nMain Hostel Counter\nGround Floor, Building A\n\n🚶‍♂️ From the main entrance:\n1. Enter the building\n2. Turn right after the reception\n3. Food counter is on your left\n\nLook for the "Food Pickup" sign!'
      }
    })
  }
}

export const whatsappService = new WhatsAppService()

// Helper function to send WhatsApp notification for order status changes
export async function sendWhatsAppOrderNotification(
  userId: string,
  orderDetails: OrderDetails,
  notificationType: 'confirmation' | 'status_update' | 'summary' = 'status_update'
) {
  try {
    // Get user's phone number
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, name: true }
    })

    if (!user?.phone) {
      console.log('No phone number found for user:', userId)
      return { success: false, error: 'No phone number' }
    }

    let result
    switch (notificationType) {
      case 'confirmation':
        result = await whatsappService.sendOrderConfirmation(user.phone, orderDetails)
        break
      case 'status_update':
        result = await whatsappService.sendOrderStatusUpdate(user.phone, orderDetails)
        break
      case 'summary':
        result = await whatsappService.sendOrderSummary(user.phone, orderDetails)
        break
      default:
        result = await whatsappService.sendOrderStatusUpdate(user.phone, orderDetails)
    }

    console.log('WhatsApp notification sent:', {
      userId,
      phone: user.phone,
      orderNumber: orderDetails.orderNumber,
      type: notificationType,
      success: result.success
    })

    return result
  } catch (error) {
    console.error('WhatsApp notification error:', error)
    return { success: false, error }
  }
} 