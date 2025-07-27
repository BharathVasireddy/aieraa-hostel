#!/usr/bin/env node

// Test WATI Integration Script
// This script tests the WATI WhatsApp template functionality directly

const WATI_API_URL = 'https://live-mt-server.wati.io/320431'
const WATI_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyN2UxNzgxMC1mODY1LTQzNWYtYmRjYS1mNzIyZmEzN2NjYzMiLCJ1bmlxdWVfbmFtZSI6ImhlbGxvQHN0dWRlbnRzdHJhZmZpYy5jb20iLCJuYW1laWQiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiZW1haWwiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiYXV0aF90aW1lIjoiMDYvMTgvMjAyNSAxNjo0MTozOSIsInRlbmFudF9pZCI6IjMyMDQzMSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.8lKbFFEPiSTx6awxNdU3nq9Mhj3vLDiAF-iUpPb-y8I'
const TEST_PHONE = '8885333635'
const TEMPLATE_NAME = 'aieraa_food_order_confirmation'

async function testWatiTemplate() {
  console.log('🧪 Testing WATI Template Integration')
  console.log('=' .repeat(50))
  console.log('📱 Phone:', TEST_PHONE)
  console.log('📋 Template:', TEMPLATE_NAME)
  console.log('🔗 API URL:', WATI_API_URL)
  console.log('')

  const testData = {
    whatsappNumber: TEST_PHONE,
    template_name: TEMPLATE_NAME,
    broadcast_name: 'order_confirmation_test',
    parameters: [
      'Test Student',           // {{1}} - Student name
      'TEST001',               // {{2}} - Order number  
      '1x Chicken Biryani, 1x Raita',  // {{3}} - Items list
      '250',                   // {{4}} - Total amount (₹)
      new Date().toLocaleDateString('en-IN')  // {{5}} - Order date
    ]
  }

  console.log('📨 Sending template message with parameters:')
  testData.parameters.forEach((param, index) => {
    console.log(`   {{${index + 1}}}: ${param}`)
  })
  console.log('')

  // Try different endpoint variations
  const endpoints = [
    `${WATI_API_URL}/api/v1/sendTemplateMessage`,
    `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${TEST_PHONE}`,
    `${WATI_API_URL}/v1/sendTemplateMessage`,
    `${WATI_API_URL}/sendTemplateMessage`
  ]

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i]
    console.log(`🔄 Trying endpoint ${i + 1}/${endpoints.length}: ${endpoint}`)
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      console.log(`📡 Response Status: ${response.status}`)
      
      let result
      const responseText = await response.text()
      
      if (responseText) {
        try {
          result = JSON.parse(responseText)
          console.log('📄 Response Data:', JSON.stringify(result, null, 2))
        } catch (parseError) {
          console.log('📄 Raw Response Text:', responseText)
          result = { raw: responseText }
        }
      } else {
        console.log('📄 Empty response body')
        result = { empty: true }
      }

      if (response.ok) {
        console.log('✅ SUCCESS! Template message sent successfully!')
        console.log(`📲 Message ID: ${result.messageId || result.id || 'N/A'}`)
        console.log(`📱 Sent to: +91${TEST_PHONE}`)
        console.log('')
        console.log('🎉 Check your WhatsApp for the message!')
        return // Exit on success
      } else {
        console.log(`❌ Failed with status ${response.status}`)
        if (result.message) {
          console.log('💡 Error Message:', result.message)
        }
      }

    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`)
    }
    
    console.log('') // Add spacing between attempts
  }

  console.log('❌ All endpoints failed. Manual testing needed.')
}

async function testWatiSessionMessage() {
  console.log('🧪 Testing WATI Session Message (Fallback)')
  console.log('=' .repeat(50))
  
  const message = `🧪 *Test Message from Aieraa*

Hi Test Student! 

Your meal order #TEST001 has been received.

📝 *Order Details:*
Items: 1x Chicken Biryani, 1x Raita
Total: ₹250
Date: ${new Date().toLocaleDateString('en-IN')}

We'll notify you once approved! 👨‍🍳

Reach out to your manager with order number for help`

  try {
    const response = await fetch(`${WATI_API_URL}/api/v1/sendSessionMessage/${TEST_PHONE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageText: message
      })
    })

    const responseText = await response.text()
    console.log(`📡 Response Status: ${response.status}`)
    
    if (responseText) {
      try {
        const result = JSON.parse(responseText)
        console.log('📄 Response Data:', JSON.stringify(result, null, 2))
        
        if (response.ok) {
          console.log('✅ Session message sent successfully!')
          console.log(`📲 Message ID: ${result.messageId || result.id || 'N/A'}`)
        }
      } catch (parseError) {
        console.log('📄 Raw Response:', responseText)
      }
    }

  } catch (error) {
    console.log('❌ Session message failed:', error.message)
  }
  
  console.log('')
}

async function testWatiConfiguration() {
  console.log('🔧 Testing WATI Configuration')
  console.log('=' .repeat(50))
  
  try {
    // Test a simple API call to check configuration
    const response = await fetch(`${WATI_API_URL}/api/v1/getContacts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Configuration Test Status:', response.status)

    if (response.ok) {
      console.log('✅ WATI API is accessible!')
      console.log('🔑 Access token is valid!')
    } else {
      console.log('⚠️  WATI API issue detected')
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        console.log('🔍 Error:', errorData)
      } catch {
        console.log('🔍 Raw Error:', errorText)
      }
    }

  } catch (error) {
    console.log('❌ Configuration test failed')
    console.log('🔍 Error:', error.message)
  }
  
  console.log('')
}

// Main execution
async function main() {
  console.log('🚀 WATI WhatsApp Integration Test')
  console.log('=' .repeat(50))
  console.log('')

  // Test 1: Configuration
  await testWatiConfiguration()

  // Test 2: Template Message
  await testWatiTemplate()

  // Test 3: Session Message (Fallback)
  await testWatiSessionMessage()

  console.log('')
  console.log('🏁 Test completed!')
  console.log('')
  console.log('📝 Next Steps:')
  console.log('   1. Check WhatsApp for test message')
  console.log('   2. Verify template formatting looks correct')
  console.log('   3. Test with real order data in your app')
  console.log('   4. If template failed, check WATI dashboard for template approval status')
  console.log('')
}

// Run the test
main().catch(console.error) 