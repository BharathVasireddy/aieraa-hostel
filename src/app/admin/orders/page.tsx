'use client'

import { Search, Filter, CheckCircle, XCircle, Clock, Eye, Calendar, User, IndianRupee, RefreshCw, Check, X, ChefHat, Package, ArrowRight, Building } from 'lucide-react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import BottomNavigation from '@/components/BottomNavigation'
import MobileHeader from '@/components/MobileHeader'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import { lightningFetch, lightningCache } from '@/lib/cache'

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
  deliveryInstructions?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
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

type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'PREPARING' | 'READY' | 'SERVED' | 'REJECTED' | 'CANCELLED'

export default function AdminOrders() {
  const { data: session } = useSession()
  const [selectedTab, setSelectedTab] = useState<FilterStatus>('PENDING')
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [currentUserData, setCurrentUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    if (session?.user) {
      fetchCurrentUser()
      fetchOrders()
    }
  }, [session])

  useEffect(() => {
    filterOrders()
  }, [orders, selectedTab, searchQuery])

  const fetchCurrentUser = async () => {
    try {
      // Check instant cache first
      const cacheKey = 'admin_profile'
      const cachedProfile = lightningCache.getInstant<{profile: any}>(cacheKey)
      if (cachedProfile) {
        console.log('⚡ INSTANT admin profile from cache')
        setCurrentUserData(cachedProfile.profile)
        return
      }

      const data = await lightningFetch('/api/admin/profile', {}, 30) // 30 min cache
      setCurrentUserData(data.profile)
      // Store in instant cache
      lightningCache.setInstant(cacheKey, data)
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Check instant cache first
      const cacheKey = 'admin_orders'
      const cachedOrders = lightningCache.getInstant<Order[]>(cacheKey)
      if (cachedOrders) {
        console.log('⚡ INSTANT orders from cache')
        setOrders(cachedOrders)
        setLoading(false)
        return
      }

      const ordersData = await lightningFetch('/api/admin/orders', {}, 5) // 5 min cache for orders
      setOrders(ordersData)
      // Store in instant cache
      lightningCache.setInstant(cacheKey, ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch orders. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Clear cache and force fresh data
    lightningCache.delete('admin_orders')
    lightningCache.delete('admin_profile')
    await fetchOrders()
    await fetchCurrentUser()
    setRefreshing(false)
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by status
    if (selectedTab !== 'all') {
      filtered = filtered.filter(order => order.status === selectedTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.user.name.toLowerCase().includes(query) ||
        order.user.email.toLowerCase().includes(query) ||
        order.orderItems.some(item => item.menuItem.name.toLowerCase().includes(query)) ||
        order.university?.name.toLowerCase().includes(query)
      )
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, rejectionReason?: string) => {
    try {
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
        
        // Update local state immediately for instant feedback
        setOrders(orders.map(order => 
          order.id === orderId ? updatedOrder : order
        ))
        
        // Clear cache to force fresh data on next load
        lightningCache.delete('admin_orders')
        
        const statusMessages = {
          'APPROVED': 'Order approved - ready for kitchen preparation',
          'PREPARING': 'Order is now being prepared by the kitchen',
          'READY': 'Order is ready for student collection',
          'SERVED': 'Order has been served successfully',
          'REJECTED': 'Order rejected',
          'CANCELLED': 'Order cancelled'
        }

        addNotification({
          type: ['REJECTED', 'CANCELLED'].includes(newStatus) ? 'error' : 'success',
          title: ['REJECTED', 'CANCELLED'].includes(newStatus) ? 'Order Rejected' : 'Status Updated',
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
    }
  }

  const approveOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'APPROVED')
  }

  const startPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'PREPARING')
  }

  const markReady = (orderId: string) => {
    updateOrderStatus(orderId, 'READY')
  }

  const markServed = (orderId: string) => {
    updateOrderStatus(orderId, 'SERVED')
  }

  const rejectOrder = (orderId: string, reason = 'Order rejected by admin') => {
    updateOrderStatus(orderId, 'REJECTED', reason)
  }

  const cancelOrder = (orderId: string, reason = 'Order cancelled by admin') => {
    updateOrderStatus(orderId, 'CANCELLED', reason)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'PREPARING': return <ChefHat className="w-4 h-4" />
      case 'READY': return <Package className="w-4 h-4" />
      case 'SERVED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED':
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
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

  const getOrderCounts = () => {
    const counts = {
      all: orders.length,
      PENDING: orders.filter(o => o.status === 'PENDING').length,
      APPROVED: orders.filter(o => o.status === 'APPROVED').length,
      PREPARING: orders.filter(o => o.status === 'PREPARING').length,
      READY: orders.filter(o => o.status === 'READY').length,
      SERVED: orders.filter(o => o.status === 'SERVED').length,
      REJECTED: orders.filter(o => o.status === 'REJECTED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    }
    return counts
  }

  const counts = getOrderCounts()

  const filterTabs = [
    { key: 'all' as FilterStatus, label: 'All Orders', count: counts.all, color: 'gray' },
    { key: 'PENDING' as FilterStatus, label: 'Pending', count: counts.PENDING, color: 'orange' },
    { key: 'APPROVED' as FilterStatus, label: 'Approved', count: counts.APPROVED, color: 'blue' },
    { key: 'PREPARING' as FilterStatus, label: 'Preparing', count: counts.PREPARING, color: 'purple' },
    { key: 'READY' as FilterStatus, label: 'Ready', count: counts.READY, color: 'green' },
    { key: 'SERVED' as FilterStatus, label: 'Served', count: counts.SERVED, color: 'emerald' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Use MobileHeader for consistency */}
      <MobileHeader 
        title="Order Management" 
        showNotifications={true}
        rightElement={
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-lg font-bold text-gray-900">{counts.all}</p>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Header Details */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            {currentUserData?.role === 'ADMIN' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                👑 Super Admin
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🎯 University Manager
              </span>
            )}
            {currentUserData?.university && (
              <div className="flex items-center text-sm text-gray-600">
                <Building className="w-4 h-4 mr-1" />
                {currentUserData.university.name}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, students, items, universities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Status Filter Tabs - Responsive */}
          <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
            {filterTabs.map(tab => (
              <button 
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTab === tab.key 
                    ? `bg-${tab.color}-600 text-white` 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Orders Grid - Responsive */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 border border-gray-100 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchQuery ? 'No matching orders found' : `No ${selectedTab.toLowerCase()} orders`}
              </h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : `${selectedTab} orders will appear here`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">#{order.orderNumber}</div>
                      <div className="text-sm text-gray-600 flex items-center justify-end">
                        <IndianRupee className="w-3 h-3 mr-1" />
                        ₹{order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="flex items-start space-x-3 mb-4">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{order.user.name}</div>
                      <div className="text-sm text-gray-600 truncate">{order.user.email}</div>
                      {order.user.studentId && (
                        <div className="text-xs text-gray-500">ID: {order.user.studentId}</div>
                      )}
                    </div>
                  </div>

                  {/* University Info for Super Admin */}
                  {currentUserData?.role === 'ADMIN' && order.university && (
                    <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded-lg">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{order.university.name} ({order.university.code})</span>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600">
                      {order.orderItems.slice(0, 2).map((item, index) => (
                        <span key={item.id}>
                          {item.quantity}x {item.menuItem.name}
                          {index < order.orderItems.slice(0, 2).length - 1 && ', '}
                        </span>
                      ))}
                      {order.orderItems.length > 2 && (
                        <span> +{order.orderItems.length - 2} more items</span>
                      )}
                    </div>
                  </div>

                  {/* Order Date */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>For {format(new Date(order.orderDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <span>Ordered {format(new Date(order.createdAt), 'MMM dd, h:mm a')}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {order.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => approveOrder(order.id)}
                          className="bg-green-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectOrder(order.id)}
                          className="bg-red-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {order.status === 'APPROVED' && (
                      <button
                        onClick={() => startPreparing(order.id)}
                        className="w-full bg-purple-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                      >
                        <ChefHat className="w-4 h-4 mr-1" />
                        Start Preparing
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => markReady(order.id)}
                        className="w-full bg-green-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => markServed(order.id)}
                        className="w-full bg-emerald-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Served
                      </button>
                    )}

                    {/* Status Progress Indicator */}
                    {!['REJECTED', 'CANCELLED', 'SERVED'].includes(order.status) && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-2">Order Progress</div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${order.status === 'PENDING' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <div className={`w-3 h-3 rounded-full ${order.status === 'APPROVED' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <div className={`w-3 h-3 rounded-full ${order.status === 'PREPARING' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <div className={`w-3 h-3 rounded-full ${order.status === 'READY' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Navigate to admin order details page instead of student page
                          window.open(`/admin/orders/${order.id}`, '_blank')
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      {!['SERVED', 'REJECTED', 'CANCELLED'].includes(order.status) && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="bg-red-100 text-red-700 text-sm py-2 px-3 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  {order.deliveryInstructions && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <span className="font-medium">Instructions:</span> {order.deliveryInstructions}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
} 