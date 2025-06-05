'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  IndianRupee, 
  User, 
  MessageSquare,
  Package,
  ChefHat,
  QrCode,
  Copy,
  Check
} from 'lucide-react'
import { format } from 'date-fns'

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

interface OrderItem {
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
}

interface Order {
  id: string
  orderNumber: string
  orderDate: string
  status: string
  paymentStatus: string
  totalAmount: number
  taxAmount: number
  subtotalAmount: number
  specialInstructions?: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
  completedAt?: string
  orderItems: OrderItem[]
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

export default function OrderDetails() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeCopied, setQrCodeCopied] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  }, [params.id])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!params.id) {
        setError('No order ID provided')
        setOrder(null)
        return
      }

      const response = await fetch(`/api/orders/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found')
          setOrder(null)
        } else {
          throw new Error(`Failed to fetch order: ${response.status}`)
        }
        return
      }

      const data = await response.json()
      
      // The API returns { success: true, order: {...} }
      if (data.success && data.order) {
        setOrder(data.order)
      } else {
        setError('Invalid order data received')
        setOrder(null)
      }
      
    } catch (error) {
      console.error('Error fetching order details:', error)
      setError('Failed to load order details')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-orange-600" />
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'PREPARING':
        return <ChefHat className="w-5 h-5 text-purple-600" />
      case 'READY':
        return <Package className="w-5 h-5 text-green-600" />
      case 'SERVED':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-orange-800 bg-orange-100 border-orange-300'
      case 'APPROVED': return 'text-blue-800 bg-blue-100 border-blue-300'
      case 'PREPARING': return 'text-purple-800 bg-purple-100 border-purple-300'
      case 'READY': return 'text-green-800 bg-green-100 border-green-300'
      case 'SERVED': return 'text-emerald-800 bg-emerald-100 border-emerald-300'
      case 'CANCELLED': return 'text-red-800 bg-red-100 border-red-300'
      default: return 'text-gray-800 bg-gray-100 border-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending for Approval'
      case 'APPROVED': return 'Approved'
      case 'PREPARING': return 'Preparing'
      case 'READY': return 'Ready to Collect'
      case 'SERVED': return 'Served'
      case 'CANCELLED': return 'Cancelled'
      default: return status
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Your order has been placed and is waiting for approval'
      case 'APPROVED': return 'Your order has been approved and will be prepared soon'
      case 'PREPARING': return 'Your order is being prepared by the kitchen'
      case 'READY': return 'Your order is ready for collection'
      case 'SERVED': return 'Your order has been served'
      case 'CANCELLED': return 'This order was cancelled'
      default: return ''
    }
  }

  const generateQRData = (order: Order) => {
    return JSON.stringify({
      orderId: order.id,
      orderNumber: order.orderNumber,
      studentId: order.user.id,
      studentName: order.user.name,
      totalAmount: order.totalAmount,
      items: order.orderItems.length,
      timestamp: new Date().toISOString()
    })
  }

  const copyQRData = async () => {
    if (!order) return
    
    const qrData = generateQRData(order)
    await navigator.clipboard.writeText(qrData)
    setQrCodeCopied(true)
    setTimeout(() => setQrCodeCopied(false), 2000)
  }

  const generateQRCodeURL = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Order Details</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Order not found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error === 'Order not found' 
              ? "The order you're looking for doesn't exist." 
              : "There was an error loading the order details."
            }
          </p>
          <button 
            onClick={() => router.push('/student/orders')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">#{order.orderNumber}</h1>
            <p className="text-sm text-gray-600">Order Details</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            {getStatusIcon(order.status)}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{getStatusText(order.status)}</h2>
              <p className="text-sm text-gray-600">{getStatusDescription(order.status)}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>For {formatDate(order.orderDate, 'MMM dd, yyyy', 'N/A')}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Ordered {formatDate(order.createdAt, 'MMM dd, h:mm a', 'N/A')}</span>
            </div>
          </div>
        </div>

        {/* QR Code Section - Only show for READY orders */}
        {order.status === 'READY' && (
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Collection QR Code</h3>
              </div>
              
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <img 
                  src={generateQRCodeURL(generateQRData(order))}
                  alt="Order QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Show this QR code at the food counter to collect your order
              </p>
              
              <button
                onClick={copyQRData}
                className="flex items-center space-x-2 mx-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {qrCodeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{qrCodeCopied ? 'Copied!' : 'Copy QR Data'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          </div>
          
          <div className="px-6">
            {(order.orderItems || []).map((item, index) => (
              <div key={item.id} className={`py-4 ${index < (order.orderItems?.length || 0) - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.menuItem?.name || 'Unknown Item'}</h4>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-500">Qty: {item.quantity || 0}</span>
                      <span className="text-sm text-gray-500">₹{item.price || 0} each</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{item.menuItem?.categories.join(', ') || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center text-lg font-semibold text-gray-900">
                      <IndianRupee className="w-4 h-4 mr-1" />
                      <span>₹{((item.price || 0) * (item.quantity || 0)).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="p-6 pt-0">
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">₹{(order.subtotalAmount || order.totalAmount - order.taxAmount).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tax & Fees</span>
                <span className="text-gray-900">₹{(order.taxAmount || 0).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <div className="flex items-center text-gray-900">
                  <IndianRupee className="w-5 h-5 mr-1" />
                  <span>₹{(order.totalAmount || 0).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Student Information</h4>
                <p className="text-sm text-gray-600">
                  {order.user.name}<br />
                  {order.user.email}
                </p>
              </div>
            </div>

            {order.specialInstructions && (
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Special Instructions</h4>
                  <p className="text-sm text-gray-600">{order.specialInstructions}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Payment Status</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">Cash on Collection</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'PAID' 
                      ? 'text-green-800 bg-green-100' 
                      : 'text-orange-800 bg-orange-100'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 