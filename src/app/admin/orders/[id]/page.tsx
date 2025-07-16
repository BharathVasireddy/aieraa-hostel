'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, CheckCircle, Clock, IndianRupee, MapPin, Package, Phone, QrCode, Scan, User, XCircle } from 'lucide-react'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRScanner from '@/components/QRScanner'
import { cachedFetch } from '@/lib/cache'

interface OrderDetails {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    hostelRoom?: string
  }
  orderItems: {
    id: string
    quantity: number
    price: number
    menuItem: {
      name: string
      description: string
      isVegetarian: boolean
    }
  }[]
}

export default function OrderDetailsPage() {
  const params = useParams()
    useSession()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const orderId = params['id'] as string

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await cachedFetch(`/api/admin/orders/${orderId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
    console.error(error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId, fetchOrderDetails])

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const response = await cachedFetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchOrderDetails() // Refresh order data
      }
    } catch (error) {
    console.error(error)
    }
  }

  const handleQRScanSuccess = async (qrData: any) => {
    try {
      setVerifying(true)
      
      const response = await cachedFetch(`/api/admin/orders/${orderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          qrData: JSON.stringify(qrData),
          pickupNotes: 'Verified via QR scan'
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Order pickup verified successfully!\n\nOrder: ${result.order.orderNumber}\nStudent: ${result.order.studentName}`)
        await fetchOrderDetails()
        setShowQRScanner(false)
      } else {
        const error = await response.json()
        alert(`❌ Verification failed: ${error.error}\n${error.details || ''}`)
      }
    } catch (error) {
    console.error(error)
      alert('❌ Failed to verify order pickup')
    } finally {
      setVerifying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'APPROVED': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'PREPARING': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'READY': return 'text-green-600 bg-green-50 border-green-200'
      case 'SERVED': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'REJECTED':
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />
      case 'APPROVED': 
      case 'SERVED': return <CheckCircle size={16} />
      case 'PREPARING': return <Package size={16} />
      case 'READY': return <Package size={16} />
      case 'REJECTED':
      case 'CANCELLED': return <XCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This order could not be loaded'}</p>
          <button
            onClick={() => router.back()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Order Status & Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                {order.status}
              </div>
            </div>
            
            {/* QR Actions */}
            <div className="flex gap-2">
              {(order.status === 'READY' || order.status === 'APPROVED') && (
                <>
                  <button
                    onClick={() => setShowQRGenerator(!showQRGenerator)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <QrCode size={16} />
                    Generate QR
                  </button>
                  
                  <button
                    onClick={() => setShowQRScanner(!showQRScanner)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Scan size={16} />
                    Scan QR
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex flex-wrap gap-2">
            {order.status === 'PENDING' && (
              <>
                <button
                  onClick={() => updateOrderStatus('APPROVED')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Approve Order
                </button>
                <button
                  onClick={() => updateOrderStatus('REJECTED')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Reject Order
                </button>
              </>
            )}
            
            {order.status === 'APPROVED' && (
              <button
                onClick={() => updateOrderStatus('PREPARING')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Start Preparing
              </button>
            )}
            
            {order.status === 'PREPARING' && (
              <button
                onClick={() => updateOrderStatus('READY')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Mark Ready
              </button>
            )}
            
            {order.status === 'READY' && (
              <button
                onClick={() => updateOrderStatus('SERVED')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Mark Served
              </button>
            )}
          </div>
        </div>

        {/* QR Code Generator */}
        {showQRGenerator && (order.status === 'READY' || order.status === 'APPROVED') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Pickup QR Code</h3>
            <QRCodeGenerator
              orderId={order.id}
              orderNumber={order.orderNumber}
              studentName={order.user.name}
              pickupLocation="Main Hostel Counter"
              size={200}
            />
          </div>
        )}

        {/* QR Scanner */}
        {showQRScanner && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Order QR Code</h3>
            <QRScanner
              onScanSuccess={handleQRScanSuccess}
              onScanError={(error) => alert(`Scan Error: ${error}`)}
            />
            {verifying && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                <p className="text-blue-600 text-sm">Verifying order pickup...</p>
              </div>
            )}
          </div>
        )}

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="text-gray-400" size={20} />
              <div>
                <p className="font-medium text-gray-900">{order.user.name}</p>
                <p className="text-sm text-gray-600">{order.user.email}</p>
              </div>
            </div>
            
            {order.user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-gray-400" size={20} />
                <div>
                  <p className="font-medium text-gray-900">{order.user.phone}</p>
                  <p className="text-sm text-gray-600">Phone</p>
                </div>
              </div>
            )}
            
            {order.user.hostelRoom && (
              <div className="flex items-center gap-3">
                <MapPin className="text-gray-400" size={20} />
                <div>
                  <p className="font-medium text-gray-900">{order.user.hostelRoom}</p>
                  <p className="text-sm text-gray-600">Hostel Room</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                    {item.menuItem.isVegetarian && (
                      <span className="w-3 h-3 bg-green-500 rounded-full border border-green-600"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{item.menuItem.description}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 flex items-center">
                    <IndianRupee size={16} />
                    {item.price}
                  </p>
                  <p className="text-sm text-gray-500">
                    <IndianRupee size={12} />
                    {(item.price / item.quantity).toFixed(2)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Total */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-xl font-bold text-gray-900 flex items-center">
                <IndianRupee size={20} />
                {order.totalAmount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 