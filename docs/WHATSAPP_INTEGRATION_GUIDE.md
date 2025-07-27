# 📱 WhatsApp Business API Integration Guide

## Overview

Your Aieraa Hostel Food Ordering System now supports **WhatsApp Business API** for sending rich, interactive order notifications to students. This provides a superior alternative to SMS with better engagement rates and rich media support.

## 🌟 **Why WhatsApp > SMS for Vietnam**

| Feature | WhatsApp | SMS |
|---------|----------|-----|
| **Open Rate** | 98% | 82% |
| **Character Limit** | Unlimited | 160 chars |
| **Rich Media** | ✅ Images, QR codes, buttons | ❌ Text only |
| **Interactive** | ✅ Action buttons, replies | ❌ One-way |
| **Cost** | Lower in Vietnam | Higher |
| **User Experience** | Native app, better UX | Basic text |

## 🚀 **Features Implemented**

### **📨 Automated Notifications**
- ✅ **Order Confirmation** - Rich confirmation with order details
- ✅ **Status Updates** - Real-time order status changes
- ✅ **QR Code Delivery** - Automatic QR code sharing when order is ready
- ✅ **Interactive Buttons** - Track order, get directions, contact support
- ✅ **Two-way Communication** - Students can reply and get automated responses

### **📱 Message Types**
1. **Order Confirmation**: Complete order details with interactive buttons
2. **Status Updates**: PENDING → APPROVED → PREPARING → READY → SERVED
3. **QR Code Messages**: Image + caption when order is ready for pickup
4. **Support Messages**: Automated help responses and directions

## 🛠️ **Setup Instructions**

### **Step 1: Create Meta Business Account**

1. **Go to Meta Business**: https://business.facebook.com/
2. **Create Business Account** or use existing
3. **Add WhatsApp Business Platform**

### **Step 2: Set Up WhatsApp Business API**

1. **Create WhatsApp Business App**:
   ```
   1. Go to Facebook Developers (https://developers.facebook.com/)
   2. Click "Create App" → "Business" → Enter app details
   3. Add "WhatsApp Business Platform" product
   ```

2. **Get Phone Number ID**:
   ```
   1. In WhatsApp Business Platform dashboard
   2. Go to "API Setup" → Copy "Phone number ID"
   3. Note: This is different from your actual phone number
   ```

3. **Generate Access Token**:
   ```
   1. Go to "API Setup" → "Temporary access token" (for testing)
   2. For production: Generate permanent token in "System Users"
   3. Grant WhatsApp Business Platform permissions
   ```

4. **Configure Webhook**:
   ```
   Webhook URL: https://your-domain.com/api/whatsapp/webhook
   Verify Token: your_custom_secure_token (choose any secure string)
   Subscribe to: messages, message_status
   ```

### **Step 3: Environment Variables**

Add to your `.env.local` or production environment:

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_VERIFY_TOKEN=your_secure_webhook_verify_token
```

### **Step 4: Phone Number Verification**

1. **Business Verification**:
   ```
   - Meta will review your business (can take 1-7 days)
   - Provide business documents if requested
   - Once approved, you can send messages to any number
   ```

2. **Before Verification** (Testing):
   ```
   - You can only send messages to verified test numbers
   - Add test numbers in WhatsApp Business Platform dashboard
   - Test with your own WhatsApp number first
   ```

### **Step 5: Deploy & Test**

1. **Deploy to Production**:
   ```bash
   # Update environment variables in Vercel/your hosting
   vercel env add WHATSAPP_PHONE_NUMBER_ID
   vercel env add WHATSAPP_ACCESS_TOKEN
   vercel env add WHATSAPP_VERIFY_TOKEN
   
   # Redeploy
   vercel --prod
   ```

2. **Verify Webhook**:
   ```bash
   # Test webhook verification
   curl "https://your-domain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test"
   ```

3. **Test Order Flow**:
   ```
   1. Place a test order in the app
   2. Check WhatsApp for confirmation message
   3. Change order status as admin/manager
   4. Verify status update messages
   ```

## 📱 **Message Examples**

### **Order Confirmation**
```
🍽️ Order Confirmed!

Hi John Doe!

Your order #AH000123 has been placed successfully.

💰 Total: ₫125,000
📅 Date: 2024-01-15

Your order is now pending approval. You'll receive updates as your order progresses.

[Track Order] [Need Help?]
```

### **Order Ready + QR Code**
```
[QR CODE IMAGE]

🎉 Order #AH000123 is ready!

Show this QR code at the pickup counter.
📍 Main Hostel Counter

---

🎉 Your order is ready for pickup! 🍽️

Order #AH000123
👤 John Doe
📍 Pickup: Main Hostel Counter

Please show the QR code above when collecting your order.

[Get Directions] [Contact Support]
```

### **Interactive Responses**
Students can:
- **Reply "track"** → Get latest order status
- **Click "Track Order"** → Receive current order details
- **Click "Get Directions"** → Receive pickup location info
- **Click "Contact Support"** → Get support contact details

## 💰 **Pricing & Limits**

### **WhatsApp Business API Costs**
- **Business-initiated messages**: ~$0.005 - $0.01 per message
- **User-initiated responses**: Free within 24-hour window
- **Much cheaper than SMS** in Vietnam

### **Message Limits**
- **Before verification**: 250 messages/day
- **After verification**: 1,000+ messages/day (scales automatically)
- **Rate limits**: 80 messages/second

## 🔧 **Advanced Features**

### **Rich Media Support**
```javascript
// Send QR code with order ready notification
await whatsappService.sendMessage(phoneNumber, {
  type: 'image',
  image: {
    link: 'https://your-domain.com/api/orders/123/qr',
    caption: '🎉 Your order is ready! Show this QR code at pickup.'
  }
})
```

### **Interactive Templates**
```javascript
// Buttons for user actions
interactive: {
  type: 'button',
  body: { text: 'Your order status has been updated!' },
  action: {
    buttons: [
      { type: 'reply', reply: { id: 'track', title: 'Track Order' } },
      { type: 'reply', reply: { id: 'help', title: 'Need Help?' } }
    ]
  }
}
```

### **Automated Responses**
The system automatically handles:
- Order tracking requests
- Support inquiries
- Pickup directions
- General help messages

## 📊 **Integration with Existing System**

### **Multi-Channel Notifications**
```javascript
// Both push notifications AND WhatsApp messages
await sendOrderStatusNotification(order, 'APPROVED')
// Sends:
// 1. Push notification (existing)
// 2. WhatsApp message (new!)
```

### **Fallback Strategy**
```javascript
// If WhatsApp fails, other notifications still work
const result = await sendMultiChannelNotification(order)
// result.pushNotification.success
// result.whatsappNotification.success
```

## 🛡️ **Security & Compliance**

### **Data Protection**
- ✅ **Encrypted QR codes** with order validation
- ✅ **Signed webhooks** from Meta
- ✅ **Access control** for order information
- ✅ **24-hour QR expiry** for security

### **Privacy Compliance**
- ✅ **Opt-in messaging** (users provide phone numbers)
- ✅ **User data protection** (no sharing with Meta)
- ✅ **Message encryption** in transit

## 🚀 **Go Live Checklist**

### **Pre-Launch**
- [ ] Meta Business Account verified
- [ ] WhatsApp Business API approved
- [ ] Environment variables configured
- [ ] Webhook endpoint verified
- [ ] Test messages working

### **Launch**
- [ ] Update user registration to collect phone numbers
- [ ] Deploy with WhatsApp integration
- [ ] Monitor message delivery rates
- [ ] Set up error alerting
- [ ] Train support team on WhatsApp responses

### **Post-Launch**
- [ ] Monitor engagement rates
- [ ] Collect user feedback
- [ ] Optimize message templates
- [ ] Scale message limits as needed

## 🎯 **Expected Results**

### **Engagement Improvements**
- **98% message open rate** (vs 82% for SMS)
- **Higher student satisfaction** with rich notifications
- **Reduced support inquiries** with interactive help
- **Better pickup efficiency** with QR code delivery

### **Operational Benefits**
- **Lower notification costs** compared to SMS
- **Rich order information** in messages
- **Automated customer support** responses
- **Integrated pickup workflow** with QR codes

---

## 🆘 **Troubleshooting**

### **Common Issues**

**1. Messages not delivering:**
```
- Check phone number format (+84 country code)
- Verify business account status
- Check access token permissions
- Ensure webhook is responding
```

**2. Webhook verification failing:**
```
- Verify WHATSAPP_VERIFY_TOKEN matches Meta settings
- Check webhook URL is accessible
- Ensure GET endpoint returns challenge correctly
```

**3. QR codes not generating:**
```
- Check QRCode package installation
- Verify image generation permissions
- Test /api/orders/[id]/qr endpoint directly
```

### **Support Contacts**
- **Meta Business Support**: https://business.facebook.com/help
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **System Issues**: Check application logs and error monitoring

---

**WhatsApp Business API integration complete! 🎉**

Your students will now receive rich, interactive order notifications via WhatsApp, providing a superior experience compared to traditional SMS notifications. 