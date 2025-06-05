'use client'

import { ArrowLeft, User, Calendar, Clock, IndianRupee, CheckCircle, XCircle, ChefHat, Package, Building, Phone, Mail, MapPin, FileText, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import { lightningFetch, lightningCache } from '@/lib/cache'

interface OrderItem {
  id: string
  quantity: number
  price: number
  menuItem: {
    id: string
    name: string
    basePrice: number
    categories: string[]
    image?: string
    isVegetarian: boolean
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
  specialInstructions?: string
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
  user: {
    id: string
    name: string
    email: string
    studentId?: string
  }
  university?: {
    id: string
    name: string
    code: string
  }
}

export default function AdminOrderDetail() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { notifications, addNotification, removeNotification } = useNotifications()

  const orderId = params?.id as string

  useEffect(() => {
    if (session?.user && orderId) {
      fetchOrderDetails()
    }
  }, [session, orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      
      // Check instant cache first
      const cacheKey = `admin_order_${orderId}`
      const cachedOrder = lightningCache.getInstant<Order>(cacheKey)
      if (cachedOrder) {
        console.log('⚡ INSTANT order details from cache')
        setOrder(cachedOrder)
        setLoading(false)
        return
      }

      const orderData = await lightningFetch(`/api/admin/orders/${orderId}`, {}, 5) // 5 min cache
      setOrder(orderData)
      // Store in instant cache
      lightningCache.setInstant(cacheKey, orderData)
    } catch (error) {
      console.error('Error fetching order details:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch order details'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string, rejectionReason?: string) => {
    if (!order) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          rejectionReason
        })
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        setOrder(updatedOrder)
        
        // Clear cache to force fresh data
        lightningCache.delete(`admin_order_${orderId}`)
        lightningCache.delete('admin_orders')
        
        const statusMessages = {
          'APPROVED': 'Order approved successfully',
          'PREPARING': 'Order marked as preparing',
          'READY': 'Order marked as ready for pickup',
          'SERVED': 'Order marked as served',
          'REJECTED': 'Order rejected',
          'CANCELLED': 'Order cancelled'
        }

        addNotification({
          type: ['REJECTED', 'CANCELLED'].includes(newStatus) ? 'error' : 'success',
          title: 'Status Updated',
          message: statusMessages[newStatus as keyof typeof statusMessages] || 'Order status updated'
        })
      } else {
        throw new Error('Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update order status'
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5" />
      case 'APPROVED': return <CheckCircle className="w-5 h-5" />
      case 'PREPARING': return <ChefHat className="w-5 h-5" />
      case 'READY': return <Package className="w-5 h-5" />
      case 'SERVED': return <CheckCircle className="w-5 h-5" />
      case 'REJECTED':
      case 'CANCELLED': return <XCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'APPROVED': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'PREPARING': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'READY': return 'text-green-600 bg-green-50 border-green-200'
      case 'SERVED': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200'
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader 
          title="Order Details" 
          showNotifications={true}
          rightElement={
            <button
              onClick={() => router.back()}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          }
        />
        <div className="px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-32 rounded-lg"></div>
            <div className="bg-gray-200 h-48 rounded-lg"></div>
            <div className="bg-gray-200 h-32 rounded-lg"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
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
        showNotifications={true}
        rightElement={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.back()}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={fetchOrderDetails}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Order Status */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span>{order.status}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
          
          {/* Status Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-3">Order Progress</div>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${['PENDING', 'APPROVED', 'PREPARING', 'READY', 'SERVED'].includes(order.status) ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className="flex-1 h-1 bg-gray-200">
                <div className={`h-full ${['APPROVED', 'PREPARING', 'READY', 'SERVED'].includes(order.status) ? 'bg-blue-500' : 'bg-gray-200'} transition-all duration-300`} style={{width: ['APPROVED', 'PREPARING', 'READY', 'SERVED'].includes(order.status) ? '100%' : '0%'}}></div>
              </div>
              <div className={`w-4 h-4 rounded-full ${['APPROVED', 'PREPARING', 'READY', 'SERVED'].includes(order.status) ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className="flex-1 h-1 bg-gray-200">
                <div className={`h-full ${['PREPARING', 'READY', 'SERVED'].includes(order.status) ? 'bg-purple-500' : 'bg-gray-200'} transition-all duration-300`} style={{width: ['PREPARING', 'READY', 'SERVED'].includes(order.status) ? '100%' : '0%'}}></div>
              </div>
              <div className={`w-4 h-4 rounded-full ${['PREPARING', 'READY', 'SERVED'].includes(order.status) ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
              <div className="flex-1 h-1 bg-gray-200">
                <div className={`h-full ${['READY', 'SERVED'].includes(order.status) ? 'bg-green-500' : 'bg-gray-200'} transition-all duration-300`} style={{width: ['READY', 'SERVED'].includes(order.status) ? '100%' : '0%'}}></div>
              </div>
              <div className={`w-4 h-4 rounded-full ${['READY', 'SERVED'].includes(order.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Pending</span>
              <span>Approved</span>
              <span>Preparing</span>
              <span>Ready</span>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Student Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{order.user.name}</div>
                {order.user.studentId && (
                  <div className="text-sm text-gray-500">ID: {order.user.studentId}</div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{order.user.email}</span>
            </div>
            {order.university && (
              <div className="flex items-center space-x-3">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{order.university.name} ({order.university.code})</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Order Time</span>
              <span className="font-medium">{format(new Date(order.createdAt), 'MMM dd, h:mm a')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {item.menuItem.isVegetarian ? (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                    <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                    <div className="text-sm text-gray-500">₹{item.price} each</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bill Summary */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{(order.totalAmount - order.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₹{order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Special Instructions
            </h3>
            <p className="text-gray-700">{order.specialInstructions}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!['SERVED', 'REJECTED', 'CANCELLED'].includes(order.status) && (
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {order.status === 'PENDING' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateOrderStatus('APPROVED')}
                    disabled={updating}
                    className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus('REJECTED', 'Order rejected by admin')}
                    disabled={updating}
                    className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Order
                  </button>
                </div>
              )}
              
              {order.status === 'APPROVED' && (
                <button
                  onClick={() => updateOrderStatus('PREPARING')}
                  disabled={updating}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Start Preparing
                </button>
              )}

              {order.status === 'PREPARING' && (
                <button
                  onClick={() => updateOrderStatus('READY')}
                  disabled={updating}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Mark as Ready
                </button>
              )}

              {order.status === 'READY' && (
                <button
                  onClick={() => updateOrderStatus('SERVED')}
                  disabled={updating}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Served
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
} 