'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, AlertCircle, Clock, XCircle, Info } from 'lucide-react'
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-4">
            <div className="absolute inset-0 w-8 h-8 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-green-700 font-medium">Loading...</p>
        </div>
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
        // Handle different types of errors
        switch (result.error) {
          case 'Invalid credentials':
          case 'Invalid email or password':
            setError('Invalid email or password. Please check your credentials and try again.')
            setErrorType('auth')
            break
          case 'ACCOUNT_PENDING_APPROVAL':
            setError('Your account is pending approval by the university manager. Please try again after approval.')
            setErrorType('status')
            break
          case 'ACCOUNT_SUSPENDED':
            setError('Your account has been suspended. Please contact your administrator.')
            setErrorType('status')
            break
          case 'ACCOUNT_REJECTED':
            setError('Your account has been rejected. Please contact your administrator.')
            setErrorType('status')
            break
          case 'Account inactive':
            setError('Your account is inactive. Please contact your administrator.')
            setErrorType('status')
            break
          case 'Account not verified':
            setError('Your account email is not verified. Please check your email and verify your account.')
            setErrorType('status')
            break
          default:
            setError('An error occurred during sign in. Please try again.')
            setErrorType('general')
        }
      } else if (result?.ok) {
        // Get fresh session after successful login
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
          
          router.push(redirectUrl)
        } else {
          router.push(callbackUrl)
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred. Please try again.')
      setErrorType('general')
    } finally {
      setLoading(false)
    }
  }

  const getErrorIcon = () => {
    switch (errorType) {
      case 'status':
        return <Clock className="w-5 h-5 text-amber-600" />
      case 'auth':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
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
    <div className="min-h-screen bg-white relative">
      {/* Back Button - Absolute positioned */}
      <ButtonPress 
        onClick={() => router.back()}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </ButtonPress>

      {/* Main Content */}
      <div className="px-4 pt-16 pb-8">
        <div className="max-w-md mx-auto">
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
            <p className="text-gray-600">Sign in to your Aieraa Hospitality account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`rounded-lg p-4 border flex items-start space-x-3 mb-6 ${getErrorColor()}`}>
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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="input"
                placeholder="your-email@university.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="input pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-green-600 hover:text-green-500 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <ButtonPress
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="relative w-5 h-5 mr-2">
                    <div className="absolute inset-0 w-5 h-5 border-2 border-white border-opacity-25 rounded-full"></div>
                    <div className="absolute inset-0 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </ButtonPress>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-4">
            <div className="absolute inset-0 w-8 h-8 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-green-700 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
} 