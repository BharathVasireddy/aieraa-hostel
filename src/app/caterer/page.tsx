'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { QrCode, Package, CheckCircle, Clock, User, IndianRupee, Search, Filter, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import { lightningFetch, lightningCache } from '@/lib/cache'

interface OrderForServing {
  id: string
  orderNumber: string
  customerName: string
  studentId: string | null
  items: Array<{
    name: string
    quantity: number
    variant?: string
  }>
  totalAmount: number
  status: string
  orderDate: string
  createdAt: string
  qrCode?: string
}

interface DashboardStats {
  pendingOrders: number
  readyOrders: number
  servedToday: number
  totalToday: number
}

export default function CatererDashboard() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<OrderForServing[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderForServing[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    readyOrders: 0,
    servedToday: 0,
    totalToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'PREPARING' | 'READY'>('all')
  const [isScanning, setIsScanning] = useState(false)
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchOrders, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Check instant cache first
      const cacheKey = 'caterer_serving_orders'
      const cachedData = lightningCache.getInstant<{orders: OrderForServing[], stats: DashboardStats}>(cacheKey)
      if (cachedData) {
        console.log('⚡ INSTANT serving orders from cache')
        setOrders(cachedData.orders)
        setStats(cachedData.stats)
        setLoading(false)
        return
      }

      // Fetch fresh data
      const [ordersData, statsData] = await Promise.all([
        lightningFetch('/api/caterer/orders', {}, 2), // 2 min cache for orders
        lightningFetch('/api/caterer/stats', {}, 5)   // 5 min cache for stats
      ])

      setOrders(ordersData)
      setStats(statsData)
      
      // Store in instant cache
      lightningCache.setInstant(cacheKey, {
        orders: ordersData,
        stats: statsData
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch orders'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Filter by search query (order number, customer name, or student ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.studentId?.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const markAsServed = async (orderId: string) => {
    try {
      // Update local state immediately for instant feedback
      setOrders(orders =>
        orders.map(order =>
          order.id === orderId ? { ...order, status: 'SERVED' } : order
        )
      )

      const response = await fetch(`/api/caterer/orders/${orderId}/serve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to mark order as served')
      }

      // Clear cache to force fresh data
      lightningCache.delete('caterer_serving_orders')

      addNotification({
        type: 'success',
        title: 'Order Served',
        message: 'Order marked as served successfully'
      })

      // Refresh stats
      fetchOrders()
    } catch (error) {
      console.error('Error marking order as served:', error)
      // Revert local state on error
      setOrders(orders =>
        orders.map(order =>
          order.id === orderId ? { ...order, status: 'READY' } : order
        )
      )
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to mark order as served'
      })
    }
  }

  const startQRScan = () => {
    setIsScanning(true)
    // TODO: Implement QR code scanning functionality
    // For now, just show a placeholder
    setTimeout(() => {
      setIsScanning(false)
      addNotification({
        type: 'info',
        title: 'QR Scanner',
        message: 'QR code scanning will be implemented soon'
      })
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'APPROVED': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'PREPARING': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'READY': return 'text-green-600 bg-green-50 border-green-200'
      case 'SERVED': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <Package className="w-4 h-4" />
      case 'PREPARING': return <Package className="w-4 h-4" />
      case 'READY': return <CheckCircle className="w-4 h-4" />
      case 'SERVED': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Food Counter" showNotifications={true} />
        <div className="px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
              ))}
            </div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
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
        title="Food Counter" 
        showNotifications={true}
        rightElement={
          <button
            onClick={fetchOrders}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* QR Scanner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Scan to Serve</h1>
              <p className="text-blue-100 mt-1">Scan student QR codes to mark orders as served</p>
            </div>
            <button
              onClick={startQRScan}
              disabled={isScanning}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <QrCode className="w-8 h-8" />
            </button>
          </div>
          {isScanning && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <p className="mt-2 text-sm">Scanning...</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-green-600">{stats.readyOrders}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Served Today</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.servedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalToday}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, name, or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            {['all', 'PENDING', 'APPROVED', 'PREPARING', 'READY'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Orders' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Orders for Serving</h2>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No orders are currently pending for serving'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        {order.studentId && (
                          <p className="text-xs text-gray-500">ID: {order.studentId}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 flex items-center">
                        <IndianRupee className="w-3 h-3 mr-0.5" />
                        {order.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Items:</p>
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, index) => (
                        <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => markAsServed(order.id)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as Served</span>
                    </button>
                  )}
                  
                  {order.status === 'SERVED' && (
                    <div className="w-full bg-emerald-100 text-emerald-800 py-2 px-4 rounded-lg text-center font-medium">
                      ✓ Order Served
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