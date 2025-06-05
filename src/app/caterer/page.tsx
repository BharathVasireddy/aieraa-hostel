'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { QrCode, Package, CheckCircle, Search, RefreshCw, User, Home } from 'lucide-react'
import { format } from 'date-fns'
import MobileHeader from '@/components/MobileHeader'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import QRScanner from '@/components/QRScanner'
import ScannedOrderModal from '@/components/ScannedOrderModal'
import { lightningFetch, lightningCache } from '@/lib/cache'

interface OrderForServing {
  id: string
  orderNumber: string
  customerName: string
  studentId: string | null
  roomNumber?: string
  items: Array<{
    name: string
    quantity: number
    variant?: string
  }>
  totalAmount: number
  status: string
  orderDate: string
  createdAt: string
}

export default function CatererDashboard() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<OrderForServing[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderForServing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scannedOrder, setScannedOrder] = useState<OrderForServing | null>(null)
  const [showScannedModal, setShowScannedModal] = useState(false)
  const [isServing, setIsServing] = useState(false)
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
  }, [orders, searchQuery])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Check instant cache first
      const cacheKey = 'caterer_serving_orders'
      const cachedData = lightningCache.getInstant<{orders: OrderForServing[]}>(cacheKey)
      if (cachedData) {
        console.log('⚡ INSTANT serving orders from cache')
        setOrders(cachedData.orders)
        setLoading(false)
        return
      }

      // Fetch fresh data - only today's orders that need serving
      const ordersData = await lightningFetch('/api/caterer/orders', {}, 2)

      setOrders(ordersData)
      
      // Store in instant cache
      lightningCache.setInstant(cacheKey, {
        orders: ordersData
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

    // Only show today's orders that need serving (READY status)
    const today = new Date().toDateString()
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.createdAt).toDateString()
      return orderDate === today && order.status === 'READY'
    })

    setFilteredOrders(filtered)
  }

  const handleQRScan = (qrData: string) => {
    try {
      // Parse QR code data (should contain order information)
      const orderData = JSON.parse(qrData)
      
      // Find the order by ID or order number
      const order = orders.find(o => 
        o.id === orderData.orderId || 
        o.orderNumber === orderData.orderNumber
      )

      if (!order) {
        addNotification({
          type: 'error',
          title: 'Order Not Found',
          message: 'The scanned QR code does not match any pending orders.'
        })
        return
      }

      if (order.status !== 'READY') {
        addNotification({
          type: 'error',
          title: 'Order Not Ready',
          message: `Order status is ${order.status}. Only READY orders can be served.`
        })
        return
      }

      // Show the order details for serving
      setScannedOrder(order)
      setShowScannedModal(true)
      setShowQRScanner(false)

    } catch (error) {
      console.error('Error parsing QR code:', error)
      addNotification({
        type: 'error',
        title: 'Invalid QR Code',
        message: 'The scanned QR code is not valid or corrupted.'
      })
    }
  }

  const markAsServed = async (orderId: string) => {
    try {
      setIsServing(true)

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
        title: 'Order Served ✅',
        message: `Order #${scannedOrder?.orderNumber} has been marked as served successfully!`
      })

      // Refresh orders
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
    } finally {
      setIsServing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Food Counter" />
        <div className="px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-32 rounded-lg"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      <MobileHeader 
        title="Food Counter" 
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
        {/* QR Scanner Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-center">
            <QrCode className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Scan QR Code</h1>
            <p className="text-blue-100 mb-4">Scan student QR codes to serve orders</p>
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Start Scanning
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, student name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Orders to Serve</h2>
            <p className="text-sm text-gray-600 mt-1">
              Ready orders for pickup - use QR scanner above
            </p>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders ready for pickup</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery 
                  ? 'Try adjusting your search' 
                  : 'No orders are currently ready for serving'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      READY
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">{order.customerName}</p>
                        {order.studentId && (
                          <p className="text-sm text-blue-700">Student ID: {order.studentId}</p>
                        )}
                        {order.roomNumber && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Home className="w-4 h-4 text-blue-600" />
                            <p className="text-sm text-blue-700">Room: {order.roomNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items to Serve */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Items to serve:</p>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.variant && (
                              <p className="text-sm text-gray-600">{item.variant}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">x{item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* QR Instructions */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center space-x-2 text-green-800">
                      <QrCode className="w-4 h-4" />
                      <span className="text-sm font-medium">Ask customer to show QR code</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Use the scanner above to confirm pickup
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />

      {/* Scanned Order Modal */}
      <ScannedOrderModal
        order={scannedOrder}
        isOpen={showScannedModal}
        onClose={() => {
          setShowScannedModal(false)
          setScannedOrder(null)
        }}
        onServe={markAsServed}
        isServing={isServing}
      />
    </div>
  )
} 