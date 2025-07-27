
// Wati WhatsApp Service Implementation
// File: src/lib/wati-whatsapp.ts

import { prisma } from './prisma'

// User's WATI configuration
const WATI_API_URL = process.env.WATI_API_URL || 'https://live-mt-server.wati.io/320431'
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyN2UxNzgxMC1mODY1LTQzNWYtYmRjYS1mNzIyZmEzN2NjYzMiLCJ1bmlxdWVfbmFtZSI6ImhlbGxvQHN0dWRlbnRzdHJhZmZpYy5jb20iLCJuYW1laWQiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiZW1haWwiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiYXV0aF90aW1lIjoiMDYvMTgvMjAyNSAxNjo0MTozOSIsInRlbmFudF9pZCI6IjMyMDQzMSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.8lKbFFEPiSTx6awxNdU3nq9Mhj3vLDiAF-iUpPb-y8I'

// Approved template configuration
const ORDER_CONFIRMATION_TEMPLATE = 'aieraa_food_order_confirmation'
const TEMPLATE_NAMESPACE = process.env.WATI_TEMPLATE_NAMESPACE || 'bc58e840_9936_490d_8bf4_8935dc18adf9'

interface WatiMessageRequest {
  phone: string
  message: string
  media?: {
    type: 'image' | 'document' | 'audio' | 'video'
    url: string
    caption?: string
  }
}

interface WatiTemplateRequest {
  phone: string
  template_name: string
  namespace: string
  language: string
  broadcast_name: string
  parameters: Array<{ name: string, value: string }>
}

class WatiWhatsAppService {
  private async sendMessage(data: WatiMessageRequest) {
    try {
      if (!WATI_ACCESS_TOKEN) {
        throw new Error('Wati access token not configured')
      }

      const response = await fetch(`${WATI_API_URL}/api/v1/sendSessionMessage/${data.phone}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageText: data.message,
          ...(data.media && { media: data.media })
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`Wati API error: ${result.message || 'Unknown error'}`)
      }

      return {
        success: true,
        messageId: result.messageId,
        data: result
      }
    } catch (error) {
      console.error('Wati message send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async sendTemplate(data: WatiTemplateRequest) {
    try {
      if (!WATI_ACCESS_TOKEN) {
        throw new Error('Wati access token not configured')
      }

      // CORRECT WATI FORMAT: Phone number in URL query parameter
      const endpoint = `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${data.phone}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_name: data.template_name,
          namespace: data.namespace,
          language: data.language,
          broadcast_name: data.broadcast_name,
          parameters: data.parameters
        })
      })

      const result = await response.json()

      if (!response.ok || result.result === false) {
        throw new Error(`Wati Template API error: ${result.info || result.message || response.statusText}`)
      }

      return {
        success: true,
        messageId: result.messageId || result.id || 'template_sent',
        data: result
      }
    } catch (error) {
      console.error('Wati template send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async sendOrderConfirmation(orderDetails: any) {
    // Format items list
    const itemsList = orderDetails.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')
    
    // Format date
    const orderDate = new Date(orderDetails.orderDate || orderDetails.deliveryDate).toLocaleDateString('en-IN')
    
    // Template parameters in the format WATI expects (name-value pairs)
    // {{1}} - Student name, {{2}} - Order number, {{3}} - Items list, {{4}} - Total amount, {{5}} - Order date
    const parameters = [
      { name: "1", value: orderDetails.studentName || 'Student' },
      { name: "2", value: orderDetails.orderNumber || orderDetails.id },
      { name: "3", value: itemsList },
      { name: "4", value: orderDetails.totalAmount?.toString() || '0' },
      { name: "5", value: orderDate }
    ]

    // Format phone number for India - ensure country code is included
    let phone = orderDetails.studentPhone?.replace(/\D/g, '') || '8885333635'
    if (!phone.startsWith('91')) {
      phone = '91' + phone
    }

    console.log('📨 Sending order confirmation template:', {
      phone,
      template: ORDER_CONFIRMATION_TEMPLATE,
      parameters: parameters.map(p => `{{${p.name}}}=${p.value}`)
    })

    return this.sendTemplate({
      phone,
      template_name: ORDER_CONFIRMATION_TEMPLATE,
      namespace: TEMPLATE_NAMESPACE,
      language: 'en',
      broadcast_name: 'order_confirmation',
      parameters
    })
  }

  async sendStatusUpdate(orderDetails: any) {
    const statusMessages = {
      'APPROVED': 'Your order has been approved and will be prepared soon! 👨‍🍳',
      'PREPARING': 'Your delicious meal is now being prepared in our kitchen. 🍳',
      'READY': 'Your order is ready for pickup! Please come to the counter. 🎉',
      'SERVED': 'Your order has been served successfully. Thank you! 😊',
      'CANCELLED': 'Your order has been cancelled. Contact us for assistance. ❌',
      'REJECTED': `Your order has been rejected. ${orderDetails.rejectionReason || 'Please contact support.'} ⚠️`
    }

    const statusMessage = statusMessages[orderDetails.status as keyof typeof statusMessages] || 'Your order status has been updated.'

    const message = `📋 *Order Status Update*

Hi ${orderDetails.studentName}! Your order *#${orderDetails.orderNumber}* status: *${orderDetails.status}*

${statusMessage}

💰 Total: ₹${orderDetails.totalAmount.toLocaleString()}
🕐 Updated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

View details: https://hostel.aieraa.com/student/orders/${orderDetails.orderNumber}

_Aieraa Food Service_`

    const phone = orderDetails.studentPhone?.replace(/^\+91/, '').replace(/\D/g, '') || '8885333635'

    return this.sendMessage({
      phone,
      message
    })
  }

  async sendOrderReady(orderDetails: any) {
    const message = `🎉 *Great news ${orderDetails.studentName}!*

Your order *#${orderDetails.orderNumber}* is ready for pickup!

📍 *Pickup Instructions:*
• Go to Main Hostel Counter
• Show this message or your QR code
• Provide order number: *#${orderDetails.orderNumber}*

💰 Total: ₹${orderDetails.totalAmount.toLocaleString()}
⏰ Pickup by: ${orderDetails.estimatedPickupTime || '1 hour'}

Get directions: https://maps.google.com/your-location

_Enjoy your meal! 😊_`

    const phone = orderDetails.studentPhone?.replace(/^\+91/, '').replace(/\D/g, '') || '8885333635'

    return this.sendMessage({
      phone,
      message
    })
  }

  async sendTestMessage(phone: string, message: string) {
    const testMessage = `🧪 *Test Message*

${message}

---
Sent from Aieraa Admin Panel
⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

_Aieraa Food Service_`

    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '')
    
    return this.sendMessage({
      phone: cleanPhone,
      message: testMessage
    })
  }

  async sendTestOrderConfirmation(phone: string) {
    // Test order data
    const testOrderDetails = {
      studentName: 'Test Student',
      orderNumber: 'TEST001',
      items: [
        { name: 'Chicken Biryani', quantity: 1 },
        { name: 'Raita', quantity: 1 }
      ],
      totalAmount: 250,
      orderDate: new Date().toISOString(),
      studentPhone: phone
    }

    console.log('🧪 Sending test order confirmation template to:', phone)
    console.log('📋 Test order details:', testOrderDetails)
    console.log('🔑 Using namespace:', TEMPLATE_NAMESPACE)
    console.log('✅ Using CORRECT WATI format (phone in URL)')
    
    return this.sendOrderConfirmation(testOrderDetails)
  }
}

export const watiWhatsAppService = new WatiWhatsAppService()

// Helper function for order notifications
export async function sendWatiOrderNotification(
  userId: string,
  orderDetails: any,
  type: 'confirmation' | 'status_update' | 'ready'
) {
  try {
    // Get user phone number
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, name: true }
    })

    if (!user?.phone) {
      console.error('❌ Wati notification failed: User phone not found')
      return { success: false, error: 'User phone not found' }
    }

    // Add user info to order details
    const completeOrderDetails = {
      ...orderDetails,
      studentName: user.name,
      studentPhone: user.phone
    }

    let result
    switch (type) {
      case 'confirmation':
        result = await watiWhatsAppService.sendOrderConfirmation(completeOrderDetails)
        break
      case 'status_update':
        result = await watiWhatsAppService.sendStatusUpdate(completeOrderDetails)
        break
      case 'ready':
        result = await watiWhatsAppService.sendOrderReady(completeOrderDetails)
        break
      default:
        result = await watiWhatsAppService.sendStatusUpdate(completeOrderDetails)
    }

    if (result.success) {
      console.log(`✅ Wati ${type} sent successfully:`, {
        userId,
        phone: user.phone,
        orderNumber: orderDetails.orderNumber,
        messageId: result.messageId
      })
    } else {
      console.error(`❌ Wati ${type} failed:`, {
        userId,
        phone: user.phone,
        orderNumber: orderDetails.orderNumber,
        error: result.error
      })
    }

    return result
  } catch (error) {
    console.error(`❌ Wati ${type} error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
