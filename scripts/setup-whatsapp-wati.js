#!/usr/bin/env node

/**
 * Wati WhatsApp API Setup Script for Aieraa Food Service
 * 
 * This script helps you set up Wati WhatsApp integration
 * Run: node scripts/setup-whatsapp-wati.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
🚀 Wati WhatsApp Setup for Aieraa Food Service
==============================================

Your Configuration:
📞 Phone: +919344141424 (India)
🌐 Domain: hostel.aieraa.com
💬 Platform: Wati (already configured)

Let's integrate Wati with your system! 📱
`);

// Wati message templates (no approval needed!)
const watiMessageTemplates = {
  orderConfirmation: {
    name: "Order Confirmation",
    message: `🍽️ *Order Confirmed!*

Hi {{customerName}}! Your meal order *#{{orderNumber}}* has been received and is being reviewed by our kitchen team.

📝 *Order Details:*
• Items: {{items}}
• Total: ₹{{totalAmount}}
• Date: {{orderDate}}

We'll notify you once approved! 👨‍🍳

View your order: https://hostel.aieraa.com/student/orders/{{orderNumber}}

_Aieraa Food Service_`,
    parameters: ["customerName", "orderNumber", "items", "totalAmount", "orderDate"]
  },

  statusUpdate: {
    name: "Order Status Update", 
    message: `📋 *Order Status Update*

Hi {{customerName}}! Your order *#{{orderNumber}}* status: *{{status}}*

{{statusMessage}}

💰 Total: ₹{{totalAmount}}
🕐 Updated: {{updatedTime}}

View details: https://hostel.aieraa.com/student/orders/{{orderNumber}}

_Aieraa Food Service_`,
    parameters: ["customerName", "orderNumber", "status", "statusMessage", "totalAmount", "updatedTime"]
  },

  orderReady: {
    name: "Order Ready for Pickup",
    message: `🎉 *Great news {{customerName}}!*

Your order *#{{orderNumber}}* is ready for pickup!

📍 *Pickup Instructions:*
• Go to Main Hostel Counter
• Show this message or your QR code
• Provide order number: *#{{orderNumber}}*

💰 Total: ₹{{totalAmount}}
⏰ Pickup by: {{pickupTime}}

Get directions: https://maps.google.com/your-location
Call counter: +919344141424

_Enjoy your meal! 😊_`,
    parameters: ["customerName", "orderNumber", "totalAmount", "pickupTime"]
  }
};

function printWatiSetup() {
  console.log(`
📋 WATI SETUP CHECKLIST:
========================

Step 1: Get Wati API Credentials
--------------------------------
1. Login to your Wati dashboard
2. Go to: Settings → API Documentation  
3. Copy your API endpoint and access token
4. Note: You're already using +919344141424

Step 2: Environment Configuration
---------------------------------
Add these to your .env file:

# Wati WhatsApp API Configuration
WATI_API_URL=https://live-server-6024.wati.io/api/v1
WATI_ACCESS_TOKEN=your_wati_api_token_here
WATI_PHONE_NUMBER=919344141424
WATI_INSTANCE_ID=your_instance_id

# Your website configuration
NEXT_PUBLIC_SITE_URL=https://hostel.aieraa.com

Step 3: Message Templates
-------------------------
✅ No approval needed with Wati!
✅ Can send any message format
✅ Templates ready to use immediately

Step 4: Webhook Setup (Optional)
--------------------------------
If you want to receive message responses:
Webhook URL: https://hostel.aieraa.com/api/whatsapp/wati-webhook

Step 5: Testing
---------------
1. Use admin panel: https://hostel.aieraa.com/admin/settings/notifications
2. Send test message to +919344141424
3. Check message delivery and formatting

🎯 INDIA-SPECIFIC NOTES:
=======================
• Phone format: 919344141424 (without + for API)
• Currency: ₹ (Indian Rupees)
• Timezone: IST (India Standard Time)
• Local compliance: Follow Indian telecom regulations

📞 WATI ADVANTAGES:
==================
✅ No template approval required
✅ Immediate message sending
✅ Rich formatting support
✅ File and image support
✅ Delivery reports
✅ Two-way messaging
✅ Broadcast capabilities

Happy messaging! 🚀📱
`);
}

// Generate Wati integration files
function generateWatiFiles() {
  const outputDir = path.join(__dirname, '..', 'wati-integration');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Save message templates
  fs.writeFileSync(
    path.join(outputDir, 'message-templates.json'),
    JSON.stringify(watiMessageTemplates, null, 2)
  );

  // Create Wati service implementation
  const watiServiceCode = `
// Wati WhatsApp Service Implementation
// File: src/lib/wati-whatsapp.ts

const WATI_API_URL = process.env.WATI_API_URL || 'https://live-server-6024.wati.io/api/v1'
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN
const WATI_PHONE_NUMBER = process.env.WATI_PHONE_NUMBER || '919344141424'

interface WatiMessageRequest {
  phone: string
  message: string
  media?: {
    type: 'image' | 'document' | 'audio' | 'video'
    url: string
    caption?: string
  }
}

class WatiWhatsAppService {
  private async sendMessage(data: WatiMessageRequest) {
    try {
      if (!WATI_ACCESS_TOKEN) {
        throw new Error('Wati access token not configured')
      }

      const response = await fetch(\`\${WATI_API_URL}/sendSessionMessage/\${data.phone}\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${WATI_ACCESS_TOKEN}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageText: data.message,
          ...(data.media && { media: data.media })
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(\`Wati API error: \${result.message || 'Unknown error'}\`)
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

  async sendOrderConfirmation(orderDetails: any) {
    const message = \`🍽️ *Order Confirmed!*

Hi \${orderDetails.studentName}! Your meal order *#\${orderDetails.orderNumber}* has been received and is being reviewed by our kitchen team.

📝 *Order Details:*
• Items: \${orderDetails.items.map(item => \`\${item.quantity}x \${item.name}\`).join(', ')}
• Total: ₹\${orderDetails.totalAmount.toLocaleString()}
• Date: \${orderDetails.orderDate}

We'll notify you once approved! 👨‍🍳

View your order: https://hostel.aieraa.com/student/orders/\${orderDetails.orderNumber}

_Aieraa Food Service_\`

    // Format phone number for India (remove +91 prefix for Wati)
    const phone = orderDetails.studentPhone?.replace(/^\+91/, '') || WATI_PHONE_NUMBER

    return this.sendMessage({
      phone,
      message
    })
  }

  async sendStatusUpdate(orderDetails: any) {
    const statusMessages = {
      'APPROVED': 'Your order has been approved and will be prepared soon! 👨‍🍳',
      'PREPARING': 'Your delicious meal is now being prepared in our kitchen. 🍳',
      'READY': 'Your order is ready for pickup! Please come to the counter. 🎉',
      'SERVED': 'Your order has been served successfully. Thank you! 😊',
      'CANCELLED': 'Your order has been cancelled. Contact us for assistance. ❌',
      'REJECTED': \`Your order has been rejected. \${orderDetails.rejectionReason || 'Please contact support.'} ⚠️\`
    }

    const statusMessage = statusMessages[orderDetails.status as keyof typeof statusMessages] || 'Your order status has been updated.'

    const message = \`📋 *Order Status Update*

Hi \${orderDetails.studentName}! Your order *#\${orderDetails.orderNumber}* status: *\${orderDetails.status}*

\${statusMessage}

💰 Total: ₹\${orderDetails.totalAmount.toLocaleString()}
🕐 Updated: \${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

View details: https://hostel.aieraa.com/student/orders/\${orderDetails.orderNumber}

_Aieraa Food Service_\`

    const phone = orderDetails.studentPhone?.replace(/^\+91/, '') || WATI_PHONE_NUMBER

    return this.sendMessage({
      phone,
      message
    })
  }

  async sendOrderReady(orderDetails: any) {
    const message = \`🎉 *Great news \${orderDetails.studentName}!*

Your order *#\${orderDetails.orderNumber}* is ready for pickup!

📍 *Pickup Instructions:*
• Go to Main Hostel Counter
• Show this message or your QR code
• Provide order number: *#\${orderDetails.orderNumber}*

💰 Total: ₹\${orderDetails.totalAmount.toLocaleString()}
⏰ Pickup by: \${orderDetails.estimatedPickupTime || '1 hour'}

Get directions: https://maps.google.com/your-location
Call counter: +919344141424

_Enjoy your meal! 😊_\`

    const phone = orderDetails.studentPhone?.replace(/^\+91/, '') || WATI_PHONE_NUMBER

    return this.sendMessage({
      phone,
      message
    })
  }

  async sendTestMessage(phone: string, message: string) {
    const testMessage = \`🧪 *Test Message*

\${message}

---
Sent from Aieraa Admin Panel
⏰ \${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

_Aieraa Food Service_\`

    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '')
    
    return this.sendMessage({
      phone: cleanPhone,
      message: testMessage
    })
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
      console.log(\`✅ Wati \${type} sent successfully:\`, {
        userId,
        phone: user.phone,
        orderNumber: orderDetails.orderNumber,
        messageId: result.messageId
      })
    } else {
      console.error(\`❌ Wati \${type} failed:\`, {
        userId,
        phone: user.phone,
        orderNumber: orderDetails.orderNumber,
        error: result.error
      })
    }

    return result
  } catch (error) {
    console.error(\`❌ Wati \${type} error:\`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
`;

  fs.writeFileSync(
    path.join(outputDir, 'wati-service.ts'),
    watiServiceCode
  );

  console.log(`✅ Wati integration files generated in: ${outputDir}/`);
}

// Create environment template for Wati
function createWatiEnvTemplate() {
  const envTemplate = `
# Wati WhatsApp API Configuration
# Get these values from your Wati dashboard

WATI_API_URL=https://live-server-6024.wati.io/api/v1
WATI_ACCESS_TOKEN=your_wati_api_token_here
WATI_PHONE_NUMBER=919344141424
WATI_INSTANCE_ID=your_wati_instance_id

# Your website configuration
NEXT_PUBLIC_SITE_URL=https://hostel.aieraa.com

# Example values (replace with your actual values):
# WATI_ACCESS_TOKEN=wati_api_token_abcd1234567890
# WATI_INSTANCE_ID=12345

# Webhook URL for receiving messages:
# https://hostel.aieraa.com/api/whatsapp/wati-webhook
`;

  fs.writeFileSync('.env.wati.template', envTemplate);
  console.log('✅ Wati environment template created: .env.wati.template');
}

// Main execution
printWatiSetup();
generateWatiFiles();
createWatiEnvTemplate();

console.log(`
🎉 Wati WhatsApp Setup Complete!
================================

Next steps:
1. Get your Wati API token from dashboard
2. Add credentials to .env file
3. Copy wati-service.ts to src/lib/
4. Test via admin panel: /admin/settings/notifications

Advantages of Wati:
✅ No template approval needed
✅ Ready to use immediately  
✅ Already configured with your number
✅ Simple integration

Need help? Check your Wati dashboard or contact support.
`);

export { watiMessageTemplates, printWatiSetup, generateWatiFiles }; 