'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { AlertTriangle, Bell, Check, CheckCircle, Info, Package, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'order'
  title: string
  message: string
  timestamp: Date
  read: boolean
  orderId?: string
  orderNumber?: string
  action?: () => void
  autoHide?: boolean
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      autoHide: notification.autoHide ?? true,
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-hide notification
    if (newNotification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, newNotification.duration)
    }

    // Browser notification for order updates
    if (notification.type === 'order' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      removeNotification,
      clearAll,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Real-time notification polling hook
export function useRealTimeNotifications(userId: string | undefined) {
  const { addNotification } = useNotifications()
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  useEffect(() => {
    if (!userId) return

    const pollNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?since=${lastCheck.toISOString()}`)
        if (response.ok) {
          const { notifications } = await response.json()
          
          notifications.forEach((notification: any) => {
            addNotification({
              type: notification.type || 'info',
              title: notification.title,
              message: notification.message,
              orderId: notification.orderId,
              orderNumber: notification.orderNumber,
              autoHide: notification.type !== 'order' // Keep order notifications visible
            })
          })
          
          setLastCheck(new Date())
        }
          } catch (error) {
      // Handle error silently
    }
    }

    // Poll every 30 seconds
    const interval = setInterval(pollNotifications, 30000)
    
    // Initial poll
    pollNotifications()

    return () => clearInterval(interval)
  }, [userId, lastCheck, addNotification])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
}

// Order status notification helper
export function createOrderNotification(
  type: 'approved' | 'preparing' | 'ready' | 'served' | 'rejected',
  orderNumber: string,
  orderId: string
): Omit<Notification, 'id' | 'timestamp' | 'read'> {
  switch (type) {
    case 'approved':
      return {
        type: 'order',
        title: '✅ Order Approved',
        message: `Your order #${orderNumber} has been approved and will be prepared soon.`,
        orderId,
        orderNumber,
        autoHide: false
      }
    case 'preparing':
      return {
        type: 'order',
        title: '👨‍🍳 Order Being Prepared',
        message: `Your order #${orderNumber} is now being prepared in the kitchen.`,
        orderId,
        orderNumber,
        autoHide: false
      }
    case 'ready':
      return {
        type: 'order',
        title: '🎉 Order Ready for Pickup',
        message: `Your order #${orderNumber} is ready! Please come to the pickup counter.`,
        orderId,
        orderNumber,
        autoHide: false
      }
    case 'served':
      return {
        type: 'success',
        title: '📦 Order Completed',
        message: `Your order #${orderNumber} has been served. Thank you!`,
        orderId,
        orderNumber
      }
    case 'rejected':
      return {
        type: 'error',
        title: '❌ Order Rejected',
        message: `Your order #${orderNumber} has been rejected. Please contact support for details.`,
        orderId,
        orderNumber,
        autoHide: false
      }
  }
}

export default function NotificationSystem() {
  const { notifications, removeNotification, markAsRead } = useNotifications()
  const [showAll, setShowAll] = useState(false)

  const visibleNotifications = showAll ? notifications : notifications.slice(0, 3)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />
      case 'error': return <AlertTriangle className="text-red-500" size={20} />
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />
      case 'order': return <Package className="text-blue-500" size={20} />
      default: return <Info className="text-blue-500" size={20} />
    }
  }

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'order': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-sm">
      <div className="space-y-2">
        {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
            className={`p-4 rounded-lg border shadow-lg transition-all duration-300 transform hover:scale-105 ${getNotificationBg(notification.type)} ${
              !notification.read ? 'ring-2 ring-blue-300' : ''
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.type)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {notification.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
            </div>
                
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {notification.message}
                </p>
                
                {notification.orderNumber && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Order #{notification.orderNumber}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </p>
              </div>
            </div>

            {notification.action && (
            <button
                onClick={(e) => {
                  e.stopPropagation()
                  notification.action?.()
                }}
                className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                View Order
            </button>
            )}
          </div>
        ))}

        {notifications.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {showAll ? 'Show Less' : `Show ${notifications.length - 3} More`}
          </button>
        )}
        </div>
    </div>
  )
}

// Notification Bell Component for Header
export function NotificationBell() {
  const { unreadCount } = useNotifications()
  const [showPanel, setShowPanel] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">{unreadCount} unread</p>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            <NotificationSystem />
          </div>
        </div>
      )}
    </div>
  )
} 