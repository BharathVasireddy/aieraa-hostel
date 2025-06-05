'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, MapPin, ArrowLeft, Home, Package, ChefHat, User, AlertCircle, Utensils } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@/components/UserProvider'

// Helper function to safely format dates
const formatDate = (dateString: string | undefined | null, formatString: string, fallback: string) => {
  try {
    if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
      return fallback;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
};

interface OrderDetails {
  id: string
  orderNumber: string
  orderDate: string
  totalAmount: number
  taxAmount: number
  subtotalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  specialInstructions?: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
  completedAt?: string
  orderItems: {
    id: string
    quantity: number
    price: number
    menuItem: {
      id: string
      name: string
      categories: string[]
    }
    variant?: {
      id: string
      name: string
    }
  }[]
  user: {
    id: string
    name: string
    email: string
    phone?: string
    roomNumber?: string
    university: {
      name: string
      address?: string
    }
  }
}

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const orderId = searchParams.get('orderId')
  const orderNumber = searchParams.get('orderNumber')
  
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId || !orderNumber) {
      setError('Order information not found')
      setLoading(false)
      return
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setOrder(data.order)
        } else {
          setError(data.error || 'Failed to fetch order details')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        setError('Failed to fetch order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, orderNumber])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return { 
          color: 'bg-orange-500', 
          bgColor: 'bg-orange-50', 
          textColor: 'text-orange-800',
          icon: Clock,
          title: 'Order Received',
          subtitle: 'Your order has been received and is awaiting approval',
          description: 'We have received your order and it will be reviewed shortly.'
        }
      case 'APPROVED': 
        return { 
          color: 'bg-blue-500', 
          bgColor: 'bg-blue-50', 
          textColor: 'text-blue-800',
          icon: CheckCircle,
          title: 'Order Approved',
          subtitle: 'Your order has been approved and sent to kitchen',
          description: 'Great! Your order has been approved and is now in the preparation queue.'
        }
      case 'PREPARING': 
        return { 
          color: 'bg-purple-500', 
          bgColor: 'bg-purple-50', 
          textColor: 'text-purple-800',
          icon: ChefHat,
          title: 'Being Prepared',
          subtitle: 'Our chefs are preparing your delicious meal',
          description: 'Your food is currently being prepared in our kitchen with love and care.'
        }
      case 'READY': 
        return { 
          color: 'bg-green-500', 
          bgColor: 'bg-green-50', 
          textColor: 'text-green-800',
          icon: Package,
          title: 'Ready for Collection',
          subtitle: 'Your order is ready! Please collect it now',
          description: 'Your order is ready and waiting for you at the collection counter.'
        }
      case 'SERVED': 
        return { 
          color: 'bg-emerald-500', 
          bgColor: 'bg-emerald-50', 
          textColor: 'text-emerald-800',
          icon: Utensils,
          title: 'Order Completed',
          subtitle: 'Your order has been successfully served',
          description: 'Thank you for your order! We hope you enjoyed your meal.'
        }
      case 'REJECTED': 
        return { 
          color: 'bg-red-500', 
          bgColor: 'bg-red-50', 
          textColor: 'text-red-800',
          icon: AlertCircle,
          title: 'Order Cancelled',
          subtitle: 'Your order has been cancelled',
          description: 'Unfortunately, your order could not be processed. You will receive a full refund.'
        }
      case 'CANCELLED': 
        return { 
          color: 'bg-gray-500', 
          bgColor: 'bg-gray-50', 
          textColor: 'text-gray-800',
          icon: AlertCircle,
          title: 'Order Cancelled',
          subtitle: 'Your order has been cancelled',
          description: 'Your order has been cancelled. You will receive a full refund if payment was made.'
        }
      default: 
        return { 
          color: 'bg-gray-500', 
          bgColor: 'bg-gray-50', 
          textColor: 'text-gray-800',
          icon: Clock,
          title: 'Processing Order',
          subtitle: 'We are processing your order',
          description: 'Your order is being processed. Please wait for updates.'
        }
    }
  }

  const getOrderStages = () => {
    const stages = [
      { 
        status: 'PENDING', 
        label: 'Order Placed', 
        time: formatDate(order?.createdAt, 'h:mm a', 'Just now'),
        icon: Clock
      },
      { 
        status: 'APPROVED', 
        label: 'Order Approved', 
        time: formatDate(order?.approvedAt, 'h:mm a', 'Pending'),
        icon: CheckCircle
      },
      { 
        status: 'PREPARING', 
        label: 'Being Prepared', 
        time: 'Pending',
        icon: ChefHat
      },
      { 
        status: 'READY', 
        label: 'Ready for Collection', 
        time: 'Pending',
        icon: Package
      },
      { 
        status: 'SERVED', 
        label: 'Order Completed', 
        time: formatDate(order?.completedAt, 'h:mm a', 'Pending'),
        icon: Utensils
      }
    ]

    // Handle rejected/cancelled orders
    if (order?.status === 'REJECTED' || order?.status === 'CANCELLED') {
      return [
        stages[0], // Order Placed
        {
          status: order.status,
          label: order.status === 'REJECTED' ? 'Order Rejected' : 'Order Cancelled',
          time: formatDate(order.rejectedAt, 'h:mm a', 'Recently'),
          icon: AlertCircle
        }
      ]
    }

    return stages
  }

  const getCurrentStageIndex = () => {
    if (!order) return 0
    
    const statusOrder = ['PENDING', 'APPROVED', 'PREPARING', 'READY', 'SERVED']
    const index = statusOrder.indexOf(order.status)
    return index >= 0 ? index : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested order could not be found.'}</p>
          <button
            onClick={() => router.push('/student')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon
  const orderStages = getOrderStages()
  const currentStageIndex = getCurrentStageIndex()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/student')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Dashboard</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Order Confirmation</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Success Animation */}
        <div className="text-center py-8">
          <div className="relative">
            <div className={`w-24 h-24 ${statusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse`}>
              <div className={`w-20 h-20 ${statusConfig.color} rounded-full flex items-center justify-center animate-bounce`}>
                <StatusIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            {/* Floating particles animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 ${statusConfig.color} rounded-full opacity-60 animate-ping`}
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 20}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s'
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {statusConfig.title}
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {statusConfig.subtitle}
          </p>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            {statusConfig.description}
          </p>
          <div className="text-2xl font-bold text-green-600">
            #{order.orderNumber}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Progress</h2>
          
          <div className="space-y-4">
            {orderStages.map((stage, index) => {
              const isCompleted = index <= currentStageIndex
              const isCurrent = index === currentStageIndex
              const StageIcon = stage.icon
              
              return (
                <div key={stage.status} className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted 
                      ? 'bg-green-600 border-green-600' 
                      : isCurrent
                      ? `${statusConfig.color} border-green-600`
                      : 'bg-white border-gray-300'
                  }`}>
                    <StageIcon className={`w-5 h-5 ${
                      isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {stage.label}
                    </div>
                    <div className="text-sm text-gray-600">{stage.time}</div>
                  </div>
                  {isCurrent && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Details</h2>
          
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.menuItem.name}
                    {item.variant && <span className="text-gray-600"> ({item.variant.name})</span>}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.menuItem.categories.join(', ')} • Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₹{item.price} each
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                ₹{order.subtotalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax & Fees</span>
              <span className="font-medium text-gray-900">₹{order.taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-3">
              <span className="text-gray-900">Total Paid</span>
              <span className="text-green-600">₹{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {order.specialInstructions && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2">Special Instructions</h4>
              <p className="text-blue-800">{order.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Collection Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Collection Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.user.university.name}</p>
                <p className="text-gray-600">Main Food Court • Counter 2</p>
                <p className="text-sm text-gray-500">{order.user.university.address || 'University Campus'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.user.name}</p>
                <p className="text-gray-600">Room {order.user.roomNumber || 'Not specified'}</p>
                <p className="text-sm text-gray-500">{order.user.phone || order.user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Expected Collection</p>
                <p className="text-gray-600">
                  {formatDate(order?.orderDate, 'EEEE, MMM dd', 'Today')} • 12:00 PM - 2:00 PM
                </p>
                <p className="text-sm text-gray-500">
                  Payment: {order.paymentMethod === 'cash' ? 'Pay at Counter' : 'Online Payment'} 
                  {order.paymentStatus === 'PAID' ? ' (✓ Paid)' : ' (Pending)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <button
            onClick={() => router.push('/student/orders')}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
          >
            Track Order Status
          </button>
          
          <button
            onClick={() => router.push('/student/menu')}
            className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
          >
            Order Again
          </button>
          
          <button
            onClick={() => router.push('/student')}
            className="w-full flex items-center justify-center space-x-2 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
} 