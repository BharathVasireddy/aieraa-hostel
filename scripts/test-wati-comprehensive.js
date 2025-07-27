#!/usr/bin/env node

// Comprehensive WATI API Test - Multiple Format Attempts
// Testing different field names and structures

const WATI_API_URL = 'https://live-mt-server.wati.io/320431'
const WATI_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyN2UxNzgxMC1mODY1LTQzNWYtYmRjYS1mNzIyZmEzN2NjYzMiLCJ1bmlxdWVfbmFtZSI6ImhlbGxvQHN0dWRlbnRzdHJhZmZpYy5jb20iLCJuYW1laWQiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiZW1haWwiOiJoZWxsb0BzdHVkZW50c3RyYWZmaWMuY29tIiwiYXV0aF90aW1lIjoiMDYvMTgvMjAyNSAxNjo0MTozOSIsInRlbmFudF9pZCI6IjMyMDQzMSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.8lKbFFEPiSTx6awxNdU3nq9Mhj3vLDiAF-iUpPb-y8I'
const TEST_PHONE = '8885333635'  // Without +91
const TEST_PHONE_WITH_PREFIX = '918885333635'  // With country code
const TEMPLATE_NAME = 'aieraa_food_order_confirmation'
const TEMPLATE_NAMESPACE = 'bc58e840_9936_490d_8bf4_8935dc18adf9'

async function testTemplateFormat(formatName, payload, endpoint) {
  console.log(`\n🔄 Testing: ${formatName}`)
  console.log(`📍 Endpoint: ${endpoint}`)
  console.log(`📦 Payload:`, JSON.stringify(payload, null, 2))
  
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
        
        if (response.ok && result.result !== false) {
          console.log('✅ SUCCESS! This format works!')
          return { success: true, result }
        } else {
          console.log('❌ Failed:', result.info || result.message || 'Unknown error')
        }
      } catch {
        console.log('📄 Raw Response:', responseText)
      }
    } else {
      console.log('📄 Empty response')
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
  
  return { success: false }
}

async function testSessionMessageFormats() {
  console.log('\n📱 Testing Session Message Formats')
  console.log('=' .repeat(60))
  
  const message = "Hi *Test Student!* Your meal order #TEST001 has been received and is being reviewed by your manager. Items: 1x Chicken Biryani, 1x Raita. Total: ₹250. We'll notify you once approved! 👨‍🍳"
  
  const sessionFormats = [
    {
      name: "Standard Format",
      endpoint: `${WATI_API_URL}/api/v1/sendSessionMessage/${TEST_PHONE}`,
      payload: { messageText: message }
    },
    {
      name: "With Country Code",
      endpoint: `${WATI_API_URL}/api/v1/sendSessionMessage/${TEST_PHONE_WITH_PREFIX}`,
      payload: { messageText: message }
    },
    {
      name: "Alternative Field Name",
      endpoint: `${WATI_API_URL}/api/v1/sendSessionMessage/${TEST_PHONE}`,
      payload: { message: message }
    },
    {
      name: "Full Payload",
      endpoint: `${WATI_API_URL}/api/v1/sendSessionMessage`,
      payload: { 
        whatsappNumber: TEST_PHONE,
        messageText: message 
      }
    }
  ]

  for (const format of sessionFormats) {
    const result = await testTemplateFormat(format.name, format.payload, format.endpoint)
    if (result.success) {
      console.log('\n🎉 Found working session message format!')
      return true
    }
  }
  
  return false
}

async function testTemplateMessageFormats() {
  console.log('\n📋 Testing Template Message Formats')
  console.log('=' .repeat(60))
  
  const baseParameters = [
    { name: "1", value: "Test Student" },
    { name: "2", value: "TEST001" },
    { name: "3", value: "1x Chicken Biryani, 1x Raita" },
    { name: "4", value: "250" },
    { name: "5", value: new Date().toLocaleDateString('en-IN') }
  ]

  const templateFormats = [
    {
      name: "Standard whatsappNumber",
      payload: {
        whatsappNumber: TEST_PHONE,
        template_name: TEMPLATE_NAME,
        namespace: TEMPLATE_NAMESPACE,
        language: 'en',
        broadcast_name: 'order_confirmation',
        parameters: baseParameters
      }
    },
    {
      name: "With +91 Prefix",
      payload: {
        whatsappNumber: TEST_PHONE_WITH_PREFIX,
        template_name: TEMPLATE_NAME,
        namespace: TEMPLATE_NAMESPACE,
        language: 'en',
        broadcast_name: 'order_confirmation',
        parameters: baseParameters
      }
    },
    {
      name: "Using 'phone' field",
      payload: {
        phone: TEST_PHONE,
        template_name: TEMPLATE_NAME,
        namespace: TEMPLATE_NAMESPACE,
        language: 'en',
        broadcast_name: 'order_confirmation',
        parameters: baseParameters
      }
    },
    {
      name: "Using 'to' field",
      payload: {
        to: TEST_PHONE,
        template_name: TEMPLATE_NAME,
        namespace: TEMPLATE_NAMESPACE,
        language: 'en',
        broadcast_name: 'order_confirmation',
        parameters: baseParameters
      }
    },
    {
      name: "Simple parameters array",
      payload: {
        whatsappNumber: TEST_PHONE_WITH_PREFIX,
        template_name: TEMPLATE_NAME,
        namespace: TEMPLATE_NAMESPACE,
        language: 'en',
        broadcast_name: 'order_confirmation',
        parameters: ["Test Student", "TEST001", "1x Chicken Biryani, 1x Raita", "250", new Date().toLocaleDateString('en-IN')]
      }
    },
    {
      name: "Without namespace",
      payload: {
        whatsappNumber: TEST_PHONE_WITH_PREFIX,
        template_name: TEMPLATE_NAME,
        language: 'en',
        broadcast_name: 'order_confirmation',
        parameters: baseParameters
      }
    },
    {
      name: "With language code",
      payload: {
        whatsappNumber: TEST_PHONE_WITH_PREFIX,
        template_name: TEMPLATE_NAME,
        namespace: TEMPLATE_NAMESPACE,
        language: 'en_US',
        broadcast_name: 'order_confirmation',
        parameters: baseParameters
      }
    },
    {
      name: "Query parameter format",
      payload: {
        template_name: TEMPLATE_NAME,
        namespace: TEMPLATE_NAMESPACE,
        language: 'en',
        broadcast_name: 'order_confirmation',
        parameters: baseParameters
      }
    }
  ]

  for (let i = 0; i < templateFormats.length; i++) {
    const format = templateFormats[i]
    let endpoint = `${WATI_API_URL}/api/v1/sendTemplateMessage`
    
    // For query parameter format, add phone to URL
    if (format.name === "Query parameter format") {
      endpoint += `?whatsappNumber=${TEST_PHONE_WITH_PREFIX}`
    }
    
    const result = await testTemplateFormat(format.name, format.payload, endpoint)
    if (result.success) {
      console.log('\n🎉 Found working template format!')
      return true
    }
  }
  
  return false
}

async function testSimpleMessage() {
  console.log('\n💬 Testing Simple Text Message')
  console.log('=' .repeat(60))
  
  const simpleFormats = [
    {
      name: "Direct send message",
      endpoint: `${WATI_API_URL}/api/v1/sendMessage`,
      payload: {
        whatsappNumber: TEST_PHONE_WITH_PREFIX,
        message: "Hello from Aieraa! This is a test message."
      }
    },
    {
      name: "Alternative endpoint",
      endpoint: `${WATI_API_URL}/api/v1/sendTextMessage`,
      payload: {
        whatsappNumber: TEST_PHONE_WITH_PREFIX,
        messageText: "Hello from Aieraa! This is a test message."
      }
    }
  ]

  for (const format of simpleFormats) {
    const result = await testTemplateFormat(format.name, format.payload, format.endpoint)
    if (result.success) {
      console.log('\n🎉 Found working simple message format!')
      return true
    }
  }
  
  return false
}

async function main() {
  console.log('🔍 WATI API Comprehensive Test')
  console.log('=' .repeat(60))
  console.log(`📱 Test Phones: ${TEST_PHONE} / ${TEST_PHONE_WITH_PREFIX}`)
  console.log(`📋 Template: ${TEMPLATE_NAME}`)
  console.log(`🔑 Namespace: ${TEMPLATE_NAMESPACE}`)
  console.log('')

  // Test 1: Simple messages
  console.log('🚀 Phase 1: Testing Simple Messages')
  const simpleWorked = await testSimpleMessage()
  
  // Test 2: Session messages
  console.log('\n🚀 Phase 2: Testing Session Messages')
  const sessionWorked = await testSessionMessageFormats()
  
  // Test 3: Template messages
  console.log('\n🚀 Phase 3: Testing Template Messages')
  const templateWorked = await testTemplateMessageFormats()

  // Summary
  console.log('\n🏁 Test Results Summary')
  console.log('=' .repeat(60))
  console.log(`   Simple Messages: ${simpleWorked ? '✅ Working' : '❌ Failed'}`)
  console.log(`   Session Messages: ${sessionWorked ? '✅ Working' : '❌ Failed'}`)
  console.log(`   Template Messages: ${templateWorked ? '✅ Working' : '❌ Failed'}`)
  
  if (!simpleWorked && !sessionWorked && !templateWorked) {
    console.log('\n❌ All formats failed. Possible issues:')
    console.log('   • Access token might be invalid')
    console.log('   • API endpoint might be wrong')
    console.log('   • Phone number format issue')
    console.log('   • Account setup incomplete')
  } else {
    console.log('\n✅ Found working format(s)!')
  }
  
  console.log('\n📞 Next Steps:')
  console.log('   1. Check WATI dashboard for account status')
  console.log('   2. Verify phone number is registered')
  console.log('   3. Check template approval status')
  console.log('   4. Review API documentation')
}

main().catch(console.error) 