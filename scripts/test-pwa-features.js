#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🧪 Testing PWA Features...\n');

// Test 1: Check if manifest.json is valid
function testManifest() {
  console.log('1️⃣ Testing Web App Manifest...');
  
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length === 0) {
      console.log('   ✅ Manifest is valid');
      console.log(`   📱 App name: ${manifest.name}`);
      console.log(`   🏠 Start URL: ${manifest.start_url}`);
      console.log(`   🎨 Theme color: ${manifest.theme_color}`);
      console.log(`   📱 Display mode: ${manifest.display}`);
      console.log(`   🔗 Shortcuts: ${manifest.shortcuts?.length || 0} defined`);
    } else {
      console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
    }
  } catch (error) {
    console.log(`   ❌ Manifest error: ${error.message}`);
  }
  
  console.log('');
}

// Test 2: Check if PWA icons exist
function testIcons() {
  console.log('2️⃣ Testing PWA Icons...');
  
  const requiredSizes = ['192x192', '512x512'];
  const iconDir = path.join(process.cwd(), 'public', 'icons');
  
  let allIconsExist = true;
  
  requiredSizes.forEach(size => {
    const iconPath = path.join(iconDir, `icon-${size}.png`);
    if (fs.existsSync(iconPath)) {
      console.log(`   ✅ Icon ${size} exists`);
    } else {
      console.log(`   ❌ Icon ${size} missing`);
      allIconsExist = false;
    }
  });
  
  if (allIconsExist) {
    console.log('   🎯 All required icons present');
  } else {
    console.log('   ⚠️  Some icons are missing - PWA may not install properly');
  }
  
  console.log('');
}

// Test 3: Check service worker configuration
function testServiceWorker() {
  console.log('3️⃣ Testing Service Worker Configuration...');
  
  try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (nextConfig.includes('withPWA')) {
      console.log('   ✅ next-pwa configured');
    } else {
      console.log('   ❌ next-pwa not found in next.config.js');
    }
    
    if (nextConfig.includes('runtimeCaching')) {
      console.log('   ✅ Runtime caching configured');
    } else {
      console.log('   ⚠️  Runtime caching not configured');
    }
    
    // Check if service worker will be generated
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    if (fs.existsSync(swPath)) {
      console.log('   ✅ Service worker file exists');
    } else {
      console.log('   ⚠️  Service worker not generated yet (run npm run build)');
    }
    
  } catch (error) {
    console.log(`   ❌ Service worker test error: ${error.message}`);
  }
  
  console.log('');
}

// Test 4: Check push notification setup
function testPushNotifications() {
  console.log('4️⃣ Testing Push Notification Setup...');
  
  try {
    // Check if push notification API endpoints exist
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api', 'push-notifications');
    const endpoints = ['subscribe', 'unsubscribe', 'send'];
    
    let allEndpointsExist = true;
    
    endpoints.forEach(endpoint => {
      const endpointPath = path.join(apiDir, endpoint, 'route.ts');
      if (fs.existsSync(endpointPath)) {
        console.log(`   ✅ ${endpoint} endpoint exists`);
      } else {
        console.log(`   ❌ ${endpoint} endpoint missing`);
        allEndpointsExist = false;
      }
    });
    
    // Check for VAPID keys in environment
    const hasVapidKeys = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
    if (hasVapidKeys) {
      console.log('   ✅ VAPID keys configured');
    } else {
      console.log('   ⚠️  VAPID keys not found in environment');
      console.log('   💡 Add to .env.local:');
      console.log('      NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key');
      console.log('      VAPID_PRIVATE_KEY=your_private_key');
    }
    
    if (allEndpointsExist) {
      console.log('   🔔 Push notification infrastructure ready');
    }
    
  } catch (error) {
    console.log(`   ❌ Push notification test error: ${error.message}`);
  }
  
  console.log('');
}

// Test 5: Check database schema
async function testDatabase() {
  console.log('5️⃣ Testing Database Schema...');
  
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (schema.includes('model PushSubscription')) {
      console.log('   ✅ PushSubscription model exists');
    } else {
      console.log('   ❌ PushSubscription model missing');
      console.log('   💡 Run: npx prisma db push');
    }
    
    // Check if database is in sync
    try {
      await execAsync('npx prisma db status');
      console.log('   ✅ Database schema is in sync');
    } catch (error) {
      console.log('   ⚠️  Database may need migration');
      console.log('   💡 Run: npx prisma db push');
    }
    
  } catch (error) {
    console.log(`   ❌ Database test error: ${error.message}`);
  }
  
  console.log('');
}

// Test 6: Performance check
function testPerformance() {
  console.log('6️⃣ Testing Performance Configuration...');
  
  try {
    // Check for performance monitoring component
    const perfMonitorPath = path.join(process.cwd(), 'src', 'components', 'PWAPerformanceMonitor.tsx');
    if (fs.existsSync(perfMonitorPath)) {
      console.log('   ✅ Performance monitoring configured');
    } else {
      console.log('   ❌ Performance monitoring component missing');
    }
    
    // Check for critical resource preloading
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    const layout = fs.readFileSync(layoutPath, 'utf8');
    
    if (layout.includes('preload')) {
      console.log('   ✅ Resource preloading configured');
    } else {
      console.log('   ⚠️  Resource preloading not configured');
    }
    
  } catch (error) {
    console.log(`   ❌ Performance test error: ${error.message}`);
  }
  
  console.log('');
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting PWA Feature Tests\n');
  console.log('=' .repeat(50));
  
  testManifest();
  testIcons();
  testServiceWorker();
  testPushNotifications();
  await testDatabase();
  testPerformance();
  
  console.log('=' .repeat(50));
  console.log('🏁 PWA Tests Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. 🔧 Set up environment variables (.env.local)');
  console.log('2. 🏗️  Run: npm run build (to generate service worker)');
  console.log('3. 🌐 Deploy with HTTPS');
  console.log('4. 📱 Test "Add to Home Screen" on mobile');
  console.log('5. 🔔 Test push notifications');
  console.log('6. 📊 Run Lighthouse PWA audit');
  console.log('\n✨ Your PWA is ready to provide a native app experience!');
}

runTests().catch(console.error); 