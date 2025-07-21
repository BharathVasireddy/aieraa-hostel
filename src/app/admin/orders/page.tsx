'use client'

import { ArrowRight, Building, Calendar, Check, CheckCircle, ChefHat, ChevronDown, Clock, Eye, IndianRupee, Package, RefreshCw, Search, User, X, XCircle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'

import MobileHeader from '@/components/MobileHeader'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import { showToast } from '@/components/ui/Toast'

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

interface University {
  id: string
  name: string
  code: string
  isActive: boolean
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
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all')
  const [universities, setUniversities] = useState<University[]>([])
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list') // Default to list view
  useNotifications()

  const filterOrders = useCallback(() => {
    let filtered = orders

    // Filter by university (Super Admin only)
    if (currentUserData?.role === 'ADMIN' && selectedUniversity !== 'all') {
      filtered = filtered.filter(order => order.university?.id === selectedUniversity)
    }

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
  }, [orders, selectedTab, searchQuery, selectedUniversity, currentUserData?.role])

  useEffect(() => {
    filterOrders()
  }, [filterOrders])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (showUniversityDropdown) {
        setShowUniversityDropdown(false)
      }
    }
    
    if (showUniversityDropdown) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      if (showUniversityDropdown) {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showUniversityDropdown])

    const fetchCurrentUser = useCallback(async () => {
    try {
      // Always fetch fresh data - no caching
      const profileResponse = await fetch('/api/admin/profile', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })
      const data = await profileResponse.json()
      setCurrentUserData(data.profile)
    } catch (error) {
       console.error(error)
    }
  }, [])

  const fetchUniversities = useCallback(async () => {
    try {
      // Only fetch for Super Admins
      if (currentUserData?.role !== 'ADMIN') return

      // Always fetch fresh data - no caching
      const universitiesResponse = await fetch('/api/admin/universities', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })
      const data = await universitiesResponse.json()
      if (data.success) {
        setUniversities(data.universities)
      }
    } catch (error) {
       console.error(error)
    }
  }, [currentUserData?.role])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      
      // Always fetch fresh data - no caching
      const ordersResponse = await fetch(`/api/admin/orders?university=${selectedUniversity}&status=${selectedTab}&page=1&limit=100`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })
      const data = await ordersResponse.json()
      setOrders(data)
    } catch (error) {
       console.error(error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch orders. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }, [selectedUniversity, selectedTab])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    // Clear cache and force fresh data
    await fetchOrders()
    await fetchCurrentUser()
    await fetchUniversities()
    setRefreshing(false)
  }, [fetchOrders, fetchCurrentUser, fetchUniversities])

  // useEffect to fetch data when session is available - optimized
  useEffect(() => {
    // Only run when session is first available and we haven't fetched yet
    if (session?.user?.id && !currentUserData) {
      fetchCurrentUser()
      fetchOrders()
      fetchUniversities()
    }
  }, [session?.user?.id]) // Only depend on user ID, not entire session object

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
        // cache.delete('admin_orders') // Removed cache
        
        const statusMessages = {
          'APPROVED': 'Order approved - ready for kitchen preparation',
          'PREPARING': 'Order is now being prepared by the kitchen',
          'READY': 'Order is ready for student collection',
          'SERVED': 'Order has been served successfully',
          'REJECTED': 'Order rejected',
          'CANCELLED': 'Order cancelled'
        }

        showToast({
          type: ['REJECTED', 'CANCELLED'].includes(newStatus) ? 'error' : 'success',
          title: ['REJECTED', 'CANCELLED'].includes(newStatus) ? 'Order Rejected' : 'Status Updated',
          message: statusMessages[newStatus as keyof typeof statusMessages] || 'Order status updated'
        })
      } else {
        throw new Error('Failed to update order')
      }
    } catch (error) {
      console.error(error)
      showToast({
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
      case 'REJECTED':
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Filter tabs with counts
  const filterTabs = [
    { key: 'PENDING' as FilterStatus, label: 'Pending', color: 'orange', count: orders.filter(o => o.status === 'PENDING').length },
    { key: 'APPROVED' as FilterStatus, label: 'Approved', color: 'blue', count: orders.filter(o => o.status === 'APPROVED').length },
    { key: 'PREPARING' as FilterStatus, label: 'Preparing', color: 'purple', count: orders.filter(o => o.status === 'PREPARING').length },
    { key: 'READY' as FilterStatus, label: 'Ready', color: 'green', count: orders.filter(o => o.status === 'READY').length },
    { key: 'SERVED' as FilterStatus, label: 'Served', color: 'emerald', count: orders.filter(o => o.status === 'SERVED').length },
    { key: 'all' as FilterStatus, label: 'All Orders', color: 'gray', count: orders.length }
  ]

  // Action buttons component for reuse
  const ActionButtons = ({ order }: { order: Order }) => (
    <div className="flex items-center space-x-2">
      {order.status === 'PENDING' && (
        <>
          <button
            onClick={() => approveOrder(order.id)}
            className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 transition-colors flex items-center"
          >
            <Check className="w-3 h-3 mr-1" />
            Approve
          </button>
          <button
            onClick={() => rejectOrder(order.id)}
            className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700 transition-colors flex items-center"
          >
            <X className="w-3 h-3 mr-1" />
            Reject
          </button>
        </>
      )}
      
      {order.status === 'APPROVED' && (
        <button
          onClick={() => startPreparing(order.id)}
          className="bg-purple-600 text-white text-xs px-2 py-1 rounded hover:bg-purple-700 transition-colors flex items-center"
        >
          <ChefHat className="w-3 h-3 mr-1" />
          Start Preparing
        </button>
      )}

      {order.status === 'PREPARING' && (
        <button
          onClick={() => markReady(order.id)}
          className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 transition-colors flex items-center"
        >
          <Package className="w-3 h-3 mr-1" />
          Mark Ready
        </button>
      )}

      {order.status === 'READY' && (
        <button
          onClick={() => markServed(order.id)}
          className="bg-emerald-600 text-white text-xs px-2 py-1 rounded hover:bg-emerald-700 transition-colors flex items-center"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Mark Served
        </button>
      )}

      <button
        onClick={() => {
          window.open(`/admin/orders/${order.id}`, '_blank')
        }}
        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center"
      >
        <Eye className="w-3 h-3 mr-1" />
        View
      </button>

      {!['SERVED', 'REJECTED', 'CANCELLED'].includes(order.status) && (
        <button
          onClick={() => cancelOrder(order.id)}
          className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded hover:bg-red-200 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationSystem />

      <MobileHeader 
        title="Order Management" 
        showNotifications={true}
        rightElement={
          <div className="flex items-center space-x-2">
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

          {/* Search and Filters */}
          <div className="space-y-4">
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

            {/* University Filter for Super Admin */}
            {currentUserData?.role === 'ADMIN' && universities.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowUniversityDropdown(!showUniversityDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {selectedUniversity === 'all' 
                        ? 'All Universities' 
                        : universities.find(u => u.id === selectedUniversity)?.name || 'Select University'
                      }
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {showUniversityDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedUniversity('all')
                            setShowUniversityDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            selectedUniversity === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          All Universities ({orders.length} orders)
                        </button>
                        {universities.map((university) => (
                          <button
                            key={university.id}
                            onClick={() => {
                              setSelectedUniversity(university.id)
                              setShowUniversityDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              selectedUniversity === university.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{university.name} ({university.code})</span>
                              <span className="text-xs text-gray-500">
                                {orders.filter(o => o.university?.id === university.id).length}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="hidden lg:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">View:</span>
                  <div className="flex border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 text-xs rounded-l-lg ${
                        viewMode === 'list' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1 text-xs rounded-r-lg ${
                        viewMode === 'cards' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cards
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Status Filter Tabs */}
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

          {/* Orders Display */}
          {loading ? (
            <div className="animate-pulse">
              {/* Loading for list view */}
              <div className="hidden lg:block">
                <div className="bg-white rounded-lg border">
                  <div className="h-12 bg-gray-200 rounded-t-lg"></div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="border-t p-4">
                      <div className="grid grid-cols-8 gap-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Loading for card view */}
              <div className="lg:hidden grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg p-6 border">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
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
            <>
              {/* Desktop List View */}
              <div className={`hidden lg:block ${viewMode === 'list' ? '' : 'lg:hidden'}`}>
                <div className="bg-white rounded-lg border overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-700">
                      <div>Order #</div>
                      <div>Student</div>
                      <div>Items</div>
                      {currentUserData?.role === 'ADMIN' && <div>University</div>}
                      <div className={currentUserData?.role === 'ADMIN' ? 'col-start-5' : ''}>Status</div>
                      <div>Amount</div>
                      <div>Date</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="grid grid-cols-8 gap-4 items-center text-sm">
                          {/* Order Number */}
                          <div className="font-medium text-gray-900">
                            #{order.orderNumber}
                          </div>
                          
                          {/* Student Info */}
                          <div>
                            <div className="font-medium text-gray-900 truncate">{order.user.name}</div>
                            <div className="text-gray-500 truncate">{order.user.email}</div>
                            {order.user.studentId && (
                              <div className="text-xs text-gray-400">ID: {order.user.studentId}</div>
                            )}
                          </div>
                          
                          {/* Order Items */}
                          <div>
                            <div className="text-gray-900">
                              {order.orderItems.slice(0, 2).map((item, index) => (
                                <span key={item.id}>
                                  {item.quantity}x {item.menuItem.name}
                                  {index < order.orderItems.slice(0, 2).length - 1 && ', '}
                                </span>
                              ))}
                              {order.orderItems.length > 2 && (
                                <span className="text-gray-500"> +{order.orderItems.length - 2} more</span>
                              )}
                            </div>
                          </div>
                          
                          {/* University (Super Admin only) */}
                          {currentUserData?.role === 'ADMIN' && (
                            <div className="text-gray-600">
                              {order.university ? (
                                <span className="inline-flex items-center">
                                  <Building className="w-3 h-3 mr-1" />
                                  {order.university.code}
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </div>
                          )}
                          
                          {/* Status */}
                          <div className={currentUserData?.role === 'ADMIN' ? 'col-start-5' : ''}>
                            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span>{order.status}</span>
                            </div>
                          </div>
                          
                          {/* Amount */}
                          <div className="font-medium text-gray-900">
                            <div className="flex items-center">
                              <IndianRupee className="w-3 h-3 mr-1" />
                              ₹{order.totalAmount.toFixed(2)}
                            </div>
                          </div>
                          
                          {/* Date */}
                          <div className="text-gray-600">
                            <div>{format(new Date(order.orderDate), 'MMM dd')}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(order.createdAt), 'h:mm a')}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div>
                            <ActionButtons order={order} />
                          </div>
                        </div>
                        
                        {/* Delivery Instructions */}
                        {order.deliveryInstructions && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-sm">
                              <span className="font-medium text-blue-800">Instructions:</span>
                              <span className="text-blue-700 ml-2">{order.deliveryInstructions}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Status Progress for non-completed orders */}
                        {!['REJECTED', 'CANCELLED', 'SERVED'].includes(order.status) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Card View & Desktop Card View (when selected) */}
              <div className={`lg:${viewMode === 'cards' ? 'block' : 'hidden'} lg:grid-cols-2 xl:grid-cols-3 gap-6 grid grid-cols-1`}>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
} 