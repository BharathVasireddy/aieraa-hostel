'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
  isVegetarian?: boolean
  isVegan?: boolean
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getSubtotal: () => number
  isLoaded: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isMounted) return
    
    if (session?.user?.id) {
      const cartKey = `cart_${session.user.id}`
      try {
        const savedCart = localStorage.getItem(cartKey)
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          setItems(parsedCart)
        }
      } catch (error) {
        console.error('Error parsing saved cart:', error)
        localStorage.removeItem(cartKey)
      }
    }
    setIsLoaded(true)
  }, [session?.user?.id, isMounted])

  // Save cart to localStorage whenever items change (client-side only)
  useEffect(() => {
    if (!isMounted || !isLoaded) return
    
    if (session?.user?.id) {
      const cartKey = `cart_${session.user.id}`
      localStorage.setItem(cartKey, JSON.stringify(items))
    }
  }, [items, isLoaded, session?.user?.id, isMounted])

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id)
      
      if (existingItem) {
        // Update quantity if item already exists
        return currentItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Add new item with quantity 1
        return [...currentItems, { ...newItem, quantity: 1 }]
      }
    })
  }

  const removeItem = (itemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    if (session?.user?.id) {
      const cartKey = `cart_${session.user.id}`
      localStorage.removeItem(cartKey)
    }
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getSubtotal = () => {
    return getTotalPrice()
  }

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    isLoaded
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 