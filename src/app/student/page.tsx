'use client'

import { Calendar, ShoppingCart, Clock, User, ChevronDown, Star, MapPin, Flame, TrendingUp, Zap, Home, UtensilsCrossed, Sparkles, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfToday } from 'date-fns'
import StudentLayout from '@/components/StudentLayout'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { getVietnamTime, getVietnamGreeting, getOrderingCountdown } from '@/lib/timezone'
import { useUser } from '@/components/UserProvider'

interface PopularDish {
  id: string
  name: string
  price: number
  offerPrice?: number
  image?: string
  orders: number
  isVeg: boolean
  category: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

interface TodaysSpecial {
  id: string
  name: string
  originalPrice?: number
  discountPrice?: number
  price: number
  image?: string
  badge: string
  isVeg: boolean
  category: string
  discount?: number
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user } = useUser()
  const [currentTime, setCurrentTime] = useState(getVietnamTime())
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([])
  const [todaysSpecials, setTodaysSpecials] = useState<TodaysSpecial[]>([])
  const [loadingDishes, setLoadingDishes] = useState(true)
  const [loadingSpecials, setLoadingSpecials] = useState(true)
  
  // Get selected date from localStorage
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedOrderDate')
      if (saved) return saved
    }
    const tomorrow = addDays(startOfToday(), 1)
    return format(tomorrow, 'yyyy-MM-dd')
  })

  // Update time every minute for real-time countdown (Vietnam time)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getVietnamTime())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Listen to localStorage changes for selectedDate
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('selectedOrderDate')
      if (saved && saved !== selectedDate) {
        setSelectedDate(saved)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen to custom events for same-tab updates
    const handleDateChange = (e: CustomEvent) => {
      setSelectedDate(e.detail.date)
    }
    
    window.addEventListener('dateChanged', handleDateChange as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dateChanged', handleDateChange as EventListener)
    }
  }, [selectedDate])

  // Fetch popular dishes
  useEffect(() => {
    const fetchPopularDishes = async () => {
      try {
        setLoadingDishes(true)
        const response = await fetch('/api/student/popular-dishes')
        const data = await response.json()
        
        if (data.success) {
          setPopularDishes(data.dishes)
        } else {
          console.error('Failed to fetch popular dishes:', data.error)
        }
      } catch (error) {
        console.error('Error fetching popular dishes:', error)
      } finally {
        setLoadingDishes(false)
      }
    }

    fetchPopularDishes()
  }, [])

  // Fetch today's specials
  useEffect(() => {
    const fetchTodaysSpecials = async () => {
      try {
        setLoadingSpecials(true)
        const response = await fetch('/api/student/todays-specials')
        const data = await response.json()
        
        if (data.success) {
          setTodaysSpecials(data.specials)
        } else {
          console.error('Failed to fetch today\'s specials:', data.error)
        }
      } catch (error) {
        console.error('Error fetching today\'s specials:', error)
      } finally {
        setLoadingSpecials(false)
      }
    }

    fetchTodaysSpecials()
  }, [])

  // Calculate countdown using new timezone logic - based on selected date
  const countdown = useMemo(() => {
    return getOrderingCountdown(selectedDate)
  }, [currentTime, selectedDate])

  // Dynamic popular search terms based on popular dishes
  const popularSearches = useMemo(() => {
    if (popularDishes.length === 0) {
      return ['Butter Chicken', 'Biryani', 'Paneer', 'Dal', 'Naan', 'Rice', 'Curry', 'Thali']
    }
    
    // Extract keywords from popular dish names
    const searchTerms = new Set<string>()
    popularDishes.forEach(dish => {
      const words = dish.name.split(' ')
      words.forEach(word => {
        if (word.length > 3) {
          searchTerms.add(word)
        }
      })
    })
    
    return Array.from(searchTerms).slice(0, 8)
  }, [popularDishes])

  const handleMenuNavigation = useCallback(() => {
    // Clear any existing search query when navigating normally
    localStorage.removeItem('searchQuery')
    router.push('/student/menu')
  }, [router])

  const handleSearchClick = useCallback((searchTerm?: string) => {
    if (searchTerm) {
      localStorage.setItem('searchQuery', searchTerm)
    }
    router.push('/student/menu')
  }, [router])

  const addToCart = useCallback((dish: { id: string; name: string; price: number; isVeg: boolean; category: string; image?: string }) => {
    // Navigate to menu with the item pre-selected via search
    localStorage.setItem('searchQuery', dish.name)
    router.push('/student/menu')
  }, [router])

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      {/* Compact Welcome Banner with Search */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-4 text-white">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold mb-0.5">Good {getVietnamGreeting()}, {user.name.split(' ')[0]}! 👋</h2>
              <p className="text-green-100 text-xs">
                {countdown.isPastCutoff
                  ? 'Ordering deadline has passed for this date. Choose another day!' 
                  : 'Ready to pre-order your hostel meals?'
                }
              </p>
            </div>
            <button 
              onClick={handleMenuNavigation}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30 active:scale-95"
            >
              Browse Menu
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-200" />
            <input
              type="text"
              placeholder="Search for hostel dishes..."
              onClick={() => handleSearchClick()}
              readOnly
              className="w-full pl-10 pr-4 py-2.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200 cursor-pointer"
            />
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap gap-2">
            {popularSearches.slice(0, 4).map((search) => (
              <button
                key={search}
                onClick={() => handleSearchClick(search)}
                className="px-3 py-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-full text-xs text-white hover:bg-opacity-30 transition-all duration-200 active:scale-95"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Popular Dishes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Popular This Month</h3>
            </div>
            <button 
              onClick={handleMenuNavigation}
              className="text-sm text-green-600 font-medium hover:text-green-700 transition-colors"
            >
              View All
            </button>
          </div>

          {loadingDishes ? (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-40 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm animate-pulse">
                  <div className="w-full h-24 bg-gray-200 rounded-xl mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : popularDishes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-600">No popular dishes available yet</p>
              <button 
                onClick={handleMenuNavigation}
                className="mt-2 text-green-600 hover:text-green-700 font-medium"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {popularDishes.slice(0, 6).map((dish) => (
                <div 
                  key={dish.id} 
                  className="flex-shrink-0 w-40 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  onClick={() => addToCart(dish)}
                >
                  <div className="relative w-full h-24 bg-gray-100 rounded-xl mb-3 overflow-hidden">
                    {dish.image ? (
                      <img 
                        src={dish.image} 
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UtensilsCrossed className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      {dish.isVeg ? (
                        <div className="w-3 h-3 bg-green-100 border border-green-500 rounded-sm flex items-center justify-center">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-sm flex items-center justify-center">
                          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {dish.orders} orders
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1 truncate">{dish.name}</h4>
                  <div className="flex items-center justify-between">
                    {dish.offerPrice ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-green-600">₹{dish.offerPrice}</span>
                        <span className="text-xs text-gray-500 line-through">₹{dish.price}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-gray-900">₹{dish.price}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Specials Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-gray-900">Today&apos;s Specials</h3>
            </div>
            <button 
              onClick={handleMenuNavigation}
              className="text-sm text-green-600 font-medium hover:text-green-700 transition-colors"
            >
              View All
            </button>
          </div>

          {loadingSpecials ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
                  <div className="flex">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : todaysSpecials.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-600">No special offers today</p>
              <button 
                onClick={handleMenuNavigation}
                className="mt-2 text-green-600 hover:text-green-700 font-medium"
              >
                Check Regular Menu
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysSpecials.slice(0, 3).map((special) => (
                <div 
                  key={special.id} 
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  onClick={() => addToCart(special)}
                >
                  <div className="flex">
                    <div className="relative w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {special.image ? (
                        <img 
                          src={special.image} 
                          alt={special.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        {special.isVeg ? (
                          <div className="w-3 h-3 bg-green-100 border border-green-500 rounded-sm flex items-center justify-center">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-sm flex items-center justify-center">
                            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      {special.discount && special.discount > 0 && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full font-bold">
                          {special.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{special.name}</h4>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                          {special.badge}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        {special.discountPrice ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-green-600">₹{special.discountPrice}</span>
                            <span className="text-sm text-gray-500 line-through">₹{special.originalPrice}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">₹{special.price}</span>
                        )}
                        <button className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => router.push('/student/orders')}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left hover:bg-blue-100 transition-colors active:scale-95"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">My Orders</h4>
                <p className="text-xs text-blue-700">Track your meals</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/student/profile')}
            className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-left hover:bg-purple-100 transition-colors active:scale-95"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">Profile</h4>
                <p className="text-xs text-purple-700">Account settings</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </StudentLayout>
  )
} 