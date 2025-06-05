'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ArrowLeft, Clock, ShoppingCart, Plus, Minus } from 'lucide-react'
import { format, addDays, isSameDay, isToday, isTomorrow } from 'date-fns'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  isVegetarian: boolean
  isVegan: boolean
  calories: number
  isAvailable?: boolean
  maxQuantity?: number
  currentQuantity?: number
}

function OrderPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDate = searchParams.get('date')
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) {
      return new Date(initialDate)
    }
    // Default to tomorrow (since cutoff is 10 PM today)
    return addDays(new Date(), 1)
  })
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Generate available dates (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1))

  // Fetch menu items for selected date
  useEffect(() => {
    const fetchMenuForDate = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/menu/availability?date=${format(selectedDate, 'yyyy-MM-dd')}`)
        if (response.ok) {
          const data = await response.json()
          setMenuItems(data)
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuForDate()
  }, [selectedDate])

  const addToCart = (itemId: string) => {
    const item = menuItems.find(item => item.id === itemId)
    if (!item) return

    const currentCartQuantity = cart[itemId] || 0
    const remainingStock = (item.maxQuantity || 50) - (item.currentQuantity || 0) - currentCartQuantity

    if (remainingStock > 0) {
      setCart(prev => ({
        ...prev,
        [itemId]: currentCartQuantity + 1
      }))
    }
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) {
        newCart[itemId]--
      } else {
        delete newCart[itemId]
      }
      return newCart
    })
  }

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(item => item.id === itemId)
      return total + (item ? item.price * quantity : 0)
    }, 0)
  }

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0)
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE')
  }

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category.toLowerCase() === selectedCategory)

  const proceedToCheckout = () => {
    // Store cart and date in localStorage for checkout
    localStorage.setItem('orderCart', JSON.stringify({
      items: cart,
      orderDate: format(selectedDate, 'yyyy-MM-dd'),
      total: getCartTotal()
    }))
    router.push('/student/checkout')
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Order Food</h1>
            <div></div>
          </div>

          {/* Date Selection */}
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <Calendar className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Select Date</span>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {availableDates.map((date, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg text-center border transition-colors ${
                    isSameDay(selectedDate, date)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-xs font-medium">
                    {getDateLabel(date)}
                  </div>
                  <div className="text-sm">
                    {format(date, 'dd')}
                  </div>
                  <div className="text-xs opacity-75">
                    {format(date, 'MMM')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cutoff Notice */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm text-blue-800">
                Order by 10:00 PM today for {format(selectedDate, 'MMM dd')}
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({menuItems.length})
            </button>
            {['breakfast', 'lunch', 'dinner', 'snacks', 'beverages'].map(category => {
              const count = menuItems.filter(item => item.category.toLowerCase() === category).length
              return (
                <button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items available
            </h3>
            <p className="text-sm text-gray-600">
              Try selecting a different date or category
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const cartQuantity = cart[item.id] || 0
            const remainingStock = (item.maxQuantity || 50) - (item.currentQuantity || 0) - cartQuantity
            const isOutOfStock = remainingStock <= 0 && cartQuantity === 0

            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.isVegetarian && (
                        <span className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        </span>
                      )}
                      {item.isVegan && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Vegan</span>
                      )}
                      {isOutOfStock && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Out of Stock</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      <span>{item.calories} cal</span>
                      <span className="capitalize">{item.category}</span>
                      <span>{remainingStock + cartQuantity}/{item.maxQuantity || 50} available</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                      <div className="flex items-center space-x-2">
                        {cartQuantity > 0 ? (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">{cartQuantity}</span>
                            <button 
                              onClick={() => addToCart(item.id)}
                              disabled={remainingStock <= 0}
                              className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(item.id)}
                            disabled={isOutOfStock}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isOutOfStock ? 'Out of Stock' : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Floating Cart Summary */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-5 h-5" />
                <div>
                  <div className="font-semibold">{getCartItemCount()} items</div>
                  <div className="text-blue-100 text-sm">
                    ₹{getCartTotal().toFixed(2)} • {format(selectedDate, 'MMM dd')}
                  </div>
                </div>
              </div>
              <button 
                onClick={proceedToCheckout}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  )
} 