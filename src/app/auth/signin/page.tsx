'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, LogIn, AlertCircle, Clock, XCircle, Info } from 'lucide-react'
import { ButtonPress } from '@/components/PageTransition'
import { Suspense } from 'react'

function SignInForm() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'auth' | 'status' | 'general'>('general')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
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
      
      router.push(redirectUrl)
    }
  }, [session, status, router, callbackUrl])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render form if already authenticated
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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
        // Success - get fresh session and redirect immediately
        const session = await getSession()
        
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
          
          // Use replace to prevent back navigation to signin
          router.replace(redirectUrl)
        } else {
          router.replace('/')
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setErrorType('general')
    } finally {
      setLoading(false)
    }
  }

  const getErrorIcon = () => {
    switch (errorType) {
      case 'status':
        return <Clock className="w-5 h-5 text-amber-500" />
      case 'auth':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getErrorColor = () => {
    switch (errorType) {
      case 'status':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'auth':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`rounded-lg p-4 border flex items-start space-x-3 ${getErrorColor()}`}>
            {getErrorIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {error}
              </p>
              {errorType === 'status' && (
                <p className="text-xs mt-1 opacity-75">
                  Contact support: support@aieraa.com
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-email@university.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <ButtonPress>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </ButtonPress>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
} 