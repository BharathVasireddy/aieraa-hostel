'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { QrCode, Package, CheckCircle, RefreshCw, User, Home, Clock, Utensils } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scannedOrder, setScannedOrder] = useState<OrderForServing | null>(null)
  const [showScannedModal, setShowScannedModal] = useState(false)
  const [isServing, setIsServing] = useState(false)
  const [todayStats, setTodayStats] = useState({
    pendingOrders: 0,
    readyOrders: 0,
    servedToday: 0,
    totalToday: 0
  })
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    if (session?.user) {
      fetchStats()
      fetchReadyOrders()
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchStats()
        fetchReadyOrders()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/caterer/stats')
      if (response.ok) {
        const stats = await response.json()
        setTodayStats(stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchReadyOrders = async () => {
    try {
      setLoading(true)
      
      // Only fetch READY orders for serving
      const response = await fetch('/api/caterer/orders?status=READY')
      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Error fetching ready orders:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch ready orders'
      })
    } finally {
      setLoading(false)
    }
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

      addNotification({
        type: 'success',
        title: 'Order Served ✅',
        message: `Order #${scannedOrder?.orderNumber} has been marked as served successfully!`
      })

      // Refresh data
      fetchStats()
      fetchReadyOrders()
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
            onClick={() => {
              fetchStats()
              fetchReadyOrders()
            }}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{todayStats.readyOrders}</div>
            <div className="text-sm text-blue-700">Ready to Serve</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{todayStats.servedToday}</div>
            <div className="text-sm text-green-700">Served Today</div>
          </div>
        </div>

        {/* QR Scanner Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <div className="text-center">
            <QrCode className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-3">Scan QR Code</h1>
            <p className="text-blue-100 mb-6 text-lg">
              Ask students to show their QR code to serve their orders
            </p>
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              🎯 Start Scanning
            </button>
          </div>
        </div>

        {/* Simple Order Info */}
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Orders Ready for Pickup</h2>
            <p className="text-sm text-gray-600 mt-1">
              {orders.length} orders waiting to be served
            </p>
          </div>
          
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders ready for pickup</p>
              <p className="text-sm text-gray-500 mt-1">
                Use the QR scanner when students arrive
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-center py-8">
                <Utensils className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {orders.length} Orders Ready
                </h3>
                <p className="text-gray-600 mb-4">
                  Students will show their QR codes for pickup
                </p>
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Scan QR Code
                </button>
              </div>
              
              {/* Simple order list */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <span className="font-medium">#{order.orderNumber}</span>
                      <span className="text-sm text-gray-600 ml-2">{order.customerName}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(order.createdAt), 'h:mm a')}
                    </span>
                  </div>
                ))}
                {orders.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{orders.length - 5} more orders
                  </p>
                )}
              </div>
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