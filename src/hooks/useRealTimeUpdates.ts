import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface RealTimeUpdate {
  type: 'connected' | 'heartbeat' | 'initial_data' | 'status_change' | 'new_order' | 'payment_update' | 'item_toggle'
  timestamp: number
  [key: string]: any
}

interface UseRealTimeUpdatesProps {
  onOrderUpdate?: (update: RealTimeUpdate) => void
  onMenuUpdate?: (update: RealTimeUpdate) => void
  onConnectionChange?: (connected: boolean) => void
  enabled?: boolean
}

export function useRealTimeUpdates({
  onOrderUpdate,
  onMenuUpdate,
  onConnectionChange,
  enabled = true
}: UseRealTimeUpdatesProps = {}) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealTimeUpdate | null>(null)
  const [connectionStats, setConnectionStats] = useState({
    reconnectAttempts: 0,
    lastConnected: null as Date | null,
    totalUpdatesReceived: 0
  })
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxReconnectAttempts = 5
  const reconnectDelay = 2000 // Start with 2 seconds

  const connect = useCallback(() => {
    if (!session?.user?.id || !enabled) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource('/api/realtime/orders')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('🔗 Real-time connection established')
        setIsConnected(true)
        setConnectionStats(prev => ({
          ...prev,
          reconnectAttempts: 0,
          lastConnected: new Date()
        }))
        onConnectionChange?.(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data)
          
          setLastUpdate(update)
          setConnectionStats(prev => ({
            ...prev,
            totalUpdatesReceived: prev.totalUpdatesReceived + 1
          }))

          // Route updates to appropriate handlers
          switch (update.type) {
            case 'connected':
              console.log('✅ Real-time updates connected:', update.message)
              break
              
            case 'heartbeat':
              // Silent heartbeat to keep connection alive
              break
              
            case 'initial_data':
              console.log('📊 Initial data received:', update)
              onOrderUpdate?.(update)
              break
              
            case 'status_change':
            case 'new_order':
            case 'payment_update':
              console.log('📦 Order update:', update.type, update.orderId)
              onOrderUpdate?.(update)
              break
              
            case 'item_toggle':
            case 'price_change':
            case 'availability_change':
              console.log('🍽️ Menu update:', update.type, update.menuItemId)
              onMenuUpdate?.(update)
              break
              
            default:
              console.log('📨 Unknown update type:', update.type)
          }
        } catch (error) {
          console.error('Error parsing real-time update:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.warn('🔄 Real-time connection error, attempting reconnect...')
        setIsConnected(false)
        onConnectionChange?.(false)
        
        eventSource.close()
        
        // Exponential backoff for reconnection
        if (connectionStats.reconnectAttempts < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, connectionStats.reconnectAttempts)
          
          setConnectionStats(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
          }))
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Reconnecting... (attempt ${connectionStats.reconnectAttempts + 1})`)
            connect()
          }, delay)
        } else {
          console.error('❌ Max reconnection attempts reached')
        }
      }

    } catch (error) {
      console.error('Failed to establish real-time connection:', error)
      setIsConnected(false)
      onConnectionChange?.(false)
    }
  }, [session?.user?.id, enabled, onOrderUpdate, onMenuUpdate, onConnectionChange, connectionStats.reconnectAttempts])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    onConnectionChange?.(false)
  }, [onConnectionChange])

  const forceReconnect = useCallback(() => {
    setConnectionStats(prev => ({ ...prev, reconnectAttempts: 0 }))
    disconnect()
    setTimeout(connect, 1000)
  }, [connect, disconnect])

  // Auto-connect when session is available and enabled
  useEffect(() => {
    if (session?.user?.id && enabled) {
      connect()
    } else {
      disconnect()
    }

    return disconnect
  }, [session?.user?.id, enabled, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Auto-reconnect on page visibility change (when user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user?.id && enabled && !isConnected) {
        console.log('🔄 Page became visible, reconnecting...')
        forceReconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session?.user?.id, enabled, isConnected, forceReconnect])

  return {
    isConnected,
    lastUpdate,
    connectionStats,
    forceReconnect,
    disconnect
  }
}

// Specialized hook for order updates
export function useRealTimeOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [pendingUpdates, setPendingUpdates] = useState<RealTimeUpdate[]>([])

  const handleOrderUpdate = useCallback((update: RealTimeUpdate) => {
    switch (update.type) {
      case 'initial_data':
        if (update.activeOrders) {
          setOrders(update.activeOrders)
        } else if (update.pendingOrders) {
          setOrders(update.pendingOrders)
        }
        break
        
      case 'status_change':
        setOrders(prev => prev.map(order => 
          order.id === update.orderId 
            ? { ...order, ...update.orderData }
            : order
        ))
        setPendingUpdates(prev => [...prev, update])
        break
        
      case 'new_order':
        setOrders(prev => [update.orderData, ...prev])
        setPendingUpdates(prev => [...prev, update])
        break
        
      case 'payment_update':
        setOrders(prev => prev.map(order => 
          order.id === update.orderId 
            ? { ...order, paymentStatus: update.orderData.paymentStatus }
            : order
        ))
        break
    }
  }, [])

  const realTime = useRealTimeUpdates({
    onOrderUpdate: handleOrderUpdate
  })

  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates([])
  }, [])

  return {
    ...realTime,
    orders,
    pendingUpdates,
    clearPendingUpdates,
    hasNewUpdates: pendingUpdates.length > 0
  }
}

// Specialized hook for menu updates
export function useRealTimeMenu() {
  const [menuUpdates, setMenuUpdates] = useState<RealTimeUpdate[]>([])

  const handleMenuUpdate = useCallback((update: RealTimeUpdate) => {
    setMenuUpdates(prev => [update, ...prev.slice(0, 10)]) // Keep last 10 updates
    
    // You can trigger UI updates here for specific menu changes
    switch (update.type) {
      case 'item_toggle':
        console.log(`Menu item ${update.menuItemId} toggled:`, update.updateData)
        break
      case 'price_change':
        console.log(`Price changed for ${update.menuItemId}:`, update.updateData)
        break
      case 'availability_change':
        console.log(`Availability changed for ${update.menuItemId}:`, update.updateData)
        break
    }
  }, [])

  const realTime = useRealTimeUpdates({
    onMenuUpdate: handleMenuUpdate
  })

  const clearMenuUpdates = useCallback(() => {
    setMenuUpdates([])
  }, [])

  return {
    ...realTime,
    menuUpdates,
    clearMenuUpdates,
    hasMenuUpdates: menuUpdates.length > 0
  }
} 