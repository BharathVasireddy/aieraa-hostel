'use client'

import { ShoppingCart, MapPin, CreditCard, Clock, Check, User, Phone, Mail, Building, Home } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StudentLayout from '@/components/StudentLayout'
import { getVietnamTime, isPastOrderingCutoff } from '@/lib/timezone'
import { useUser } from '@/components/UserProvider'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface OrderCart {
  items: { [key: string]: number }
  orderDate: string
  totalAmount: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useUser()
  const [cart, setCart] = useState<OrderCart | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCart = async () => {
      setLoading(true)
      
      // Load cart from localStorage
      const savedCart = localStorage.getItem('orderCart')
      if (!savedCart) {
        router.push('/student/menu')
        return
      }

      const cartData: OrderCart = JSON.parse(savedCart)
      setCart(cartData)

      // Check if ordering deadline has passed for the selected date
      if (isPastOrderingCutoff(cartData.orderDate)) {
        setError('Ordering deadline has passed for this date. Please select a different date.')
        setLoading(false)
        return
      }

      // Fetch menu items to get actual names and prices
      try {
        const response = await fetch(`/api/menu?date=${cartData.orderDate}`)
        const data = await response.json()
        
        if (data.success) {
          const items: OrderItem[] = Object.entries(cartData.items).map(([itemId, quantity]) => {
            // Handle both regular items and variations (e.g., "item123-variation456")
            const baseItemId = itemId.includes('-') ? itemId.split('-')[0] : itemId
            const variationId = itemId.includes('-') ? itemId.split('-')[1] : null
            
            const menuItem = data.menuItems.find((item: any) => item.id === baseItemId)
            
            if (menuItem) {
              let itemPrice = menuItem.price  // API transforms basePrice to price
              let itemName = menuItem.name
              
              // If this is a variation, find the specific variation
              if (variationId && menuItem.variations && menuItem.variations.length > 0) {
                const variation = menuItem.variations.find((v: any) => v.id === variationId)
                if (variation) {
                  itemPrice = variation.price
                  itemName = `${menuItem.name} (${variation.name})`
                }
              } else if (menuItem.variations && menuItem.variations.length > 0) {
                // Use default variation if no specific variation selected
                const defaultVariation = menuItem.variations.find((v: any) => v.isDefault)
                if (defaultVariation) {
                  itemPrice = defaultVariation.price
                  itemName = `${menuItem.name} (${defaultVariation.name})`
                }
              }
              
              // Use offer price if available
              const finalPrice = menuItem.offerPrice && menuItem.offerPrice < itemPrice 
                ? menuItem.offerPrice 
                : itemPrice
              
              return {
                id: itemId,
                name: itemName,
                quantity: quantity as number,
                price: finalPrice
              }
            }
            
            return {
              id: itemId,
              name: `Item ${itemId}`,
              quantity: quantity as number,
              price: 100
            }
          })
          
          setOrderItems(items)
        } else {
          setError('Failed to load menu items')
        }
      } catch (error) {
        console.error('Error loading menu items:', error)
        setError('Failed to load menu items')
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [router])

  const handleSubmitOrder = async () => {
    if (!cart || !user) {
      setError('Missing cart or user data')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const orderData = {
        orderDate: cart.orderDate,
        items: Object.entries(cart.items).map(([itemId, quantity]) => ({
          menuItemId: itemId, // Send the full itemId including variant suffix
          quantity,
          notes: deliveryInstructions
        })),
        specialInstructions: deliveryInstructions,
        paymentMethod,
        totalAmount: cart.totalAmount
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (response.ok) {
        // Clear cart from localStorage
        localStorage.removeItem('orderCart')
        localStorage.removeItem('tempCart')
        
        // Navigate to success page with order details
        router.push(`/student/order-success?orderId=${data.order.id}&orderNumber=${data.order.orderNumber}`)
      } else {
        setError(data.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setError('Failed to place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <StudentLayout showDatePicker={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </StudentLayout>
    )
  }

  if (loading) {
    return (
      <StudentLayout showDatePicker={false}>
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (error && !cart) {
    return (
      <StudentLayout showDatePicker={false}>
        <div className="px-4 py-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => router.push('/student/menu')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </StudentLayout>
    )
  }

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = Math.round(subtotal * (user.university?.settings?.taxRate || 0.1))
  const total = subtotal + tax

  return (
    <StudentLayout showDatePicker={false}>
      <div className="px-4 py-6 pb-32">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Summary</h1>
          <p className="text-gray-600">Review your order before placing</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Your Order</h3>
            <span className="text-sm text-gray-500">({orderItems.length} items)</span>
          </div>
          
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                  <p className="text-sm text-gray-500">₹{item.price} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Student Details</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{user.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{user.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{user.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{user.university?.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Home className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">Room {user.roomNumber}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">Meal Date: {cart ? new Date(cart.orderDate).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
          <textarea
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            placeholder="Any special requests or dietary notes..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            rows={3}
          />
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Payment Method</h3>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="text-gray-900">Pay Online (Razorpay)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="text-gray-900">Pay at Collection Counter</span>
            </label>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Bill Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax ({Math.round((user.university?.settings?.taxRate || 0.1) * 100)}%)</span>
              <span>₹{tax}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <button
          onClick={handleSubmitOrder}
          disabled={submitting || orderItems.length === 0}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            submitting || orderItems.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:scale-98 shadow-lg'
          }`}
        >
          {submitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Placing Order...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5" />
              <span>Place Order - ₹{total}</span>
            </div>
          )}
        </button>
      </div>
    </StudentLayout>
  )
} 