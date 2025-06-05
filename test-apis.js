#!/usr/bin/env node

const baseURL = 'http://localhost:3000';

// Test results storage
const testResults = [];

function logTest(api, method, status, response, error = null) {
  const result = {
    timestamp: new Date().toISOString(),
    api,
    method,
    status,
    response: response ? JSON.stringify(response).substring(0, 200) : null,
    error
  };
  testResults.push(result);
  console.log(`\n🧪 [${method}] ${api}`);
  console.log(`   Status: ${status}`);
  if (error) console.log(`   Error: ${error}`);
  if (response) console.log(`   Response: ${JSON.stringify(response, null, 2).substring(0, 300)}...`);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
}

async function testAPIs() {
  console.log('🚀 Starting Comprehensive API Testing...\n');
  console.log('=' * 50);

  // 1. TEST DEMO DATA SEEDING
  console.log('\n📊 1. TESTING DEMO DATA SEEDING');
  let result = await makeRequest(`${baseURL}/api/seed-demo-user`, { method: 'POST' });
  logTest('/api/seed-demo-user', 'POST', result.status, result.data, result.error);

  // 2. TEST UNIVERSITIES API
  console.log('\n🏛️  2. TESTING UNIVERSITIES API');
  result = await makeRequest(`${baseURL}/api/universities`);
  logTest('/api/universities', 'GET', result.status, result.data, result.error);

  // 3. TEST USER SIGNUP (Create new test user)
  console.log('\n👤 3. TESTING USER SIGNUP API');
  const newUser = {
    name: "API Test Student",
    email: "api.test@university.edu",
    password: "testpass123",
    role: "STUDENT",
    studentId: "API001",
    roomNumber: "B202",
    phone: "1234567890",
    universityId: "cm9j8z9t80001xwrfh3v7v2xt" // Using a sample ID
  };
  
  result = await makeRequest(`${baseURL}/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(newUser)
  });
  logTest('/api/auth/signup', 'POST', result.status, result.data, result.error);

  // 4. TEST MENU APIs
  console.log('\n🍽️  4. TESTING MENU APIs');
  
  // Get menu items
  result = await makeRequest(`${baseURL}/api/menu`);
  logTest('/api/menu', 'GET', result.status, result.data, result.error);

  // Get menu availability
  const today = new Date().toISOString().split('T')[0];
  result = await makeRequest(`${baseURL}/api/menu/availability?date=${today}`);
  logTest('/api/menu/availability', 'GET', result.status, result.data, result.error);

  // 5. TEST STUDENT APIs
  console.log('\n🎓 5. TESTING STUDENT APIs');
  
  result = await makeRequest(`${baseURL}/api/student/popular-dishes`);
  logTest('/api/student/popular-dishes', 'GET', result.status, result.data, result.error);

  result = await makeRequest(`${baseURL}/api/student/todays-specials`);
  logTest('/api/student/todays-specials', 'GET', result.status, result.data, result.error);

  result = await makeRequest(`${baseURL}/api/student/menu`);
  logTest('/api/student/menu', 'GET', result.status, result.data, result.error);

  // 6. TEST ORDER APIs (Basic - without authentication)
  console.log('\n🛒 6. TESTING ORDER APIs');
  
  result = await makeRequest(`${baseURL}/api/orders`);
  logTest('/api/orders', 'GET', result.status, result.data, result.error);

  // Test order creation (will likely fail without auth)
  const testOrder = {
    orderDate: today,
    orderItems: [
      {
        menuItemId: "sample-menu-id",
        variantId: "sample-variant-id",
        quantity: 2,
        price: 150
      }
    ],
    totalAmount: 318,
    taxAmount: 18,
    subtotalAmount: 300,
    paymentMethod: "cash",
    specialInstructions: "Test order via API"
  };

  result = await makeRequest(`${baseURL}/api/orders`, {
    method: 'POST',
    body: JSON.stringify(testOrder)
  });
  logTest('/api/orders', 'POST', result.status, result.data, result.error);

  // 7. TEST ADMIN APIs (without proper authentication)
  console.log('\n👑 7. TESTING ADMIN APIs');
  
  result = await makeRequest(`${baseURL}/api/admin/users`);
  logTest('/api/admin/users', 'GET', result.status, result.data, result.error);

  result = await makeRequest(`${baseURL}/api/admin/orders`);
  logTest('/api/admin/orders', 'GET', result.status, result.data, result.error);

  result = await makeRequest(`${baseURL}/api/admin/analytics`);
  logTest('/api/admin/analytics', 'GET', result.status, result.data, result.error);

  result = await makeRequest(`${baseURL}/api/admin/profile`);
  logTest('/api/admin/profile', 'GET', result.status, result.data, result.error);

  // Test menu creation
  const testMenuItem = {
    name: "API Test Dish",
    description: "Created via API testing",
    categories: ["Main Course"],
    basePrice: 200,
    isAvailable: true,
    variants: [
      {
        name: "Regular",
        price: 200
      },
      {
        name: "Large",
        price: 250
      }
    ],
    universityId: "cm9j8z9t80001xwrfh3v7v2xt"
  };

  result = await makeRequest(`${baseURL}/api/admin/menu`, {
    method: 'POST',
    body: JSON.stringify(testMenuItem)
  });
  logTest('/api/admin/menu', 'POST', result.status, result.data, result.error);

  // 8. TEST USER PROFILE APIs
  console.log('\n👨‍💼 8. TESTING USER PROFILE APIs');
  
  result = await makeRequest(`${baseURL}/api/user/sample-user-id`);
  logTest('/api/user/[id]', 'GET', result.status, result.data, result.error);

  // Print summary
  console.log('\n' + '=' * 60);
  console.log('📋 TEST SUMMARY');
  console.log('=' * 60);
  
  const successCount = testResults.filter(r => r.status >= 200 && r.status < 400).length;
  const authErrors = testResults.filter(r => r.status === 401).length;
  const clientErrors = testResults.filter(r => r.status >= 400 && r.status < 500).length;
  const serverErrors = testResults.filter(r => r.status >= 500).length;
  const networkErrors = testResults.filter(r => r.status === 'ERROR').length;

  console.log(`Total APIs Tested: ${testResults.length}`);
  console.log(`✅ Successful Responses (2xx-3xx): ${successCount}`);
  console.log(`🔐 Authentication Required (401): ${authErrors}`);
  console.log(`❌ Client Errors (4xx): ${clientErrors}`);
  console.log(`💥 Server Errors (5xx): ${serverErrors}`);
  console.log(`🌐 Network Errors: ${networkErrors}`);

  console.log('\n🔍 DETAILED BREAKDOWN BY STATUS:');
  const statusCounts = {};
  testResults.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} APIs`);
  });

  console.log('\n📄 Full test results saved to test-results.json');
  
  // Save detailed results
  require('fs').writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAPIs().catch(console.error);
}

module.exports = { testAPIs }; 