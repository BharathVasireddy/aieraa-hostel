'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Package, Clock, CheckCircle, Star, IndianRupee, MapPin, Phone, QrCode, Download, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRCodeComponent from 'react-qr-code'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import { lightningFetch, lightningCache } from '@/lib/cache'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  subtotalAmount: number
  taxAmount: number
  orderDate: string
  createdAt: string
  completedAt?: string
  specialInstructions?: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    variant?: {
      name: string
    }
    menuItem: {
      image?: string
      isVegetarian: boolean
      isVegan: boolean
    }
  }>
}

export default function StudentOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')
  const [orderId, setOrderId] = useState<string>('')
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const getOrderId = async () => {
      const resolvedParams = await params
      setOrderId(resolvedParams.id)
    }
    getOrderId()
  }, [params])

  useEffect(() => {
    if (session?.user && orderId) {
      fetchOrderDetail()
    }
  }, [session, orderId])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      
      // Check instant cache first
      const cacheKey = `student_order_${orderId}`
      const cachedOrder = lightningCache.getInstant<OrderDetail>(cacheKey)
      if (cachedOrder) {
        console.log('⚡ INSTANT order detail from cache')
        setOrder(cachedOrder)
        generateQRCode(cachedOrder)
        setLoading(false)
        return
      }

      const orderData = await lightningFetch(`/api/orders/${orderId}`, {}, 5) // 5 min cache
      setOrder(orderData)
      generateQRCode(orderData)
      
      // Store in instant cache
      lightningCache.setInstant(cacheKey, orderData)
    } catch (error) {
      console.error('Error fetching order detail:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch order details'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = (orderData: OrderDetail) => {
    // Generate QR code data containing order information for caterer scanning
    const qrData = {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      studentName: session?.user?.name || 'Unknown',
      totalAmount: orderData.totalAmount,
      status: orderData.status,
      timestamp: new Date().toISOString(),
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        variant: item.variant?.name
      }))
    }
    setQrCodeData(JSON.stringify(qrData))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'APPROVED': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'PREPARING': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'READY': return 'text-green-600 bg-green-50 border-green-200'
      case 'SERVED': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200'
      case 'CANCELLED': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'PREPARING': return <Package className="w-4 h-4" />
      case 'READY': return <CheckCircle className="w-4 h-4" />
      case 'SERVED': return <Star className="w-4 h-4" />
      case 'REJECTED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Your order is pending approval'
      case 'APPROVED': return 'Your order has been approved and is being prepared'
      case 'PREPARING': return 'Your order is being prepared'
      case 'READY': return 'Your order is ready for pickup! Show your QR code to the counter staff'
      case 'SERVED': return 'Your order has been served. Enjoy your meal!'
      case 'REJECTED': return 'Your order was rejected'
      case 'CANCELLED': return 'Your order was cancelled'
      default: return ''
    }
  }

  const shareOrder = async () => {
    if (navigator.share && order) {
      try {
        await navigator.share({
          title: `Order #${order.orderNumber}`,
          text: `My food order is ${order.status.toLowerCase()}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      addNotification({
        type: 'success',
        title: 'Link Copied',
        message: 'Order link copied to clipboard'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader 
          title="Order Details" 
          showNotifications={true}
          rightElement={
            <Link href="/student/orders" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          }
        />
        <div className="px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-32 rounded-lg"></div>
            <div className="bg-gray-200 h-48 rounded-lg"></div>
            <div className="bg-gray-200 h-24 rounded-lg"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader 
          title="Order Details" 
          rightElement={
            <Link href="/student/orders" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          }
        />
        <div className="px-4 py-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-600 mb-6">The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Link
            href="/student/orders"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      <MobileHeader 
        title={`Order #${order.orderNumber}`}
        rightElement={
          <div className="flex items-center space-x-2">
            <Link href="/student/orders" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <button
              onClick={shareOrder}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Order Status */}
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span>{order.status}</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">{getStatusMessage(order.status)}</p>
          
          {order.status === 'READY' && (
            <button
              onClick={() => setShowQR(true)}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <QrCode className="w-5 h-5" />
              <span>Show QR Code for Pickup</span>
            </button>
          )}

          {order.completedAt && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Completed: {format(new Date(order.completedAt), 'MMM dd, yyyy h:mm a')}
              </p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.menuItem.image ? (
                    <Image
                      src={item.menuItem.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-600">{item.variant.name}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {item.menuItem.isVegetarian && (
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                        {item.menuItem.isVegan && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Vegan
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 flex items-center">
                        <IndianRupee className="w-3 h-3 mr-0.5" />
                        {item.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium flex items-center">
                <IndianRupee className="w-3 h-3 mr-0.5" />
                {order.subtotalAmount.toFixed(2)}
              </span>
            </div>
            
            {order.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium flex items-center">
                  <IndianRupee className="w-3 h-3 mr-0.5" />
                  {order.taxAmount.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900 flex items-center">
                  <IndianRupee className="w-4 h-4 mr-0.5" />
                  {order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'PAID' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h2>
            <p className="text-gray-700">{order.specialInstructions}</p>
          </div>
        )}

        {/* Order Timeline */}
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Order Placed</p>
                <p className="text-sm text-gray-600">{format(new Date(order.createdAt), 'MMM dd, yyyy h:mm a')}</p>
              </div>
            </div>
            
            {['APPROVED', 'PREPARING', 'READY', 'SERVED'].includes(order.status) && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Approved</p>
                  <p className="text-sm text-gray-600">Your order is being prepared</p>
                </div>
              </div>
            )}
            
            {order.status === 'SERVED' && order.completedAt && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Completed</p>
                  <p className="text-sm text-gray-600">{format(new Date(order.completedAt), 'MMM dd, yyyy h:mm a')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Show this QR Code</h3>
              <p className="text-sm text-gray-600 mb-6">Present this QR code to the counter staff to collect your order</p>
              
              {/* QR Code Placeholder - In a real app, you'd use a QR code library */}
              <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-6 p-4">
                <QRCodeComponent 
                  value={qrCodeData} 
                  size={180}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
                <p className="text-xs text-gray-500 mt-1">Show this QR code to the counter staff</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowQR(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement QR code download functionality
                    addNotification({
                      type: 'info',
                      title: 'Feature Coming Soon',
                      message: 'QR code download will be available soon'
                    })
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
} 