# 📧 Brevo Email Integration Guide

## Overview

Your Aieraa Hostel Food Ordering System now supports **Brevo (formerly SendinBlue) email notifications** for sending professional HTML emails to students for order updates. This completes your **triple-channel notification system**: Push notifications + WhatsApp + Email.

## 🌟 **Why Email Notifications?**

| Feature | Email | SMS | WhatsApp |
|---------|-------|-----|----------|
| **Professional Look** | ✅ Rich HTML templates | ❌ Plain text | ✅ Rich messages |
| **Detailed Information** | ✅ Full order details | ❌ Character limits | ✅ Good detail |
| **Universal Access** | ✅ Works everywhere | ✅ Universal | ⚠️ Requires WhatsApp |
| **Cost** | Very low (~$0.001/email) | Higher | Low |
| **Branding** | ✅ Full branding control | ❌ No branding | ⚠️ Limited branding |
| **Clickable Links** | ✅ Direct to order page | ❌ No links | ✅ Links work |

## 🚀 **Features Implemented**

### **📨 Email Types**
- ✅ **Order Confirmation** - Rich HTML with order details table
- ✅ **Status Updates** - Status-specific colors and messaging
- ✅ **Pickup Instructions** - When order is ready with QR code links
- ✅ **Test Emails** - Admin testing functionality

### **🎨 Template Features**
- ✅ **Mobile-responsive design** - Perfect on all devices
- ✅ **Brand colors** - Green theme matching your app
- ✅ **Order details table** - Complete item breakdown
- ✅ **Status-specific styling** - Different colors for each status
- ✅ **Direct action links** - Click to view order details
- ✅ **Support information** - Contact details included

## 🛠️ **Setup Instructions**

### **Step 1: Brevo Account Setup**

1. **Create Brevo Account**: 
   - Go to https://www.brevo.com/
   - Sign up for free account (300 emails/day free)
   - Verify your email and complete setup

2. **Get API Key**:
   ```
   1. Log in to Brevo dashboard
   2. Go to "SMTP & API" → "API Keys"
   3. Click "Generate a new API key"
   4. Copy the key (starts with xkeysib-)
   ```

3. **Verify Sender Domain** (Important!):
   ```
   1. Go to "Senders & IP" → "Senders"
   2. Add your domain (hostel.aieraa.com)
   3. Verify DNS records as instructed
   4. Wait for verification (can take 24-48 hours)
   ```

### **Step 2: Environment Configuration**

Add to your `.env.local` or production environment:

```bash
# Brevo Email API Configuration
BREVO_API_KEY=your_brevo_api_key_here
FROM_EMAIL=orders@hostel.aieraa.com
FROM_NAME=Aieraa Hostel Food Service
```

### **Step 3: DNS Configuration**

For domain verification, add these DNS records to your `aieraa.com` domain:

```dns
# SPF Record (TXT)
Name: @
Value: v=spf1 include:spf.brevo.com ~all

# DKIM Record (TXT) 
Name: mail._domainkey
Value: [Provided by Brevo after domain setup]

# Return-Path (CNAME)
Name: mail
Value: mail.brevo.com
```

### **Step 4: Test Integration**

1. **Deploy with Environment Variables**:
   ```bash
   # For Vercel
   vercel env add BREVO_API_KEY
   vercel env add FROM_EMAIL
   vercel env add FROM_NAME
   
   # Redeploy
   vercel --prod
   ```

2. **Test Email Sending**:
   - Go to `/admin/settings/notifications` in your admin panel
   - Switch to "Email Settings" tab
   - Send a test email to yourself
   - Check both inbox and spam folders

## 📱 **Email Templates**

### **Order Confirmation Email**

```html
Subject: 🍽️ Order Confirmed - #AH000123

Features:
- Green gradient header with order confirmation
- Complete order details table
- Status information and timeline
- Direct link to order page
- Support contact information
- Mobile-responsive design
```

### **Status Update Email**

```html
Subject: ✅ Order Approved - #AH000123

Features:
- Status-specific colors and messaging
- Order information summary
- Pickup instructions (when ready)
- Action buttons/links
- Professional branding
```

### **Status-Specific Styling**

| Status | Color Theme | Emoji | Message |
|--------|-------------|-------|---------|
| **APPROVED** | Green | ✅ | Order approved and will be prepared soon |
| **PREPARING** | Yellow | 👨‍🍳 | Order is being prepared in kitchen |
| **READY** | Blue | 🎉 | Order ready for pickup with instructions |
| **SERVED** | Green | 📦 | Order completed successfully |
| **CANCELLED** | Red | ❌ | Order cancelled with reason |
| **REJECTED** | Red | ⚠️ | Order rejected with explanation |

## 📊 **Integration with Existing System**

### **Multi-Channel Flow**
```javascript
// When order status changes, all three channels are triggered:
await sendOrderStatusNotification(order, 'APPROVED')

// This sends:
// 1. Push notification (existing)
// 2. WhatsApp message (existing) 
// 3. Email notification (NEW!)
```

### **Fallback Strategy**
```javascript
// If any channel fails, others continue working
const result = await sendOrderStatusNotification(order, status)

console.log('Notification results:', {
  pushNotification: result.pushNotification.success,
  whatsappNotification: result.whatsappNotification.success,
  emailNotification: result.emailNotification.success  // NEW!
})
```

### **Automatic Triggers**
- **Order Placed** → Confirmation email sent automatically
- **Status Changed** → Update email sent automatically  
- **Order Ready** → Email with pickup instructions and QR code link

## 💡 **Email Content Examples**

### **Sample Order Confirmation**
```
Subject: 🍽️ Order Confirmed - #AH000123

Hi John Doe! 👋

Your order has been successfully placed and is now awaiting approval.

📋 ORDER DETAILS
Order Number: #AH000123
Order Date: 2024-01-15
Status: PENDING APPROVAL
Total: ₫125,000

🍛 YOUR ITEMS
┌────────────────────────┬─────┬──────────┐
│ Item                   │ Qty │ Amount   │
├────────────────────────┼─────┼──────────┤
│ Chicken Fried Rice     │  2  │ ₫80,000  │
│ Spring Rolls          │  1  │ ₫25,000  │
│ Thai Iced Tea         │  1  │ ₫20,000  │
├────────────────────────┼─────┼──────────┤
│ TOTAL                  │     │ ₫125,000 │
└────────────────────────┴─────┴──────────┘

⏰ WHAT'S NEXT?
1. Kitchen staff will review your order
2. You'll receive notifications when approved
3. We'll notify you when ready for pickup
4. Show your QR code at pickup

[📱 View Order Details]

Need help? Contact support@aieraa.com
```

### **Sample Status Update (Order Ready)**
```
Subject: 🎉 Order Ready for Pickup - #AH000123

ORDER STATUS: READY FOR PICKUP

Your delicious meal is ready! Please come to the pickup counter.

📋 ORDER INFORMATION
Order Number: #AH000123
Student: John Doe
Total Amount: ₫125,000
Estimated Pickup: Within 30 minutes

📍 PICKUP INSTRUCTIONS
• Come to the Main Hostel Counter
• Show your QR code (available in the app)
• Provide order number: #AH000123
• Collect your delicious meal!

[📱 View Order Details] [Get QR Code]
```

## 🔧 **Advanced Features**

### **Template Customization**
```javascript
// In src/lib/email.ts - easily customize templates
const generateOrderConfirmationHTML = (orderDetails) => {
  // Modify colors, styling, content as needed
  return `<!DOCTYPE html>...`
}
```

### **Multi-language Support** (Future Enhancement)
```javascript
// Add language parameter to email functions
await emailService.sendOrderConfirmation(orderDetails, 'vi') // Vietnamese
await emailService.sendOrderConfirmation(orderDetails, 'en') // English
```

### **Email Analytics** (Brevo Dashboard)
- **Delivery rates** - Track successful deliveries
- **Open rates** - See who opens emails
- **Click rates** - Monitor link clicks
- **Bounce rates** - Identify invalid emails

## 📈 **Expected Results**

### **Engagement Metrics**
- **Email delivery rate**: 99%+ (with verified domain)
- **Open rate**: 60-80% for transactional emails
- **Click-through rate**: 15-25% for order links
- **Professional appearance**: Significantly improved vs plain text

### **User Experience Benefits**
- **Complete order information** in one place
- **Professional communication** builds trust
- **Easy access** to order details via links
- **Universal compatibility** - works on all email clients

### **Business Benefits**
- **Reduced support inquiries** with clear information
- **Improved brand perception** with professional emails
- **Better order tracking** with clickable links
- **Cost-effective communication** at ~$0.001 per email

## 🚀 **Deployment Checklist**

### **Pre-Launch**
- [ ] Brevo account created and verified
- [ ] API key configured in environment variables
- [ ] Domain verification completed (DNS records)
- [ ] Test emails sending successfully

### **Launch**
- [ ] Environment variables set in production
- [ ] Email templates tested on multiple devices
- [ ] Admin notification settings accessible
- [ ] Monitor delivery rates in Brevo dashboard

### **Post-Launch**
- [ ] Monitor email delivery and open rates
- [ ] Collect student feedback on email notifications
- [ ] Optimize templates based on engagement
- [ ] Consider additional email types (promotions, reminders)

## 💰 **Pricing & Limits**

### **Brevo Free Plan**
- **300 emails/day** - Perfect for small to medium hostels
- **Unlimited contacts**
- **Email templates**
- **Basic reporting**

### **Brevo Starter Plan** (~$25/month)
- **20,000 emails/month**
- **No daily sending limit**
- **Advanced statistics**
- **Phone support**

### **Cost Comparison**
| Service | Cost per Email | Monthly Cost (10K emails) |
|---------|----------------|---------------------------|
| **Brevo** | $0.001 | $10-25 |
| **SendGrid** | $0.001-0.003 | $15-30 |
| **Mailgun** | $0.0008 | $8-20 |
| **AWS SES** | $0.0001 | $1-5 (complex setup) |

## 🆘 **Troubleshooting**

### **Common Issues**

**1. Emails going to spam:**
```
Solution:
- Complete domain verification
- Add SPF/DKIM records
- Warm up sending reputation gradually
- Avoid spam trigger words
```

**2. API key errors:**
```
Solution:
- Verify API key is correct
- Check key permissions in Brevo dashboard
- Ensure environment variable is set correctly
```

**3. Domain verification failing:**
```
Solution:
- Double-check DNS records
- Wait 24-48 hours for propagation
- Use DNS checker tools to verify records
- Contact Brevo support if needed
```

**4. Low delivery rates:**
```
Solution:
- Verify sender domain
- Check bounce rates in dashboard
- Clean email lists regularly
- Monitor reputation scores
```

### **Testing Commands**
```bash
# Test email API directly
curl -X POST https://your-domain.com/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "message": "Test message"
  }'
```

### **Monitoring**
- **Brevo Dashboard**: Monitor delivery rates and analytics
- **Application Logs**: Check for API errors
- **Admin Panel**: Use `/admin/settings/notifications` for testing

---

## 🎉 **Email Integration Complete!**

Your students will now receive **beautiful, professional HTML emails** for every order update, completing your comprehensive multi-channel notification system:

1. **Push Notifications** - Instant browser alerts
2. **WhatsApp Messages** - Interactive rich messages  
3. **Email Notifications** - Professional HTML emails

This triple-channel approach ensures **maximum reach and engagement** with your students while maintaining a professional image for your hostel food service.

The email system is designed to be:
- **Reliable** - 99%+ delivery rate with Brevo
- **Professional** - Beautiful HTML templates
- **Informative** - Complete order details
- **Actionable** - Direct links to order pages
- **Branded** - Consistent with your app design

**Your notification system is now complete and industry-leading! 🏆** 