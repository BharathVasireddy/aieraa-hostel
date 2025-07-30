'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import {
  migrateLocalStorageCart,
  needsCartMigration,
} from '@/lib/cart-migration';

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

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync cart with database
  const syncWithDatabase = useCallback(async () => {
    if (!session?.user?.id || status !== 'authenticated') {return;}

    try {
      setIsLoading(true);

      // Check if we need to migrate localStorage cart data
      if (needsCartMigration(session.user.id)) {
        console.log('Migrating cart data from localStorage...');
        await migrateLocalStorageCart(session.user.id);
      }

      const response = await fetch('/api/cart', {
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

          // Also save to localStorage as backup
          if (typeof window !== 'undefined') {
            const cartKey = `cart_${session.user.id}`;
            localStorage.setItem(cartKey, JSON.stringify(data.items || []));
          }
        }
      } else {
        // Fallback to localStorage if API fails
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
      // Fallback to localStorage if API fails
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [session?.user?.id, status]);

  // Load from localStorage as fallback
  const loadFromLocalStorage = useCallback(() => {
    if (!isMounted || !session?.user?.id) {return;}

    try {
      const cartKey = `cart_${session.user.id}`;
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      if (session?.user?.id) {
        const cartKey = `cart_${session.user.id}`;
        localStorage.removeItem(cartKey);
      }
    }
  }, [session?.user?.id, isMounted]);

  // Initial cart load
  useEffect(() => {
    if (!isMounted) {return;}

    if (status === 'authenticated' && session?.user?.id) {
      syncWithDatabase();
    } else if (status === 'unauthenticated') {
      setItems([]);
      setIsLoaded(true);
    }
  }, [session?.user?.id, status, isMounted, syncWithDatabase]);

  // Add item to cart
  const addItem = useCallback(
    async (newItem: Omit<CartItem, 'quantity'>, variantId?: string) => {
      if (!session?.user?.id) {
        console.error('User not authenticated');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/cart', {
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

        if (response.ok) {
          const data = await response.json();
          console.log('Add to cart API response:', data);
          
          if (data.success) {
            // Ensure we're setting the latest cart state
            const updatedItems = data.items || [];
            console.log('Updating cart items:', updatedItems.length, 'items');
            setItems(updatedItems);

            // Update localStorage
            if (typeof window !== 'undefined') {
              const cartKey = `cart_${session.user.id}`;
              localStorage.setItem(cartKey, JSON.stringify(updatedItems));
            }
          } else {
            console.error('Add to cart API returned success:false', data);
            throw new Error('API returned success:false');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Add to cart API failed:', response.status, errorData);
          
          // Fallback to local state update if API fails
          setItems(currentItems => {
            console.log('Using fallback cart update');
            const existingItem = currentItems.find(
              item =>
                item.id === newItem.id &&
                (item.variantId || '') === (variantId || '')
            );

            if (existingItem) {
              return currentItems.map(item =>
                item.id === newItem.id &&
                (item.variantId || '') === (variantId || '')
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              );
            } else {
              const newCartItems = [...currentItems, { ...newItem, quantity: 1, variantId }];
              console.log('Added new item to cart, total items:', newCartItems.length);
              return newCartItems;
            }
          });
        }
      } catch (error) {
        console.error('Failed to add item to cart:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id]
  );

  // Remove item from cart
  const removeItem = useCallback(
    async (itemId: string, variantId?: string) => {
      if (!session?.user?.id) {return;}

      try {
        setIsLoading(true);
        const params = new URLSearchParams({ menuItemId: itemId });
        if (variantId) {params.append('variantId', variantId);}

        const response = await fetch(`/api/cart?${params}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          // Immediately update local state to remove the item
          setItems(currentItems => {
            const updatedItems = currentItems.filter(
              item =>
                !(
                  item.id === itemId &&
                  (item.variantId || '') === (variantId || '')
                )
            );
            
            // Update localStorage
            if (typeof window !== 'undefined' && session?.user?.id) {
              const cartKey = `cart_${session.user.id}`;
              localStorage.setItem(cartKey, JSON.stringify(updatedItems));
            }
            
            return updatedItems;
          });
        } else {
          console.error('Failed to remove item from cart');
          // Don't sync with database on error - keep current state
        }
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number, variantId?: string) => {
      if (!session?.user?.id) {return;}

      if (quantity <= 0) {
        await removeItem(itemId, variantId);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/cart', {
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

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const updatedItems = data.items || [];
            setItems(updatedItems);

            // Update localStorage
            if (typeof window !== 'undefined') {
              const cartKey = `cart_${session.user.id}`;
              localStorage.setItem(cartKey, JSON.stringify(updatedItems));
            }
          } else {
            console.error('Update quantity API returned success:false');
            throw new Error('API returned success:false');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update quantity API failed:', response.status, errorData);
          
          // Fallback to local state update
          setItems(currentItems =>
            currentItems.map(item =>
              item.id === itemId && (item.variantId || '') === (variantId || '')
                ? { ...item, quantity }
                : item
            )
          );
        }
      } catch (error) {
        console.error('Failed to update cart quantity:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id, removeItem]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!session?.user?.id) {return;}

    try {
      setIsLoading(true);
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setItems([]);

        // Clear localStorage
        if (typeof window !== 'undefined') {
          const cartKey = `cart_${session.user.id}`;
          localStorage.removeItem(cartKey);
        }
      } else {
        // Fallback to local state update
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Helper functions
  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return getTotalPrice();
  }, [getTotalPrice]);

  const value = {
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
