import { prisma } from './prisma'

// Brevo API Configuration
const BREVO_API_URL = 'https://api.brevo.com/v3'
const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'team@aieraa.com' // More personal, no subdomain
const FROM_NAME = process.env.FROM_NAME || 'Aieraa Food Team' // Shorter, more personal

interface EmailRequest {
  to: string
  toName: string
  subject: string
  htmlContent: string
  textContent?: string
  templateId?: number
  params?: Record<string, any>
}

interface OrderDetails {
  orderNumber: string
  studentName: string
  studentEmail: string
  totalAmount: number
  status: string
  orderDate: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  university?: string
  rejectionReason?: string
  estimatedPickupTime?: string
}

class EmailService {
  private async sendEmail(emailData: EmailRequest) {
    try {
      if (!BREVO_API_KEY) {
        throw new Error('Brevo API key not configured')
      }

      const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            name: FROM_NAME,
            email: FROM_EMAIL,
          },
          to: [
            {
              email: emailData.to,
              name: emailData.toName,
            },
          ],
          subject: emailData.subject,
          htmlContent: emailData.htmlContent,
          textContent: emailData.textContent,
          // Add headers to improve deliverability
          headers: {
            'X-Mailer': 'Aieraa Food Service',
            'List-Unsubscribe': '<mailto:unsubscribe@aieraa.com>',
            'Reply-To': 'support@aieraa.com'
          },
          ...(emailData.templateId && { templateId: emailData.templateId }),
          ...(emailData.params && { params: emailData.params }),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`)
      }

      return {
        success: true,
        messageId: result.messageId,
        data: result,
      }
    } catch (error) {
      console.error('Email send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Generate email templates with more personal, conversational tone
  private generateOrderConfirmationHTML(orderDetails: OrderDetails): string {
    const itemsList = orderDetails.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₫${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `)
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your meal is on the way!</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #16803C 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Thanks for your meal request!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We're preparing something delicious for you</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #16803C; margin: 0 0 15px 0; font-size: 20px;">Hi ${orderDetails.studentName}!</h2>
              <p style="margin: 0; font-size: 16px; color: #666;">We've received your meal request and our kitchen team is reviewing it. You'll hear from us soon with an update!</p>
            </div>

            <!-- Order Details -->
            <div style="border: 2px solid #16803C; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #16803C; margin: 0 0 15px 0; font-size: 18px;">Your meal details</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold;">Meal ID:</span>
                <span style="color: #16803C; font-weight: bold; font-size: 18px;">#${orderDetails.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold;">Requested for:</span>
                <span>${orderDetails.orderDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold;">Status:</span>
                <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">Being reviewed</span>
              </div>
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #16803C; margin: 0 0 15px 0; font-size: 18px;">What you've selected</h3>
              <table style="width: 100%; border-collapse: collapse; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background-color: #16803C; color: white;">
                    <th style="padding: 12px; text-align: left;">Item</th>
                    <th style="padding: 12px; text-align: center;">Qty</th>
                    <th style="padding: 12px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td colspan="2" style="padding: 12px; text-align: right;">Total:</td>
                    <td style="padding: 12px; text-align: right; color: #16803C; font-size: 18px;">₫${orderDetails.totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; border-left: 4px solid #16803C;">
              <h3 style="color: #16803C; margin: 0 0 10px 0; font-size: 16px;">What happens next?</h3>
              <p style="margin: 0; font-size: 14px; color: #666;">
                • Our kitchen team will review your request<br>
                • You'll get another email when it's approved<br>
                • We'll let you know when your meal is ready for pickup<br>
                • Questions? Just reply to this email!
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p style="margin: 0;">
                Have questions? Reply to this email or contact us at support@aieraa.com
              </p>
              <p style="margin: 10px 0 0 0;">
                Best regards,<br>
                <strong>The Aieraa Food Team</strong>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateStatusUpdateHTML(orderDetails: OrderDetails): string {
    const statusMessages = {
      'APPROVED': {
        title: 'Great news - your meal is approved!',
        message: 'Our kitchen team has approved your meal request and started preparing it.',
        color: '#22c55e',
        icon: '✅'
      },
      'PREPARING': {
        title: 'Your meal is being prepared!',
        message: 'Our chefs are working on your meal right now. It should be ready soon!',
        color: '#f59e0b',
        icon: '👨‍🍳'
      },
      'READY': {
        title: 'Your meal is ready for pickup!',
        message: 'Your delicious meal is ready! Come pick it up when you\'re ready.',
        color: '#16803C',
        icon: '🎉'
      },
      'SERVED': {
        title: 'Meal delivered successfully!',
        message: 'Hope you enjoyed your meal! Thanks for choosing Aieraa.',
        color: '#8b5cf6',
        icon: '📦'
      },
      'CANCELLED': {
        title: 'Your meal request was cancelled',
        message: 'No worries! You can place a new meal request anytime.',
        color: '#ef4444',
        icon: '❌'
      },
      'REJECTED': {
        title: 'Your meal request needs attention',
        message: orderDetails.rejectionReason || 'Please contact us for more information.',
        color: '#f97316',
        icon: '⚠️'
      }
    }

    const status = statusMessages[orderDetails.status as keyof typeof statusMessages] || {
      title: 'Meal status updated',
      message: 'Your meal status has been updated.',
      color: '#6b7280',
      icon: '📋'
    }

    const itemsList = orderDetails.items
      .map(item => `<li>${item.quantity}x ${item.name}</li>`)
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${status.title}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${status.color} 0%, ${status.color}CC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${status.icon} ${status.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Meal #${orderDetails.orderNumber}</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: ${status.color}; margin: 0 0 15px 0; font-size: 20px;">Hi ${orderDetails.studentName}!</h2>
              <p style="margin: 0; font-size: 16px; color: #666;">${status.message}</p>
            </div>

            <!-- Quick Summary -->
            <div style="border: 2px solid ${status.color}; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: ${status.color}; margin: 0 0 15px 0; font-size: 18px;">Meal summary</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold;">Meal ID:</span>
                <span style="color: ${status.color}; font-weight: bold;">#${orderDetails.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold;">Total:</span>
                <span style="font-weight: bold;">₫${orderDetails.totalAmount.toLocaleString()}</span>
              </div>
              <div style="margin-top: 15px;">
                <strong>Items:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${itemsList}
                </ul>
              </div>
            </div>

            ${orderDetails.status === 'READY' ? `
            <!-- Pickup Instructions -->
            <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; border-left: 4px solid #16803C; margin-bottom: 25px;">
              <h3 style="color: #16803C; margin: 0 0 10px 0; font-size: 16px;">Pickup instructions</h3>
              <p style="margin: 0; font-size: 14px; color: #666;">
                • Come to the Main Hostel Counter<br>
                • Show your QR code (available in the app)<br>
                • Provide meal ID: #${orderDetails.orderNumber}<br>
                • Enjoy your meal!
              </p>
            </div>
            ` : ''}

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p style="margin: 0;">
                Questions? Just reply to this email or contact us at support@aieraa.com
              </p>
              <p style="margin: 10px 0 0 0;">
                Best regards,<br>
                <strong>The Aieraa Food Team</strong>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async sendOrderConfirmation(orderDetails: OrderDetails) {
    const htmlContent = this.generateOrderConfirmationHTML(orderDetails)
    const textContent = `
Hi ${orderDetails.studentName}!

Thanks for your meal request. We've received it and our kitchen team is reviewing it.

Meal Details:
- Meal ID: #${orderDetails.orderNumber}
- Requested for: ${orderDetails.orderDate}
- Total: ₫${orderDetails.totalAmount.toLocaleString()}
- Status: Being reviewed

Items:
${orderDetails.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n')}

What happens next?
• Our kitchen team will review your request
• You'll get another email when it's approved
• We'll let you know when your meal is ready for pickup
• Questions? Just reply to this email!

Have questions? Reply to this email or contact us at support@aieraa.com

Best regards,
The Aieraa Food Team
    `

    return this.sendEmail({
      to: orderDetails.studentEmail,
      toName: orderDetails.studentName,
      subject: `Your meal request #${orderDetails.orderNumber}`, // No emoji, more personal
      htmlContent,
      textContent
    })
  }

  async sendStatusUpdate(orderDetails: OrderDetails) {
    // More personal, conversational subject lines without emojis
    const statusSubjects = {
      'APPROVED': `Good news about your meal #${orderDetails.orderNumber}`,
      'PREPARING': `Your meal #${orderDetails.orderNumber} is being prepared`,
      'READY': `Your meal #${orderDetails.orderNumber} is ready!`,
      'SERVED': `Thanks for choosing Aieraa - meal #${orderDetails.orderNumber}`,
      'CANCELLED': `About your meal request #${orderDetails.orderNumber}`,
      'REJECTED': `Your meal request #${orderDetails.orderNumber} needs attention`
    }

    const subject = statusSubjects[orderDetails.status as keyof typeof statusSubjects] || 
                   `Update on your meal #${orderDetails.orderNumber}`

    const htmlContent = this.generateStatusUpdateHTML(orderDetails)
    const textContent = `
Hi ${orderDetails.studentName}!

${orderDetails.status === 'APPROVED' ? 'Great news - your meal is approved!' : 
  orderDetails.status === 'PREPARING' ? 'Your meal is being prepared!' :
  orderDetails.status === 'READY' ? 'Your meal is ready for pickup!' :
  orderDetails.status === 'SERVED' ? 'Meal delivered successfully!' :
  orderDetails.status === 'CANCELLED' ? 'Your meal request was cancelled' :
  orderDetails.status === 'REJECTED' ? 'Your meal request needs attention' :
  'Your meal status has been updated'}

Meal Details:
- Meal ID: #${orderDetails.orderNumber}
- Student: ${orderDetails.studentName}
- Total: ₫${orderDetails.totalAmount.toLocaleString()}
- Status: ${orderDetails.status}

Items:
${orderDetails.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n')}

${orderDetails.status === 'READY' ? `
Pickup Instructions:
1. Come to the Main Hostel Counter
2. Show your QR code (available in the app)
3. Provide meal ID: #${orderDetails.orderNumber}
4. Enjoy your meal!
` : ''}

${orderDetails.rejectionReason ? `
Reason: ${orderDetails.rejectionReason}
` : ''}

Questions? Just reply to this email or contact us at support@aieraa.com

Best regards,
The Aieraa Food Team
    `

    return this.sendEmail({
      to: orderDetails.studentEmail,
      toName: orderDetails.studentName,
      subject,
      htmlContent,
      textContent
    })
  }

  async sendTestEmail(email: string, name: string, message: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test message from Aieraa</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #16803C 0%, #22c55e 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="margin: 0;">Test message from Aieraa</h1>
          <p style="margin: 10px 0 0 0;">Making sure everything works perfectly!</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #16803C; margin-top: 0;">Hi ${name}!</h2>
          <p>${message}</p>
        </div>
        
        <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
          <p style="margin: 0; font-size: 14px;">This is a test message from your Aieraa Food Service</p>
          <p style="margin: 10px 0 0 0;">
            Best regards,<br>
            <strong>The Aieraa Team</strong>
          </p>
        </div>
      </body>
      </html>
    `

    const textContent = `
Hi ${name}!

${message}

This is a test message from your Aieraa Food Service.

Best regards,
The Aieraa Team
    `

    return this.sendEmail({
      to: email,
      toName: name,
      subject: `Test message from Aieraa`, // Simple, personal subject
      htmlContent,
      textContent
    })
  }
}

export const emailService = new EmailService()

// Helper function to send order notification emails
export async function sendOrderNotificationEmail(
  userId: string,
  orderDetails: OrderDetails,
  type: 'confirmation' | 'status_update'
) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })

    if (!user?.email || !user?.name) {
      console.error('❌ Email notification failed: User not found or missing email')
      return { success: false, error: 'User not found or missing email' }
    }

    // Update order details with user info
    const updatedOrderDetails = {
      ...orderDetails,
      studentName: user.name,
      studentEmail: user.email
    }

    let result
    if (type === 'confirmation') {
      result = await emailService.sendOrderConfirmation(updatedOrderDetails)
    } else {
      result = await emailService.sendStatusUpdate(updatedOrderDetails)
    }

    if (result.success) {
      console.log(`✅ ${type} email sent successfully:`, {
        userId,
        email: user.email,
        orderNumber: orderDetails.orderNumber,
        messageId: result.messageId
      })
    } else {
      console.error(`❌ ${type} email failed:`, {
        userId,
        email: user.email,
        orderNumber: orderDetails.orderNumber,
        error: result.error
      })
    }

    return result
  } catch (error) {
    console.error(`❌ ${type} email error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 