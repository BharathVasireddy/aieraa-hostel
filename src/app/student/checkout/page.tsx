'use client'

import { AlertCircle, ArrowLeft, CreditCard, Edit, Edit3, Info, Minus, Plus, Shield, Trash2, User } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfToday } from 'date-fns'
import StudentLayout from '@/components/StudentLayout'
import { getVietnamTime, getOrderingCountdown } from '@/lib/timezone'
import { useUser } from '@/components/UserProvider'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  isVegetarian?: boolean
  image?: string
}

interface OrderCartData {
  items: { [key: string]: number }
  orderDate: string
  totalAmount: number
}

export default function CheckoutPage() {
  const router = useRouter()
    const { user } = useUser()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(getVietnamTime())
    const [specialInstructions, setSpecialInstructions] = useState('')
  const [menuItems, setMenuItems] = useState<{ [key: string]: any }>({})
  
  // Get selected date from localStorage  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedOrderDate')
      if (saved) return saved
    }
    const tomorrow = addDays(startOfToday(), 1)
    return format(tomorrow, 'yyyy-MM-dd')
  })

  // Update time every minute for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getVietnamTime())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Get countdown for selected date
  const countdown = useMemo(() => {
    return getOrderingCountdown(selectedDate)
  }, [selectedDate])

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = async () => {
      if (typeof window === 'undefined') return
      
      const savedCart = localStorage.getItem('orderCart')
      if (!savedCart) {
        // If no cart, redirect to menu
        router.push('/student/menu')
        return
      }

      try {
        const orderCart: OrderCartData = JSON.parse(savedCart)
        
        // Update selected date from cart
        if (orderCart.orderDate) {
          setSelectedDate(orderCart.orderDate)
        }

        // Fetch menu items to get full item details
        const response = await fetch(`/api/student/menu?date=${orderCart.orderDate}`)
        if (response.ok) {
          const menuData = await response.json()
          
          // Create a lookup map for menu items
          const menuItemsMap: { [key: string]: any } = {}
          menuData.menuItems?.forEach((item: any) => {
            menuItemsMap[item.id] = item
          })
          setMenuItems(menuItemsMap)

          // Convert cart items to CartItem format
          const cartItemsArray: CartItem[] = []
          Object.entries(orderCart.items).forEach(([itemId, quantity]) => {
            const menuItem = menuItemsMap[itemId]
            if (menuItem) {
              cartItemsArray.push({
                id: itemId,
                name: menuItem.name,
                price: menuItem.offerPrice || menuItem.price,
                quantity: quantity as number,
                isVegetarian: menuItem.isVegetarian,
                image: menuItem.image
              })
            }
          })
          
          setCartItems(cartItemsArray)
        }
      } catch (error) {
    console.error(error)
        router.push('/student/menu')
      }
    }

    loadCart()
  }, [router])

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const deliveryFee = 0 // Free delivery for hostel
    const tax = Math.round(subtotal * 0.05) // 5% tax
    const total = subtotal + deliveryFee + tax

    return {
      subtotal,
      deliveryFee,
      tax,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    }
  }, [cartItems])

  // Cart management functions
  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId))
    } else {
      setCartItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  // Simplified validation - only check if cart has items and not past cutoff
  const isValidForm = useMemo(() => {
    return cartItems.length > 0 && !countdown.isPastCutoff
  }, [cartItems, countdown.isPastCutoff])

  const handlePlaceOrder = useCallback(async () => {
    if (!isValidForm || loading) return

    setLoading(true)
    try {
      // Prepare order data for API
      const orderData = {
        items: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity
        })),
        orderDate: selectedDate,
        specialInstructions: specialInstructions || undefined,
        paymentMethod: 'cash'
      }
      
      // Call the actual orders API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Clear cart
        setCartItems([])
        localStorage.removeItem('tempCart')
        localStorage.removeItem('orderCart')
        
        // Redirect to order success page
        router.push(`/student/order-success?orderId=${result.order.id}&orderNumber=${result.order.orderNumber}`)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place order')
      }
      
    } catch (error) {
    console.error(error)
      alert(`Failed to place order: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }, [isValidForm, loading, cartItems, selectedDate, specialInstructions, router])

  // Show loading state if user not loaded
  if (!user) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </StudentLayout>
    )
  }

  // Show loading state if cart is being loaded
  if (cartItems.length === 0 && !loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 px-4 py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-neutral-800">Checkout</h1>
            <p className="text-sm text-neutral-600">
              Order for {format(new Date(selectedDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Cutoff Warning */}
        {countdown.isPastCutoff && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Ordering Deadline Passed</h3>
                <p className="text-sm text-red-700">
                  Orders must be placed before 10:00 PM Vietnam time the day before. 
                  Please select a different date to place your order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Student Information */}
        <section className="bg-white rounded-xl border border-neutral-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-neutral-800">Student Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user.studentId}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user.roomNumber}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{user.phone}</div>
            </div>
          </div>
        </section>

        {/* Cart Items Section */}
        <section className="bg-white rounded-xl border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-800">Your Order</h2>
            <span className="text-sm text-neutral-600">{totals.itemCount} item{totals.itemCount > 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900 truncate">{item.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {item.isVegetarian && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Veg
                      </span>
                    )}
                    <span className="text-sm font-semibold text-neutral-900">₹{item.price}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-neutral-600" />
                  </button>
                  <span className="w-8 text-center font-medium text-neutral-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-full hover:bg-red-100 transition-colors ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Special Instructions */}
        <section className="bg-white rounded-xl border border-neutral-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Edit3 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-neutral-800">Special Instructions</h2>
          </div>
          
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special instructions for your order (optional)"
            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-xl border border-neutral-100 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium text-neutral-900">₹{totals.subtotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Delivery Fee</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Tax (5%)</span>
              <span className="font-medium text-neutral-900">₹{totals.tax}</span>
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-neutral-900">Total</span>
                <span className="text-lg font-bold text-blue-600">₹{totals.total}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Information */}
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Delivery Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Food will be delivered to your room: {user.roomNumber}</li>
                <li>• Delivery time: 12:00 PM - 2:00 PM on {format(new Date(selectedDate), 'MMM d, yyyy')}</li>
                <li>• Payment: Cash on delivery</li>
                <li>• Please be available during delivery hours</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security Notice */}
        <section className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <span className="text-sm text-green-700">
                🔒 Your order is secured with university authentication
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Action */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
        <button
          onClick={handlePlaceOrder}
          disabled={!isValidForm || loading}
          className={`w-full flex items-center justify-center space-x-2 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
            !isValidForm || loading
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Placing Order...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Place Order • ₹{totals.total}</span>
            </>
          )}
        </button>
        
        {!isValidForm && cartItems.length > 0 && countdown.isPastCutoff && (
          <p className="text-center text-sm text-red-600 mt-2">
            Ordering deadline has passed for this date
          </p>
        )}
        
        {cartItems.length === 0 && (
          <p className="text-center text-sm text-gray-600 mt-2">
            Your cart is empty
          </p>
        )}
      </div>
    </StudentLayout>
  )
} 