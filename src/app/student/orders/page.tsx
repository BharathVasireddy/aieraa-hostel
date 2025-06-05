'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, XCircle, RefreshCw, Calendar, IndianRupee, Eye, ChefHat, Package, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import StudentLayout from '@/components/StudentLayout'

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
    category: string
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
  orderItems: OrderItem[]
}

type FilterStatus = 'all' | 'upcoming' | 'PENDING' | 'APPROVED' | 'PREPARING' | 'READY' | 'SERVED'

export default function StudentOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>('upcoming')
  const [error, setError] = useState<string | null>(null)

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/orders')
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      
      // Process orders with proper sorting (most recent first)
      const processedOrders = (data.orders || data || [])
        .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setOrders(processedOrders)
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'PREPARING':
        return <ChefHat className="w-4 h-4 text-purple-600" />
      case 'READY':
        return <Package className="w-4 h-4 text-green-600" />
      case 'SERVED':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gradient-to-r from-orange-50 to-orange-100'
      case 'APPROVED': return 'bg-gradient-to-r from-blue-50 to-blue-100'
      case 'PREPARING': return 'bg-gradient-to-r from-purple-50 to-purple-100'
      case 'READY': return 'bg-gradient-to-r from-green-50 to-green-100'
      case 'SERVED': return 'bg-gradient-to-r from-emerald-50 to-emerald-100'
      case 'CANCELLED': return 'bg-gradient-to-r from-red-50 to-red-100'
      default: return 'bg-gradient-to-r from-gray-50 to-gray-100'
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

  const viewOrderDetails = (orderId: string, orderNumber: string) => {
    router.push(`/student/orders/${orderId}?orderNumber=${orderNumber}`)
  }

  // Filter orders based on selected filter
  const getFilteredOrders = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (filter) {
      case 'upcoming':
        return orders.filter(order => {
          const orderDate = new Date(order.orderDate)
          return orderDate >= today || ['PENDING', 'APPROVED', 'PREPARING', 'READY'].includes(order.status)
        })
      case 'all':
        return orders
      default:
        return orders.filter(order => order.status === filter)
    }
  }

  const filteredOrders = getFilteredOrders()

  const filterOptions: { key: FilterStatus; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'all', label: 'All Orders' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
    { key: 'SERVED', label: 'Served' }
  ]

  return (
    <StudentLayout showDatePicker={false} className="bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-700" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">My Orders</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-green-600 disabled:opacity-50 rounded-full hover:bg-green-50 transition-all duration-200"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Filter Options */}
        <div className="mb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  filter === option.key
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl p-3 animate-pulse border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-10"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load orders</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'upcoming' ? 'No upcoming orders' : filter === 'all' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {filter === 'upcoming' 
                ? 'You don\'t have any upcoming orders. Place an order to get started!'
                : filter === 'all'
                ? 'Your order history will appear here once you place your first order'
                : `You don't have any ${filter.toLowerCase()} orders at the moment`
              }
            </p>
            <button 
              onClick={() => router.push('/student/menu')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`${getStatusBgColor(order.status)} rounded-2xl p-3 border border-white/50 hover:shadow-md transition-all duration-200 backdrop-blur-sm`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</h3>
                      <p className="text-xs text-gray-600">
                        {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-lg font-bold text-gray-900">
                      <IndianRupee className="w-4 h-4 mr-1" />
                      <span>₹{order.totalAmount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Status & Date */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>For {formatDate(order.orderDate, 'MMM dd', 'N/A')}</span>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mb-2">
                  <div className="text-xs text-gray-700">
                    {order.orderItems.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-0.5">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span className="text-gray-500 font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    {order.orderItems.length > 2 && (
                      <div className="text-xs text-gray-500 pt-0.5">
                        +{order.orderItems.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/70">
                  <div className="text-xs text-gray-500">
                    {formatDate(order.createdAt, 'MMM dd, h:mm a', 'N/A')}
                  </div>
                  <button
                    onClick={() => viewOrderDetails(order.id, order.orderNumber)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 text-xs font-medium rounded-lg transition-colors border border-white/50"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  )
} 