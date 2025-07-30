import { useState, useCallback, useRef } from 'react'
import { trackAPIEndpoint } from '@/lib/performance'

interface OptimisticUpdate<T> {
  id: string
  type: string
  data: T
  timestamp: number
  status: 'pending' | 'success' | 'error'
  rollbackData?: T
  error?: string
}

interface UseOptimisticUpdatesProps<T> {
  onSuccess?: (id: string, data: T) => void
  onError?: (id: string, error: string, rollbackData?: T) => void
  onRollback?: (id: string, rollbackData: T) => void
}

export function useOptimisticUpdates<T>({
  onSuccess,
  onError,
  onRollback
}: UseOptimisticUpdatesProps<T> = {}) {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map())
  const updateIdCounter = useRef(0)

  // Apply optimistic update immediately
  const applyOptimisticUpdate = useCallback((
    type: string,
    data: T,
    rollbackData?: T
  ): string => {
    const id = `optimistic-${Date.now()}-${++updateIdCounter.current}`
    
    const update: OptimisticUpdate<T> = {
      id,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending',
      rollbackData
    }

    setPendingUpdates(prev => new Map(prev).set(id, update))
    
    return id
  }, [])

  // Confirm optimistic update (when API succeeds)
  const confirmUpdate = useCallback((id: string, finalData?: T) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev)
      const update = newMap.get(id)
      
      if (update) {
        const confirmedData = finalData || update.data
        newMap.set(id, { ...update, status: 'success', data: confirmedData })
        
        // Call success callback
        onSuccess?.(id, confirmedData)
        
        // Remove after a short delay
        setTimeout(() => {
          setPendingUpdates(current => {
            const cleanMap = new Map(current)
            cleanMap.delete(id)
            return cleanMap
          })
        }, 1000)
      }
      
      return newMap
    })
  }, [onSuccess])

  // Rollback optimistic update (when API fails)
  const rollbackUpdate = useCallback((id: string, error: string) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev)
      const update = newMap.get(id)
      
      if (update) {
        newMap.set(id, { ...update, status: 'error', error })
        
        // Call error callback
        onError?.(id, error, update.rollbackData)
        
        // Call rollback callback if rollback data exists
        if (update.rollbackData) {
          onRollback?.(id, update.rollbackData)
        }
        
        // Remove after delay
        setTimeout(() => {
          setPendingUpdates(current => {
            const cleanMap = new Map(current)
            cleanMap.delete(id)
            return cleanMap
          })
        }, 3000) // Keep errors visible longer
      }
      
      return newMap
    })
  }, [onError, onRollback])

  // Execute optimistic update with API call
  const executeOptimisticUpdate = useCallback(async <R>(
    type: string,
    optimisticData: T,
    apiCall: () => Promise<R>,
    rollbackData?: T,
    transform?: (apiResponse: R) => T
  ): Promise<R> => {
    const updateId = applyOptimisticUpdate(type, optimisticData, rollbackData)
    
    try {
      const response = await trackAPIEndpoint(`optimistic-${type}`)(() => apiCall())
      
      // Transform API response if needed
      const finalData = transform ? transform(response as any) : optimisticData
      confirmUpdate(updateId, finalData)
      
      return response as R
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      rollbackUpdate(updateId, errorMessage)
      throw error
    }
  }, [applyOptimisticUpdate, confirmUpdate, rollbackUpdate])

  // Get all pending updates
  const getPendingUpdates = useCallback(() => {
    return Array.from(pendingUpdates.values())
  }, [pendingUpdates])

  // Get pending updates by type
  const getPendingUpdatesByType = useCallback((type: string) => {
    return Array.from(pendingUpdates.values()).filter(update => update.type === type)
  }, [pendingUpdates])

  // Check if there are any pending updates
  const hasPendingUpdates = useCallback(() => {
    return pendingUpdates.size > 0
  }, [pendingUpdates])

  // Clear all updates (useful for cleanup)
  const clearAllUpdates = useCallback(() => {
    setPendingUpdates(new Map())
  }, [])

  return {
    executeOptimisticUpdate,
    applyOptimisticUpdate,
    confirmUpdate,
    rollbackUpdate,
    getPendingUpdates,
    getPendingUpdatesByType,
    hasPendingUpdates,
    clearAllUpdates,
    pendingUpdatesCount: pendingUpdates.size
  }
}

// Specialized hook for cart operations
export function useOptimisticCart() {
  const [cart, setCart] = useState<any[]>([])
  const [cartTotal, setCartTotal] = useState(0)

  const cartOptimistic = useOptimisticUpdates<any>({
    onRollback: (id, rollbackData) => {
      // Rollback cart changes
      if (rollbackData) {
        setCart(rollbackData.cart || [])
        setCartTotal(rollbackData.total || 0)
      }
    }
  })

  const addToCart = useCallback(async (item: any, quantity: number = 1) => {
    const currentCart = [...cart]
    const currentTotal = cartTotal
    
    // Optimistic update
    const existingItem = currentCart.find(cartItem => cartItem.id === item.id)
    let newCart: any[]
    
    if (existingItem) {
      newCart = currentCart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      )
    } else {
      newCart = [...currentCart, { ...item, quantity }]
    }
    
    const newTotal = newCart.reduce((sum, cartItem) => sum + (cartItem.price * cartItem.quantity), 0)
    
    // Apply optimistic changes immediately
    setCart(newCart)
    setCartTotal(newTotal)

    try {
      // API call to add to cart
      const response = await cartOptimistic.executeOptimisticUpdate(
        'add-to-cart',
        { item, quantity },
        () => fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id, quantity })
        }).then(res => {
          if (!res.ok) {throw new Error('Failed to add to cart')}
          return res.json()
        }),
        { cart: currentCart, total: currentTotal } // Rollback data
      )

      return response
    } catch (error) {
      // Error handling is done by the optimistic update hook
      throw error
    }
  }, [cart, cartTotal, cartOptimistic])

  const removeFromCart = useCallback(async (itemId: string) => {
    const currentCart = [...cart]
    const currentTotal = cartTotal
    
    // Optimistic update
    const newCart = currentCart.filter(item => item.id !== itemId)
    const newTotal = newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    setCart(newCart)
    setCartTotal(newTotal)

    try {
      await cartOptimistic.executeOptimisticUpdate(
        'remove-from-cart',
        { itemId },
        () => fetch(`/api/cart/remove`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId })
        }).then(res => {
          if (!res.ok) {throw new Error('Failed to remove from cart')}
          return res.json()
        }),
        { cart: currentCart, total: currentTotal }
      )
    } catch (error) {
      throw error
    }
  }, [cart, cartTotal, cartOptimistic])

  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    const currentCart = [...cart]
    const currentTotal = cartTotal
    
    if (newQuantity <= 0) {
      return removeFromCart(itemId)
    }
    
    // Optimistic update
    const newCart = currentCart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    )
    const newTotal = newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    setCart(newCart)
    setCartTotal(newTotal)

    try {
      await cartOptimistic.executeOptimisticUpdate(
        'update-quantity',
        { itemId, quantity: newQuantity },
        () => fetch('/api/cart/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, quantity: newQuantity })
        }).then(res => {
          if (!res.ok) {throw new Error('Failed to update quantity')}
          return res.json()
        }),
        { cart: currentCart, total: currentTotal }
      )
    } catch (error) {
      throw error
    }
  }, [cart, cartTotal, cartOptimistic, removeFromCart])

  const clearCart = useCallback(() => {
    setCart([])
    setCartTotal(0)
  }, [])

  return {
    cart,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isUpdating: cartOptimistic.hasPendingUpdates(),
    pendingUpdates: cartOptimistic.getPendingUpdates()
  }
}

// Specialized hook for order status updates
export function useOptimisticOrderStatus() {
  const [orders, setOrders] = useState<any[]>([])

  const orderOptimistic = useOptimisticUpdates<any>({
    onRollback: (id, rollbackData) => {
      if (rollbackData) {
        setOrders(rollbackData)
      }
    }
  })

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    const currentOrders = [...orders]
    
    // Optimistic update
    const newOrders = currentOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    
    setOrders(newOrders)

    try {
      await orderOptimistic.executeOptimisticUpdate(
        'update-order-status',
        { orderId, status: newStatus },
        () => fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }).then(res => {
          if (!res.ok) {throw new Error('Failed to update order status')}
          return res.json()
        }),
        currentOrders
      )
    } catch (error) {
      throw error
    }
  }, [orders, orderOptimistic])

  const setOrdersData = useCallback((newOrders: any[]) => {
    setOrders(newOrders)
  }, [])

  return {
    orders,
    setOrdersData,
    updateOrderStatus,
    isUpdating: orderOptimistic.hasPendingUpdates(),
    pendingUpdates: orderOptimistic.getPendingUpdates()
  }
} 