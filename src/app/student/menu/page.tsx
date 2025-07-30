'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import {
  Calendar,
  Search,
  Filter,
  SlidersHorizontal,
  ShoppingCart,
  Leaf,
  Star,
} from 'lucide-react';
import { getVietnamTime, getOrderingCountdown } from '@/lib/timezone';
import MobileHeader from '@/components/MobileHeader';
import {
  CategorySkeleton,
  SearchSkeleton,
  ListSkeleton,
  CardSkeleton,
} from '@/components/ui/SkeletonLoaders';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import BottomNavigation from '@/components/BottomNavigation';
import StudentLayout from '@/components/StudentLayout';
import { useCart } from '@/components/CartProvider';
import { VariantSelectionModal } from '@/components/student/VariantSelectionModal';
import { MenuItemCard } from '@/components/student/MenuItemCard';
import { useMenuFiltering } from '@/hooks/useMenuFiltering';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  offerPrice?: number;
  image?: string;
  category: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  rating?: number;
  orderCount?: number;
  calories?: number;
  preparationTime?: number;
  variants?: MenuVariant[];
}

interface MenuVariant {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  description?: string;
  isAvailable?: boolean;
}

export default function StudentMenu() {
  const router = useRouter();
  const { user } = useUser();
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  // UI State - Shows immediately
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showVariationSheet, setShowVariationSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Date state
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedOrderDate');
      if (saved) {
        return saved;
      }
    }
    const tomorrow = addDays(startOfToday(), 1);
    return format(tomorrow, 'yyyy-MM-dd');
  });

  // Progressive loading for menu items
  const {
    data: menuItems,
    loading: loadingMenu,
    error: menuError,
    refetch: refetchMenu,
  } = useProgressiveLoading(
    async () => {
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      const response = await fetch(`/api/student/menu?date=${selectedDate}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.menuItems || [] : [];
    },
    [user?.id, selectedDate],
    { immediate: !!user?.id }
  );

  // Listen to date changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('selectedOrderDate');
      if (saved && saved !== selectedDate) {
        setSelectedDate(saved);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleDateChange = (e: CustomEvent) => {
      setSelectedDate(e.detail.date);
    };

    window.addEventListener('dateChanged', handleDateChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'dateChanged',
        handleDateChange as EventListener
      );
    };
  }, [selectedDate]);

  // Load search query from localStorage if coming from home page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedQuery = localStorage.getItem('searchQuery');
      if (savedQuery) {
        setSearchQuery(savedQuery);
        localStorage.removeItem('searchQuery');
      }
    }
  }, []);

  // Remove the old localStorage cart management - now handled by CartProvider

  // Categories - show immediately
  const categories = [
    { key: 'all', label: 'All', count: menuItems?.length || 0 },
    { key: 'BREAKFAST', label: 'Breakfast', count: 0 },
    { key: 'LUNCH', label: 'Lunch', count: 0 },
    { key: 'DINNER', label: 'Dinner', count: 0 },
    { key: 'SNACKS', label: 'Snacks', count: 0 },
    { key: 'BEVERAGES', label: 'Beverages', count: 0 },
  ];

  // Update category counts when menu items load
  useEffect(() => {
    if (menuItems) {
      const categoryCounts = menuItems.reduce((acc: any, item: MenuItem) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      categories.forEach(cat => {
        if (cat.key !== 'all') {
          cat.count = categoryCounts[cat.key] || 0;
        }
      });
    }
  }, [menuItems]);

  // Filter items - memoized for performance
  const filteredItems = useMemo(() => {
    if (!menuItems) return [];

    return menuItems.filter((item: MenuItem) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVegFilter = !showVegOnly || item.isVegetarian;

      return (
        matchesCategory && matchesSearch && matchesVegFilter && item.isAvailable
      );
    });
  }, [menuItems, selectedCategory, searchQuery, showVegOnly]);

  const addToCart = async (item: MenuItem, quantity: number = 1, variantId?: string) => {
    // If item has variants and no variant is selected, show variant selection
    if (item.variants && item.variants.length > 1 && !variantId) {
      setSelectedItem(item);
      setShowVariationSheet(true);
      return;
    }

    // Find the selected variant or use default
    const selectedVariant = variantId 
      ? item.variants?.find(v => v.id === variantId)
      : item.variants?.find(v => v.isDefault) || item.variants?.[0];

    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.offerPrice || selectedVariant?.price || item.price,
      category: item.category,
      isVegetarian: item.isVegetarian,
      image: item.image,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
    };
    await addItem(cartItem, variantId);
  };

  const updateCartQuantity = async (itemId: string, quantity: number) => {
    await updateQuantity(itemId, quantity);
  };

  const getCartItemQuantity = (itemId: string) => {
    return cartItems.find(item => item.id === itemId)?.quantity || 0;
  };

  const totalCartItems = getTotalItems();
  const totalCartAmount = getTotalPrice();

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Store the selected date for checkout
    localStorage.setItem('checkoutDate', selectedDate);
    router.push('/student/checkout');
  };

  // Show page structure immediately - no blocking loading states
  return (
    <StudentLayout>
      <div className='bg-gray-50 min-h-screen'>
        <div className='px-4 py-4 space-y-4'>
          {/* Search Bar - Shows immediately */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
            <input
              type='text'
              placeholder='Search for dishes...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            />
          </div>

          {/* Filters - Shows immediately */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => setShowVegOnly(!showVegOnly)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  showVegOnly
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <Leaf className='w-4 h-4' />
                <span className='text-sm font-medium'>Veg Only</span>
              </button>

              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className='flex items-center space-x-2 px-3 py-2 rounded-lg border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors'
              >
                <SlidersHorizontal className='w-4 h-4' />
                <span className='text-sm font-medium'>Filter</span>
              </button>
            </div>

            {totalCartItems > 0 && (
              <button
                onClick={handleCheckout}
                className='flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'
              >
                <ShoppingCart className='w-4 h-4' />
                <span className='text-sm font-medium'>{totalCartItems}</span>
                <span className='text-sm'>₹{totalCartAmount}</span>
              </button>
            )}
          </div>

          {/* Categories - Progressive Loading */}
          {loadingMenu ? (
            <CategorySkeleton />
          ) : (
            <div className='flex space-x-3 pb-4 overflow-x-auto'>
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full border transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className='text-sm font-medium'>
                    {category.label}
                    {category.count > 0 && ` (${category.count})`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Menu Items - Progressive Loading */}
          {loadingMenu ? (
            <ListSkeleton count={8} />
          ) : menuError ? (
            <div className='text-center py-12'>
              <p className='text-gray-500 mb-4'>Failed to load menu</p>
              <button
                onClick={refetchMenu}
                className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'
              >
                Try Again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-500'>No items found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='mt-2 text-green-600 hover:text-green-700 font-medium'
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredItems.map((item: MenuItem) => {
                const cartQuantity = getCartItemQuantity(item.id);

                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={cartQuantity}
                    onAdd={(item, variantId) => addToCart(item, 1, variantId)}
                    onUpdateQuantity={updateCartQuantity}
                    onShowVariants={(item) => {
                      setSelectedItem(item);
                      setShowVariationSheet(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Variant Selection Modal */}
      {selectedItem && (
        <VariantSelectionModal
          item={selectedItem}
          isOpen={showVariationSheet}
          onClose={() => {
            setShowVariationSheet(false);
            setSelectedItem(null);
          }}
          onSelect={(item, variantId) => {
            // Convert the modal's simplified MenuItem to our full MenuItem
            const fullItem = selectedItem!; // We know selectedItem is not null here
            addToCart(fullItem, 1, variantId);
            setShowVariationSheet(false);
            setSelectedItem(null);
          }}
        />
      )}
    </StudentLayout>
  );
}
