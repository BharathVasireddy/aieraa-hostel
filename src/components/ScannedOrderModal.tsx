'use client'

import { CheckCircle, Package, X, User, Clock, Home } from 'lucide-react'
import { format } from 'date-fns'

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

interface ScannedOrderModalProps {
  order: OrderForServing | null
  isOpen: boolean
  onClose: () => void
  onServe: (orderId: string) => Promise<void>
  isServing: boolean
}

export default function ScannedOrderModal({ 
  order, 
  isOpen, 
  onClose, 
  onServe, 
  isServing 
}: ScannedOrderModalProps) {
  if (!isOpen || !order) return null

  const handleServe = async () => {
    await onServe(order.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order Ready to Serve</h3>
              <p className="text-sm text-gray-600">#{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Student Details</span>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">{order.customerName}</p>
              {order.studentId && (
                <p className="text-sm text-gray-600">Student ID: {order.studentId}</p>
              )}
              {order.roomNumber && (
                <div className="flex items-center space-x-1">
                  <Home className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-gray-600">Room: {order.roomNumber}</p>
                </div>
              )}
              <p className="text-sm text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Ordered: {format(new Date(order.createdAt), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Items to Serve */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Items to Serve:</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.variant && (
                      <p className="text-sm text-gray-600">{item.variant}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">x{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Instructions:</strong> Please prepare and serve all items listed above to the student. 
              Click &quot;Mark as Served&quot; only after handing over the complete order.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleServe}
              disabled={isServing}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isServing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Serving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Served</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 