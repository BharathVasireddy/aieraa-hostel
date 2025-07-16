'use client'

import { useEffect, useRef, useState } from 'react'

interface OrderUpdate {
  orderId: string
  status: string
  message: string
  timestamp: string
}

interface ConnectionStats {
  connected: boolean
  lastPing: number
  reconnectAttempts: number
  totalReconnects: number
}

interface UseRealTimeUpdatesProps {
  userId?: string
  onOrderUpdate?: (update: OrderUpdate) => void
  onConnectionChange?: (connected: boolean) => void
  enableReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
}

export function useRealTimeUpdates({
  userId,
  onOrderUpdate,
  onConnectionChange,
  enableReconnect = true,
  maxReconnectAttempts = 5,
  reconnectInterval = 3000
}: UseRealTimeUpdatesProps = {}) {
  const [updates, setUpdates] = useState<OrderUpdate[]>([])
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    connected: false,
    lastPing: 0,
    reconnectAttempts: 0,
    totalReconnects: 0
  })
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)
  const shouldReconnectRef = useRef(true)

  // Create WebSocket connection
  const connect = () => {
    if (isConnectingRef.current || !shouldReconnectRef.current) return
    
    isConnectingRef.current = true
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/realtime/orders`
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        isConnectingRef.current = false
        setConnectionStats(prev => ({
          ...prev,
          connected: true,
          lastPing: Date.now(),
          reconnectAttempts: 0
        }))
        
        onConnectionChange?.(true)
        
        // Send initial auth message
        if (userId && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            userId: userId
          }))
        }
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'ping') {
            setConnectionStats(prev => ({
              ...prev,
              lastPing: Date.now()
            }))
            // Send pong response
            wsRef.current?.send(JSON.stringify({ type: 'pong' }))
          } else if (data.type === 'order_update') {
            const update: OrderUpdate = {
              orderId: data.orderId,
              status: data.status,
              message: data.message,
              timestamp: data.timestamp
            }
            
            setUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates
            onOrderUpdate?.(update)
          } else if (data.type === 'connected') {
            // Handle initial connection data
            if (data.recentUpdates) {
              setUpdates(data.recentUpdates.slice(0, 50))
            }
          }
        } catch (error) {
          // Parse error - ignore malformed messages
        }
      }
      
      wsRef.current.onclose = () => {
        isConnectingRef.current = false
        setConnectionStats(prev => ({
          ...prev,
          connected: false
        }))
        
        onConnectionChange?.(false)
        
        if (enableReconnect && shouldReconnectRef.current) {
          scheduleReconnect()
        }
      }
      
      wsRef.current.onerror = () => {
        isConnectingRef.current = false
        if (enableReconnect && shouldReconnectRef.current) {
          scheduleReconnect()
        }
      }
      
    } catch (error) {
      isConnectingRef.current = false
      if (enableReconnect && shouldReconnectRef.current) {
        scheduleReconnect()
      }
    }
  }

  // Schedule reconnection attempt
  const scheduleReconnect = () => {
    if (!shouldReconnectRef.current) return
    
    setConnectionStats(prev => {
      const newAttempts = prev.reconnectAttempts + 1
      
      if (newAttempts >= maxReconnectAttempts) {
        shouldReconnectRef.current = false
        return prev
      }
      
      // Exponential backoff
      const delay = Math.min(reconnectInterval * Math.pow(2, newAttempts - 1), 30000)
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, delay)
      
      return {
        ...prev,
        reconnectAttempts: newAttempts,
        totalReconnects: prev.totalReconnects + 1
      }
    })
  }

  // Cleanup function
  const cleanup = () => {
    shouldReconnectRef.current = false
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  // Initialize connection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      connect()
    }
    
    return cleanup
  }, [userId])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connectionStats.connected) {
        shouldReconnectRef.current = true
        setConnectionStats(prev => ({
          ...prev,
          reconnectAttempts: 0
        }))
        connect()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectionStats.connected])

  // Manual reconnect function
  const reconnect = () => {
    cleanup()
    shouldReconnectRef.current = true
    setConnectionStats(prev => ({
      ...prev,
      reconnectAttempts: 0
    }))
    connect()
  }

  // Send message function
  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }

  // Clear updates
  const clearUpdates = () => {
    setUpdates([])
  }

  return {
    updates,
    connectionStats,
    reconnect,
    sendMessage,
    clearUpdates,
    isConnected: connectionStats.connected,
    lastUpdate: updates[0] || null
  }
} 