'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { ButtonPress } from '@/components/PageTransition'
import { Suspense } from 'react'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'Account pending approval or suspended') {
          setError('Your account is pending approval or has been suspended. Please contact the admin.')
        } else {
          setError('Invalid email or password. Please check your credentials and try again.')
        }
      } else if (result?.ok) {
        // Get the session to determine user role and redirect
        // Add retry logic for session retrieval with proper timing
        let session = null
        let retryCount = 0
        const maxRetries = 3
        
        while (!session?.user?.role && retryCount < maxRetries) {
          if (retryCount > 0) {
            // Wait longer for JWT token processing
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          try {
            session = await getSession()
            console.log(`🔍 Session attempt ${retryCount + 1}/${maxRetries}:`, {
              hasSession: !!session,
              hasUser: !!session?.user,
              userRole: session?.user?.role || 'NO ROLE',
              userEmail: session?.user?.email || 'NO EMAIL'
            })
          } catch (error) {
            console.error('Session retrieval error:', error)
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
          
          console.log('Redirecting to:', redirectUrl)
          router.push(redirectUrl)
        } else {
          console.error('Failed to get user role after', maxRetries, 'attempts')
          setError('Unable to determine user role. Please try refreshing the page and logging in again.')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Something went wrong. Please try again.')
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
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