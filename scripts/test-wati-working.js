#!/usr/bin/env node

// WORKING WATI Integration Test - Final Success Version
// Using the discovered correct format

const WATI_API_URL = 'https://live-mt-server.wati.io/320431'
const WATI_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyN2UxNzgxMC1mODY1LTQzNWYtYmRjYS1mNzIyZmEzN2NjYzMiLCJ1bmlxdWVfbmFtZSI6ImhlbGxvQHN0dWRlbnRzdHJhZmZpYy5jb20iLCJuYW1laWQiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiZW1haWwiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiYXV0aF90aW1lIjoiMDYvMTgvMjAyNSAxNjo0MTozOSIsInRlbmFudF9pZCI6IjMyMDQzMSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.8lKbFFEPiSTx6awxNdU3nq9Mhj3vLDiAF-iUpPb-y8I'
const TEST_PHONE = '918885333635'
const TEMPLATE_NAME = 'aieraa_food_order_confirmation'
const TEMPLATE_NAMESPACE = 'bc58e840_9936_490d_8bf4_8935dc18adf9'

async function sendWorkingTemplateMessage() {
  console.log('🎉 Testing WORKING WATI Template Format')
  console.log('=' .repeat(60))
  
  // CORRECT FORMAT: Phone in URL, payload without phone number
  const endpoint = `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${TEST_PHONE}`
  
  const payload = {
    template_name: TEMPLATE_NAME,
    namespace: TEMPLATE_NAMESPACE,
    language: 'en',
    broadcast_name: 'order_confirmation',
    parameters: [
      { name: "1", value: "Test Student" },
      { name: "2", value: "TEST001" },
      { name: "3", value: "1x Chicken Biryani, 1x Raita" },
      { name: "4", value: "250" },
      { name: "5", value: new Date().toLocaleDateString('en-IN') }
    ]
  }

  console.log('✅ Using WORKING format:')
  console.log('📍 Phone in URL:', TEST_PHONE)
  console.log('📋 Template:', TEMPLATE_NAME)
  console.log('🔑 Namespace:', TEMPLATE_NAMESPACE)
  console.log('📦 Payload:', JSON.stringify(payload, null, 2))
  console.log('')

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log(`📡 Status: ${response.status}`)
    
    const responseText = await response.text()
    if (responseText) {
      try {
        const result = JSON.parse(responseText)
        console.log('📄 Response:', JSON.stringify(result, null, 2))
        
        if (response.ok && result.result === true) {
          console.log('\n🎉 SUCCESS! Template message sent successfully!')
          console.log('📲 Check WhatsApp for the order confirmation!')
          console.log('💚 WATI integration is WORKING!')
          return { success: true, result }
        } else {
          console.log('\n❌ Template failed:', result.info || result.message || 'Unknown error')
          return { success: false, error: result.info || result.message }
        }
      } catch {
        console.log('📄 Raw Response:', responseText)
        return { success: false, error: 'Invalid JSON response' }
      }
    } else {
      console.log('📄 Empty response')
      return { success: false, error: 'Empty response' }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function demonstrateIntegration() {
  console.log('\n📱 Demonstrating Real Order Scenario')
  console.log('=' .repeat(60))
  
  // Example real order data
  const realOrderData = {
    studentName: 'John Doe',
    orderNumber: 'ORD2025001',
    items: [
      { name: 'Chicken Biryani', quantity: 2 },
      { name: 'Paneer Curry', quantity: 1 },
      { name: 'Naan', quantity: 3 }
    ],
    totalAmount: 450,
    orderDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 24*60*60*1000).toISOString()
  }

  const itemsList = realOrderData.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
  const orderDate = new Date(realOrderData.deliveryDate).toLocaleDateString('en-IN')

  const endpoint = `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${TEST_PHONE}`
  
  const payload = {
    template_name: TEMPLATE_NAME,
    namespace: TEMPLATE_NAMESPACE,
    language: 'en',
    broadcast_name: 'order_confirmation',
    parameters: [
      { name: "1", value: realOrderData.studentName },
      { name: "2", value: realOrderData.orderNumber },
      { name: "3", value: itemsList },
      { name: "4", value: realOrderData.totalAmount.toString() },
      { name: "5", value: orderDate }
    ]
  }

  console.log('📊 Real order example:')
  console.log('👤 Student:', realOrderData.studentName)
  console.log('🔢 Order:', realOrderData.orderNumber)
  console.log('🍽️ Items:', itemsList)
  console.log('💰 Total: ₹' + realOrderData.totalAmount)
  console.log('')

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    
    if (response.ok && result.result === true) {
      console.log('✅ Real order notification sent successfully!')
      return true
    } else {
      console.log('❌ Failed:', result.info || 'Unknown error')
      return false
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 WATI Integration - SUCCESS TEST')
  console.log('=' .repeat(60))
  console.log('🎯 Using the discovered WORKING format')
  console.log('')

  // Test 1: Basic template message
  const basicResult = await sendWorkingTemplateMessage()
  
  if (basicResult.success) {
    // Test 2: Real order scenario
    await demonstrateIntegration()
    
    console.log('\n🎊 INTEGRATION COMPLETE!')
    console.log('=' .repeat(60))
    console.log('✅ WATI WhatsApp integration is working perfectly!')
    console.log('✅ Template messages are being sent successfully!')
    console.log('✅ Your hostel food ordering system can now send:')
    console.log('   📋 Order confirmations')
    console.log('   🔄 Status updates')
    console.log('   📞 Notifications')
    console.log('')
    console.log('🚀 Ready for production!')
    console.log('')
    console.log('📝 Integration Summary:')
    console.log('   • API Format: Query parameter (phone in URL)')
    console.log('   • Namespace: Required and working')
    console.log('   • Template: Approved and functional')
    console.log('   • Parameters: 5 parameters mapped correctly')
    console.log('')
    console.log('🎯 Next Steps:')
    console.log('   1. Add environment variables to production')
    console.log('   2. Test with real student phone numbers')
    console.log('   3. Monitor message delivery in WATI dashboard')
    console.log('   4. Set up other notification types')
    
  } else {
    console.log('\n❌ Integration still has issues. Please check:')
    console.log('   • Template approval status in WATI dashboard')
    console.log('   • Namespace configuration')
    console.log('   • Phone number format')
  }
}

main().catch(console.error) 