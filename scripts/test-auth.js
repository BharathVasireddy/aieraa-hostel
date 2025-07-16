#!/usr/bin/env node

/**
 * Authentication System Test Runner
 * Run: node scripts/test-auth.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AuthTestRunner {
  constructor() {
    this.testResults = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runTest(testName, testFn) {
    this.log(`Running: ${testName}`, 'info');
    
    try {
      const result = await testFn();
      if (result) {
        this.log(`✅ PASSED: ${testName}`, 'success');
        this.passed++;
        this.testResults.push({ name: testName, status: 'PASSED', error: null });
      } else {
        this.log(`❌ FAILED: ${testName}`, 'error');
        this.failed++;
        this.testResults.push({ name: testName, status: 'FAILED', error: 'Test returned false' });
      }
    } catch (error) {
      this.log(`❌ ERROR: ${testName} - ${error.message}`, 'error');
      this.failed++;
      this.testResults.push({ name: testName, status: 'ERROR', error: error.message });
    }
  }

  async checkFileExists(filePath) {
    return fs.existsSync(filePath);
  }

  async checkMiddleware() {
    const middlewarePath = path.join(__dirname, '../src/middleware.ts');
    const exists = await this.checkFileExists(middlewarePath);
    
    if (!exists) return false;
    
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    // Check for auth page redirect logic
    const hasAuthPageRedirect = content.includes('pathname.startsWith(\'/auth/\')') && 
                                content.includes('isAuthenticated');
    
    // Check for no-cache headers
    const hasNoCacheHeaders = content.includes('no-store, no-cache');
    
    return hasAuthPageRedirect && hasNoCacheHeaders;
  }

  async checkSigninPage() {
    const signinPath = path.join(__dirname, '../src/app/auth/signin/page.tsx');
    const exists = await this.checkFileExists(signinPath);
    
    if (!exists) return false;
    
    const content = fs.readFileSync(signinPath, 'utf8');
    
    // Check for authentication redirect
    const hasAuthRedirect = content.includes('if (status === \'authenticated\')');
    
    // Check for router.replace (no timeout)
    const hasRouterReplace = content.includes('router.replace(');
    
    // Check for no 1-second timeout
    const hasNoTimeout = !content.includes('setTimeout(');
    
    return hasAuthRedirect && hasRouterReplace && hasNoTimeout;
  }

  async checkSignupPage() {
    const signupPath = path.join(__dirname, '../src/app/auth/signup/page.tsx');
    const exists = await this.checkFileExists(signupPath);
    
    if (!exists) return false;
    
    const content = fs.readFileSync(signupPath, 'utf8');
    
    // Check for authentication redirect
    const hasAuthRedirect = content.includes('if (status === \'authenticated\')');
    
    // Check for useSession import
    const hasUseSession = content.includes('useSession');
    
    return hasAuthRedirect && hasUseSession;
  }

  async checkAuthConfig() {
    const authPath = path.join(__dirname, '../src/lib/auth.ts');
    const exists = await this.checkFileExists(authPath);
    
    if (!exists) return false;
    
    const content = fs.readFileSync(authPath, 'utf8');
    
    // Check for JWT strategy
    const hasJWTStrategy = content.includes('strategy: \'jwt\'');
    
    // Check for session expiration
    const hasSessionExpiration = content.includes('maxAge: 24 * 60 * 60');
    
    // Check for password hashing
    const hasPasswordHashing = content.includes('bcrypt.compare');
    
    return hasJWTStrategy && hasSessionExpiration && hasPasswordHashing;
  }

  async runAllTests() {
    this.log('🚀 Starting Authentication System Tests...', 'info');
    this.log('=' * 50, 'info');

    // Test 1: Middleware Protection
    await this.runTest('Middleware - Auth Page Redirect Protection', async () => {
      return await this.checkMiddleware();
    });

    // Test 2: Signin Page
    await this.runTest('Signin Page - Authentication Check & Fast Redirect', async () => {
      return await this.checkSigninPage();
    });

    // Test 3: Signup Page
    await this.runTest('Signup Page - Authentication Check', async () => {
      return await this.checkSignupPage();
    });

    // Test 4: Auth Configuration
    await this.runTest('Auth Config - JWT Strategy & Security', async () => {
      return await this.checkAuthConfig();
    });

    // Test 5: File Structure
    await this.runTest('File Structure - All Auth Files Present', async () => {
      const files = [
        'src/middleware.ts',
        'src/app/auth/signin/page.tsx',
        'src/app/auth/signup/page.tsx',
        'src/lib/auth.ts'
      ];
      
      for (const file of files) {
        const fullPath = path.join(__dirname, '..', file);
        if (!await this.checkFileExists(fullPath)) {
          return false;
        }
      }
      return true;
    });

    // Test 6: Environment Variables
    await this.runTest('Environment - Required Variables Present', async () => {
      return process.env.NEXTAUTH_SECRET && process.env.DATABASE_URL;
    });

    this.log('=' * 50, 'info');
    this.log(`Tests completed: ${this.passed} passed, ${this.failed} failed`, 
             this.failed > 0 ? 'warning' : 'success');

    // Generate test report
    this.generateReport();
  }

  generateReport() {
    const reportPath = path.join(__dirname, '../test-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.passed,
        failed: this.failed,
        successRate: `${Math.round((this.passed / this.testResults.length) * 100)}%`
      },
      tests: this.testResults
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Test report generated: ${reportPath}`, 'info');
  }
}

// Manual Test Instructions
const manualTests = `
🧪 MANUAL TESTING INSTRUCTIONS

1. **Authentication Flow Test**
   - Open browser in incognito mode
   - Go to http://localhost:3000/student
   - Should redirect to signin with callback URL
   - Enter valid credentials
   - Should redirect to /student immediately (no timeout)

2. **Authenticated User Protection Test**
   - Login as student
   - Try to visit http://localhost:3000/auth/signin
   - Should redirect to /student dashboard
   - Try to visit http://localhost:3000/auth/signup
   - Should redirect to /student dashboard

3. **Role-Based Access Test**
   - Login as student
   - Try to visit http://localhost:3000/admin
   - Should redirect to /student
   - Login as admin
   - Try to visit http://localhost:3000/student
   - Should redirect to /admin

4. **Cache Prevention Test**
   - Open browser dev tools
   - Go to Network tab
   - Visit auth pages
   - Check response headers for "no-cache"

5. **Performance Test**
   - Open browser dev tools
   - Go to Network tab
   - Time the login process
   - Should complete in under 2 seconds
   - No 1-second artificial delays

6. **Security Test**
   - Check that passwords are hashed in database
   - Try SQL injection in login form
   - Check that JWT tokens are properly signed
   - Verify session expiration works

✅ All tests should pass for production-ready authentication!
`;

// Run tests
if (require.main === module) {
  const runner = new AuthTestRunner();
  
  runner.runAllTests().then(() => {
    console.log('\n' + manualTests);
    process.exit(runner.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { AuthTestRunner }; 