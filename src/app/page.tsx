'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Shield, Smartphone, Star, ArrowRight } from 'lucide-react'
import { cachedFetch } from '@/lib/cache'

export default function LandingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
    
    // Preload universities for faster signup experience
    // Only preload if user is not authenticated (likely to signup)
    if (status === 'unauthenticated') {
      const preloadUniversities = async () => {
        try {
          // Silently cache universities data for instant signup loading
          await cachedFetch('/api/public/universities', {}, 30)
          console.log('🚀 Universities preloaded for instant signup')
        } catch (error) {
          // Silently handle preload errors
          console.debug('University preload failed:', error)
        }
      }
      
      // Delay preload by 1 second to not block initial page load
      setTimeout(preloadUniversities, 1000)
    }
  }, [status])

  // Show loading while checking authentication or during SSR
  if (!isMounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
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

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!session?.user?.role) return '/auth/signin'
    
    if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
      return '/admin'
    }
    return '/student'
  }

  // Show welcome message for authenticated users
  const renderAuthenticatedHeader = () => (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <img 
                src="https://aieraa.com/wp-content/uploads/2020/08/Aieraa-Overseas-Logo.png" 
                alt="Aieraa Logo" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Aieraa Hostel</h1>
              <p className="text-sm text-gray-600">Welcome back, {session?.user?.name}!</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push(getDashboardUrl())}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )

  // Show normal header for unauthenticated users
  const renderPublicHeader = () => (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <img 
                src="https://aieraa.com/wp-content/uploads/2020/08/Aieraa-Overseas-Logo.png" 
                alt="Aieraa Logo" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Aieraa Hostel</h1>
              <p className="text-sm text-gray-600">Food Ordering App</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => router.push('/auth/signin')}
              className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/auth/signup')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      {status === 'authenticated' ? renderAuthenticatedHeader() : renderPublicHeader()}

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Pre-order your
            <span className="text-green-600"> hostel meals</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Skip the queue, save time, and enjoy fresh meals delivered right to your room. 
            Order today for tomorrow&apos;s meals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === 'authenticated' ? (
              <button 
                onClick={() => router.push(getDashboardUrl())}
                className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                            <Link 
              href="/auth/signup"
              prefetch={true}
              className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-lg transition-colors inline-block text-center"
            >
              Get Started
            </Link>
                <button 
                  onClick={() => router.push('/auth/signin')}
                  className="px-8 py-4 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 font-semibold text-lg transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Aieraa Hostel App?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Save Time</h4>
              <p className="text-gray-600">
                Pre-order your meals and skip the long queues. More time for what matters.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Fresh Meals</h4>
              <p className="text-gray-600">
                Enjoy freshly prepared meals made with quality ingredients every day.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Secure</h4>
              <p className="text-gray-600">
                Safe and secure payment options with university-verified accounts.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h4>
              <p className="text-gray-600">
                Simple, intuitive interface designed specifically for students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Browse Menu</h4>
              <p className="text-gray-600">
                Check out tomorrow&apos;s menu and choose your favorite dishes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Place Order</h4>
              <p className="text-gray-600">
                Add items to cart and place your order before the cutoff time.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Enjoy Meal</h4>
              <p className="text-gray-600">
                Pick up your pre-ordered meal or get it delivered to your room.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Start Ordering?
          </h3>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of students who are already saving time with Aieraa Hostel App.
          </p>
          {status === 'authenticated' ? (
            <button 
              onClick={() => router.push(getDashboardUrl())}
              className="px-8 py-4 bg-white text-green-600 rounded-xl hover:bg-gray-50 font-semibold text-lg transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <Link 
              href="/auth/signup"
              prefetch={true}
              className="px-8 py-4 bg-white text-green-600 rounded-xl hover:bg-gray-50 font-semibold text-lg transition-colors inline-block text-center"
            >
              Sign Up Now
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <img 
                src="https://aieraa.com/wp-content/uploads/2020/08/Aieraa-Overseas-Logo.png" 
                alt="Aieraa Logo" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <span className="text-xl font-bold">Aieraa Hostel</span>
          </div>
          <p className="text-gray-400 mb-4">
            Making hostel dining convenient and enjoyable for students worldwide.
          </p>
          <p className="text-gray-500 text-sm">
            © 2024 Aieraa Overseas. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 