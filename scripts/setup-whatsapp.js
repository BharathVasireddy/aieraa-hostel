#!/usr/bin/env node

/**
 * WhatsApp Business API Setup Script
 * 
 * This script helps you set up WhatsApp Business API integration
 * Run: node scripts/setup-whatsapp.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
🚀 WhatsApp Business API Setup for Aieraa Food Service
=======================================================

This script will guide you through setting up WhatsApp Business API.

Prerequisites:
✅ Meta Business Account (Facebook Business Manager)
✅ Phone number for WhatsApp Business API
✅ Domain/server for webhook (you have this!)

Let's start! 📱
`);

// Template configurations
const templates = {
  order_confirmation: {
    name: "aieraa_order_confirmation",
    language: "en",
    category: "TRANSACTIONAL", 
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "🍽️ Order Confirmed!"
      },
      {
        type: "BODY",
        text: "Hi {{1}}! Your meal order #{{2}} has been received and is being reviewed by our kitchen team.\\n\\n📝 Order Details:\\n• Items: {{3}}\\n• Total: ₫{{4}}\\n• Date: {{5}}\\n\\nWe'll notify you once approved! 👨‍🍳"
      },
      {
        type: "FOOTER",
        text: "Aieraa Food Service"
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Order",
            url: "https://your-domain.com/student/orders/{{6}}"
          },
          {
            type: "PHONE_NUMBER", 
            text: "Call Support",
            phone_number: "+84901234567"
          }
        ]
      }
    ]
  },

  order_status_update: {
    name: "aieraa_order_status",
    language: "en",
    category: "TRANSACTIONAL",
    components: [
      {
        type: "HEADER",
        format: "TEXT", 
        text: "📋 Order Status Update"
      },
      {
        type: "BODY",
        text: "Hi {{1}}! Your order #{{2}} status: *{{3}}*\\n\\n{{4}}\\n\\nTotal: ₫{{5}}\\nUpdated: {{6}}"
      },
      {
        type: "FOOTER",
        text: "Aieraa Food Service"
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Details", 
            url: "https://your-domain.com/student/orders/{{7}}"
          }
        ]
      }
    ]
  },

  order_ready_pickup: {
    name: "aieraa_order_ready",
    language: "en", 
    category: "TRANSACTIONAL",
    components: [
      {
        type: "HEADER",
        format: "IMAGE"
      },
      {
        type: "BODY",
        text: "🎉 Great news {{1}}! Your order #{{2}} is ready for pickup!\\n\\n📍 *Pickup Instructions:*\\n• Go to Main Hostel Counter\\n• Show the QR code above ☝️\\n• Provide order number: #{{2}}\\n\\nTotal: ₫{{3}}\\nPickup by: {{4}}"
      },
      {
        type: "FOOTER",
        text: "Enjoy your meal! 😊"
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "Get Directions",
            url: "https://maps.google.com/your-location"
          },
          {
            type: "PHONE_NUMBER",
            text: "Call Counter", 
            phone_number: "+84901234567"
          }
        ]
      }
    ]
  }
};

function printSetupSteps() {
  console.log(`
📋 SETUP CHECKLIST:
==================

Step 1: Meta Developer Account Setup
------------------------------------
1. Go to: https://developers.facebook.com/
2. Create App > Business > Add WhatsApp Product
3. Note down these values:
   - App ID
   - App Secret
   - Phone Number ID
   - Access Token

Step 2: Phone Number Configuration
----------------------------------
1. Add your phone number in WhatsApp settings
2. Verify via SMS
3. For Vietnam: +84 901 234 567 format

Step 3: Webhook Configuration
-----------------------------
1. In WhatsApp > Configuration > Webhooks
2. Webhook URL: https://your-domain.com/api/whatsapp/webhook
3. Verify Token: create_your_own_secret_token
4. Subscribe to: messages, message_deliveries, message_reads

Step 4: Environment Variables
-----------------------------
Add these to your .env file:

WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_from_meta
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_from_meta  
WHATSAPP_VERIFY_TOKEN=your_custom_webhook_verify_token

Step 5: Message Templates
-------------------------
Create these templates in Meta Business Manager:
`);

  Object.keys(templates).forEach((key, index) => {
    console.log(`
${index + 1}. Template: ${templates[key].name}
   Category: ${templates[key].category}
   Language: ${templates[key].language}
   
   Use this JSON to create in Meta:
   ${JSON.stringify(templates[key], null, 2)}
`);
  });

  console.log(`
Step 6: Testing
---------------
1. Use admin panel: http://localhost:3000/admin/settings/notifications
2. Send test WhatsApp message
3. Check message delivery and formatting

Step 7: Production Deployment
-----------------------------
1. Update webhook URL with production domain
2. Update environment variables in production
3. Test with real phone numbers
4. Submit templates for approval (if needed)

🎯 VIETNAM-SPECIFIC NOTES:
=========================
• Phone format: +84 901 234 567
• Templates may need Vietnamese translations
• Business verification might be required
• Consider local payment methods integration

📞 SUPPORT:
===========
• Meta Developer Docs: https://developers.facebook.com/docs/whatsapp
• WhatsApp Business API: https://business.whatsapp.com/
• Template Guidelines: https://developers.facebook.com/docs/whatsapp/message-templates

Happy messaging! 🚀📱
`);
}

// Export template configurations for API use
function generateTemplateFiles() {
  const outputDir = path.join(__dirname, '..', 'whatsapp-templates');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  Object.keys(templates).forEach(key => {
    const filename = path.join(outputDir, `${key}.json`);
    fs.writeFileSync(filename, JSON.stringify(templates[key], null, 2));
    console.log(`✅ Template saved: ${filename}`);
  });

  // Create a summary file
  const summary = {
    total_templates: Object.keys(templates).length,
    templates: Object.keys(templates).map(key => ({
      name: templates[key].name,
      category: templates[key].category,
      language: templates[key].language,
      file: `${key}.json`
    })),
    next_steps: [
      "1. Review each template JSON file",
      "2. Submit templates via Meta Business Manager", 
      "3. Wait for approval (usually 24-48 hours)",
      "4. Test with approved templates"
    ]
  };

  fs.writeFileSync(
    path.join(outputDir, 'README.json'), 
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`\n📁 Template files generated in: ${outputDir}/`);
}

// Create environment template
function createEnvTemplate() {
  const envTemplate = `
# WhatsApp Business API Configuration
# Get these values from Meta Developer Console

WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_from_meta
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_from_meta
WHATSAPP_VERIFY_TOKEN=your_custom_webhook_verify_token

# Example values (replace with your actual values):
# WHATSAPP_PHONE_NUMBER_ID=123456789012345
# WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# WHATSAPP_VERIFY_TOKEN=my_secret_verify_token_12345

# Production webhook URL:
# https://your-domain.com/api/whatsapp/webhook

# Test phone numbers (for development):
# +84901234567 (Vietnam format)
# +1234567890 (International format)
`;

  fs.writeFileSync('.env.whatsapp.template', envTemplate);
  console.log('✅ Environment template created: .env.whatsapp.template');
}

// Main execution
printSetupSteps();
generateTemplateFiles();
createEnvTemplate();

console.log(`
🎉 WhatsApp Setup Script Complete!
==================================

Next steps:
1. Follow the setup checklist above
2. Check generated template files in whatsapp-templates/
3. Use .env.whatsapp.template for environment setup
4. Test via admin panel: /admin/settings/notifications

Need help? Check the documentation:
📚 docs/WHATSAPP_INTEGRATION_GUIDE.md
`);

export { templates, printSetupSteps, generateTemplateFiles }; 