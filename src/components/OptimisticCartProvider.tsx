'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  variantId?: string;
  variantName?: string;
  image?: string;
  cartItemId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, 'quantity'>,
    variantId?: string
  ) => Promise<void>;
  removeItem: (itemId: string, variantId?: string) => Promise<void>;
  updateQuantity: (
    itemId: string,
    quantity: number,
    variantId?: string
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  isLoaded: boolean;
  isLoading: boolean;
  syncWithDatabase: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function OptimisticCartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Track pending operations to prevent conflicts
  const pendingOperations = useRef<Set<string>>(new Set());

  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Optimistic update helper
  const optimisticUpdate = useCallback((
    operation: () => CartItem[],
    apiCall: () => Promise<void>
  ) => {
    // Apply optimistic update immediately
    setItems(operation());
    
    // Make API call in background
    apiCall().catch((error) => {
      console.error('API call failed, reverting optimistic update:', error);
      // Revert on failure by re-syncing with server
      syncWithDatabase();
    });
  }, []);

  // Sync cart with database
  const syncWithDatabase = useCallback(async () => {
    if (!session?.user?.id || status !== 'authenticated') return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/cart/optimized', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setItems(data.items || []);
        }
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [session?.user?.id, status]);

  // Initial cart load
  useEffect(() => {
    if (!isMounted) return;

    if (status === 'authenticated' && session?.user?.id) {
      syncWithDatabase();
    } else if (status === 'unauthenticated') {
      setItems([]);
      setIsLoaded(true);
    }
  }, [session?.user?.id, status, isMounted, syncWithDatabase]);

  // Add item to cart with optimistic update
  const addItem = useCallback(
    async (newItem: Omit<CartItem, 'quantity'>, variantId?: string) => {
      if (!session?.user?.id) {
        console.error('User not authenticated');
        return;
      }

      const operationId = `add_${newItem.id}_${variantId || 'default'}`;
      if (pendingOperations.current.has(operationId)) return;
      pendingOperations.current.add(operationId);

      optimisticUpdate(
        // Optimistic operation
        () => {
          const existingItem = items.find(
            item =>
              item.id === newItem.id &&
              (item.variantId || '') === (variantId || '')
          );

          if (existingItem) {
            return items.map(item =>
              item.id === newItem.id && (item.variantId || '') === (variantId || '')
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            return [
              ...items,
              {
                ...newItem,
                quantity: 1,
                variantId,
              },
            ];
          }
        },
        // API call
        async () => {
          const response = await fetch('/api/cart/optimized', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              menuItemId: newItem.id,
              variantId,
              quantity: 1,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to add item to cart');
          }
        }
      );

      pendingOperations.current.delete(operationId);
    },
    [session?.user?.id, items, optimisticUpdate]
  );

  // Update quantity with optimistic update
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number, variantId?: string) => {
      if (!session?.user?.id) return;

      const operationId = `update_${itemId}_${variantId || 'default'}`;
      if (pendingOperations.current.has(operationId)) return;
      pendingOperations.current.add(operationId);

      optimisticUpdate(
        // Optimistic operation
        () => {
          if (quantity <= 0) {
            return items.filter(
              item =>
                !(item.id === itemId && (item.variantId || '') === (variantId || ''))
            );
          }
          return items.map(item =>
            item.id === itemId && (item.variantId || '') === (variantId || '')
              ? { ...item, quantity }
              : item
          );
        },
        // API call
        async () => {
          const response = await fetch('/api/cart/optimized', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              menuItemId: itemId,
              variantId,
              quantity,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update quantity');
          }
        }
      );

      pendingOperations.current.delete(operationId);
    },
    [session?.user?.id, items, optimisticUpdate]
  );

  // Remove item with optimistic update
  const removeItem = useCallback(
    async (itemId: string, variantId?: string) => {
      if (!session?.user?.id) return;

      const operationId = `remove_${itemId}_${variantId || 'default'}`;
      if (pendingOperations.current.has(operationId)) return;
      pendingOperations.current.add(operationId);

      optimisticUpdate(
        // Optimistic operation
        () => items.filter(
          item =>
            !(item.id === itemId && (item.variantId || '') === (variantId || ''))
        ),
        // API call
        async () => {
          const response = await fetch('/api/cart/optimized', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              menuItemId: itemId,
              variantId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to remove item');
          }
        }
      );

      pendingOperations.current.delete(operationId);
    },
    [session?.user?.id, items, optimisticUpdate]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!session?.user?.id) return;

    optimisticUpdate(
      // Optimistic operation
      () => [],
      // API call
      async () => {
        const response = await fetch('/api/cart/optimized', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ clearAll: true }),
        });

        if (!response.ok) {
          throw new Error('Failed to clear cart');
        }
      }
    );
  }, [session?.user?.id, optimisticUpdate]);

  // Calculate totals
  const getTotalItems = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return getTotalPrice();
  }, [getTotalPrice]);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    isLoaded,
    isLoading,
    syncWithDatabase,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useOptimisticCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useOptimisticCart must be used within OptimisticCartProvider');
  }
  return context;
} 