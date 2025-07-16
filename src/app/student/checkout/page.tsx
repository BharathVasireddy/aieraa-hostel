'use client'

import { ArrowLeft, Clock, MapPin, User, CreditCard, Shield, CheckCircle, AlertCircle, Minus, Plus, Trash2, Edit3, Info } from 'lucide-react'
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
  spiceLevel?: 'mild' | 'medium' | 'hot'
}

interface DeliveryDetails {
  hostelBlock: string
  roomNumber: string
  phoneNumber: string
  specialInstructions?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useUser()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [currentTime, setCurrentTime] = useState(getVietnamTime())
  const [showEditCart, setShowEditCart] = useState(false)
  
  // Form states
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    hostelBlock: '',
    roomNumber: '',
    phoneNumber: '',
    specialInstructions: ''
  })
  
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

  // Load user profile data for pre-filling
  useEffect(() => {
    if (user) {
      setDeliveryDetails(prev => ({
        ...prev,
        phoneNumber: user.phone || '',
        hostelBlock: user.hostelBlock || '',
        roomNumber: user.roomNumber || ''
      }))
    }
  }, [user])

  // Mock cart items (in real app, this would come from context/state)
  useEffect(() => {
    // Simulate loading cart from previous pages
    const mockCart: CartItem[] = [
      {
        id: '1',
        name: 'Butter Chicken with Rice',
        price: 180,
        quantity: 2,
        isVegetarian: false,
        spiceLevel: 'medium',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop'
      },
      {
        id: '2', 
        name: 'Paneer Tikka Masala',
        price: 150,
        quantity: 1,
        isVegetarian: true,
        spiceLevel: 'mild',
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop'
      },
      {
        id: '3',
        name: 'Fresh Lime Juice',
        price: 40,
        quantity: 2,
        isVegetarian: true,
        image: 'https://images.unsplash.com/photo-1544737151-6e4b001c6a6a?w=200&h=200&fit=crop'
      }
    ]
    setCartItems(mockCart)
  }, [])

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

  // Validation
  const isValidForm = useMemo(() => {
    return deliveryDetails.hostelBlock && 
           deliveryDetails.roomNumber && 
           deliveryDetails.phoneNumber &&
           cartItems.length > 0 &&
           !countdown.isPastCutoff
  }, [deliveryDetails, cartItems, countdown.isPastCutoff])

  const handlePlaceOrder = useCallback(async () => {
    if (!isValidForm || loading) return

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const orderData = {
        items: cartItems,
        deliveryDetails,
        selectedDate,
        totals,
        userId: user?.id
      }
      
      console.log('Placing order:', orderData)
      setOrderPlaced(true)
      
      // Clear cart
      setCartItems([])
      localStorage.removeItem('tempCart')
      localStorage.removeItem('orderCart')
      
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [isValidForm, loading, cartItems, deliveryDetails, selectedDate, totals, user])

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

  // Show success state
  if (orderPlaced) {
    return (
      <StudentLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-primary-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">Order Placed Successfully! 🎉</h1>
            <p className="text-neutral-600 mb-6">
              Your order has been confirmed and will be prepared for {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/student/orders')}
                className="btn-primary w-full"
              >
                Track Your Order
              </button>
              
              <button
                onClick={() => router.push('/student')}
                className="btn-outline w-full"
              >
                Back to Home
              </button>
            </div>
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

        {/* Cart Items Section */}
        <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-neutral-800">Your Order</h2>
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                  {totals.itemCount} items
                </span>
              </div>
              <button
                onClick={() => setShowEditCart(!showEditCart)}
                className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors flex items-center space-x-1"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {cartItems.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex space-x-3">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-image overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <span className="text-neutral-400 text-xs">No image</span>
                      </div>
                    )}
                    
                    {/* Veg indicator */}
                    <div className={item.isVegetarian ? 'food-veg-indicator' : 'food-non-veg-indicator'}>
                      <div className={item.isVegetarian ? 'food-veg-dot' : 'food-non-veg-dot'} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-800 line-clamp-1">{item.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {item.spiceLevel && (
                            <span className="text-xs text-neutral-500">
                              🌶️ {item.spiceLevel}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-primary-600">
                            ₹{item.price}
                          </span>
                        </div>
                      </div>
                      
                      {showEditCart && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        Subtotal: ₹{item.price * item.quantity}
                      </span>
                      
                      {showEditCart ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="btn-quantity-remove"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-neutral-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="btn-quantity-add"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-neutral-700">
                          Qty: {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-neutral-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium text-neutral-800">₹{totals.subtotal}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Delivery Fee</span>
              <span className="font-medium text-primary-600">
                {totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Tax (5%)</span>
              <span className="font-medium text-neutral-800">₹{totals.tax}</span>
            </div>
            
            <div className="border-t border-neutral-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800">Total</span>
                <span className="text-lg font-bold text-primary-600">₹{totals.total}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Details Section */}
        <section className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-neutral-800">Delivery Details</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Hostel Block *
                </label>
                <select
                  value={deliveryDetails.hostelBlock}
                  onChange={(e) => setDeliveryDetails(prev => ({...prev, hostelBlock: e.target.value}))}
                  className="input-field"
                  required
                >
                  <option value="">Select Block</option>
                  <option value="A">Block A</option>
                  <option value="B">Block B</option>
                  <option value="C">Block C</option>
                  <option value="D">Block D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  value={deliveryDetails.roomNumber}
                  onChange={(e) => setDeliveryDetails(prev => ({...prev, roomNumber: e.target.value}))}
                  placeholder="e.g., 201"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={deliveryDetails.phoneNumber}
                onChange={(e) => setDeliveryDetails(prev => ({...prev, phoneNumber: e.target.value}))}
                placeholder="+84 xxx xxx xxx"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={deliveryDetails.specialInstructions}
                onChange={(e) => setDeliveryDetails(prev => ({...prev, specialInstructions: e.target.value}))}
                placeholder="Any special requests or dietary preferences..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
        </section>

        {/* Delivery Info */}
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Delivery Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Free delivery to all hostel blocks</li>
                <li>• Orders will be delivered between 12:00 PM - 2:00 PM</li>
                <li>• Please be available at your room during delivery time</li>
                <li>• Contact support if you need to change delivery details</li>
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
          className={`w-full flex items-center justify-center space-x-2 py-4 rounded-button font-semibold text-lg transition-all duration-200 ${
            !isValidForm || loading
                          ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            : 'bg-primary-gradient text-white hover:shadow-card-hover animate-press'
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
        
        {!isValidForm && cartItems.length > 0 && !countdown.isPastCutoff && (
          <p className="text-center text-sm text-red-600 mt-2">
            Please fill in all required delivery details
          </p>
        )}
      </div>
    </StudentLayout>
  )
} 