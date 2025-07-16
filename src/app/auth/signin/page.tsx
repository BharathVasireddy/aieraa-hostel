'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, LogIn, AlertCircle, Clock, XCircle, Info } from 'lucide-react'
import { ButtonPress } from '@/components/PageTransition'
import { Suspense } from 'react'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'auth' | 'status' | 'general'>('general')
  const router = useRouter()
    const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorType('general')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      // Debug: log the full result to see what NextAuth is returning
      console.log('🔍 SignIn result:', result)
      console.log('🔍 Error value:', result?.error)
      console.log('🔍 Result keys:', Object.keys(result || {}))

      if (result?.error) {
        // Handle specific error messages based on user status
        switch (result.error) {
          case 'ACCOUNT_PENDING_APPROVAL':
            setError('Your account registration is pending approval. Please wait for an administrator to approve your account, or contact support if you have been waiting for more than 24 hours.')
            setErrorType('status')
            break
          case 'ACCOUNT_SUSPENDED':
            setError('Your account has been suspended. Please contact the administrator or support team to resolve this issue.')
            setErrorType('status')
            break
          case 'ACCOUNT_REJECTED':
            setError('Your account registration has been rejected. Please contact the administrator for more information or submit a new registration if eligible.')
            setErrorType('status')
            break
          case 'ACCOUNT_NOT_APPROVED':
            setError('Your account is not approved for login. Please contact the administrator for assistance.')
            setErrorType('status')
            break
          default:
            setError('Invalid email or password. Please check your credentials and try again.')
            setErrorType('auth')
        }
      } else if (result?.ok) {
        // Get the session to determine user role and redirect
        // Improved retry logic with exponential backoff and better error handling
        let session = null
        let retryCount = 0
        const maxRetries = 5
        
        while (!session?.user?.role && retryCount < maxRetries) {
          if (retryCount > 0) {
            // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
            const delay = Math.min(500 * Math.pow(2, retryCount - 1), 8000)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
          try {
            // Force refresh the session to get latest data
            session = await getSession()
            console.log(`🔍 Session attempt ${retryCount + 1}/${maxRetries}:`, {
              hasSession: !!session,
              hasUser: !!session?.user,
              userRole: session?.user?.role || 'NO ROLE',
              userEmail: session?.user?.email || 'NO EMAIL',
              tokenExp: session?.expires || 'NO EXPIRY'
            })
            
            // Check if we have a valid session with user data
            if (session?.user?.role) {
              break
            }
          } catch (error) {
            console.error(`Session retrieval error (attempt ${retryCount + 1}):`, error)
          }
          
          retryCount++
        }
        
        if (session?.user?.role) {
          let redirectUrl = callbackUrl
          
          // Role-based redirection logic
          if (callbackUrl === '/' || !callbackUrl) {
            switch (session.user.role) {
              case 'ADMIN':
              case 'MANAGER':
                redirectUrl = '/admin'
                break
              case 'STUDENT':
                redirectUrl = '/student'
                break
              default:
                redirectUrl = '/'
            }
          }
          
          console.log('✅ Redirecting to:', redirectUrl)
          router.push(redirectUrl)
        } else {
          console.error('❌ Failed to get user role after', maxRetries, 'attempts')
          // Wait a bit more and try one final direct redirect based on likely role
          console.log('🔄 Attempting final redirect with delay...')
          setTimeout(() => {
            // Try to get session one more time
            getSession().then(finalSession => {
              if (finalSession?.user?.role) {
                console.log('🎯 Final session found, redirecting to:', finalSession.user.role)
                if (finalSession.user.role === 'ADMIN' || finalSession.user.role === 'MANAGER') {
                  router.push('/admin')
                } else if (finalSession.user.role === 'STUDENT') {
                  router.push('/student')
                } else {
                  router.push('/')
                }
              } else {
                console.log('🔄 Final fallback to home page')
                router.push('/')
              }
            }).catch(() => {
              console.log('🔄 Final fallback to home page due to error')
              router.push('/')
            })
          }, 2000) // Wait 2 seconds before final attempt
        }
      }
    } catch (error) {
    console.error(error)
      setError('Something went wrong. Please try again.')
      setErrorType('general')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Demo Credentials Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials</h3>
        <div className="space-y-1 text-xs text-blue-700">
          <p><strong>Student:</strong> student@bmu.edu.vn / student123</p>
          <p><strong>Admin:</strong> admin@bmu.edu.vn / admin123</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className={`border rounded-lg p-4 ${
            errorType === 'status' 
              ? 'bg-amber-50 border-amber-200' 
              : errorType === 'auth'
              ? 'bg-red-50 border-red-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {errorType === 'status' && (
                <>
                  {error.includes('pending') && <Clock className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />}
                  {error.includes('suspended') && <XCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />}
                  {error.includes('rejected') && <XCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />}
                  {!error.includes('pending') && !error.includes('suspended') && !error.includes('rejected') && <Info className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />}
                </>
              )}
              {errorType === 'auth' && <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />}
              {errorType === 'general' && <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className={`text-sm ${
                  errorType === 'status' 
                    ? 'text-amber-800' 
                    : 'text-red-800'
                }`}>
                  {error}
                </p>
                {errorType === 'status' && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs text-amber-700 mb-2">
                      <strong>Need help?</strong> Contact support:
                    </p>
                    <div className="text-xs text-amber-700 space-y-1">
                      <p>• Email: support@aieraa.com</p>
                      <p>• Or contact your university administrator</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-12"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <ButtonPress
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            <div className="flex items-center justify-center">
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </div>
          )}
        </ButtonPress>
      </form>

      {/* Links */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-primary-hover font-medium">
            Sign up here
          </Link>
        </p>
      </div>
    </>
  )
}

export default function SignIn() {
  const router = useRouter()
    return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative">
      {/* Back Button - Absolute positioned */}
      <ButtonPress 
        onClick={() => router.back()}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </ButtonPress>

      {/* Main Content - Centered */}
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <img 
              src="https://aieraa.com/wp-content/uploads/2020/08/Aieraa-Overseas-Logo.png" 
              alt="Aieraa Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to order your hostel meals</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
} 