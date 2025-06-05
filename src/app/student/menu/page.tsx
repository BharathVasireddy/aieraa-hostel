'use client'

import { Search, Filter, Calendar, User, ChevronDown, Leaf, ShoppingCart, Plus, Minus, Menu } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfToday, set } from 'date-fns'
import StudentLayout from '@/components/StudentLayout'
import { getVietnamTime, getOrderingCountdown } from '@/lib/timezone'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  offerPrice?: number
  category: string
  isVegetarian: boolean
  image?: string
  variations?: {
    id: string
    name: string
    quantity: string
    price: number
    offerPrice?: number
  }[]
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function StudentMenu() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showVegOnly, setShowVegOnly] = useState(false)
  const [currentTime, setCurrentTime] = useState(getVietnamTime())
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showVariationSheet, setShowVariationSheet] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  // Get selected date from localStorage  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedOrderDate')
      if (saved) return saved
    }
    const tomorrow = addDays(startOfToday(), 1)
    return format(tomorrow, 'yyyy-MM-dd')
  })

  // Listen to localStorage changes for selectedDate
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('selectedOrderDate')
      if (saved && saved !== selectedDate) {
        setSelectedDate(saved)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen to custom events for same-tab updates  
    const handleDateChange = (e: CustomEvent) => {
      setSelectedDate(e.detail.date)
    }
    
    window.addEventListener('dateChanged', handleDateChange as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dateChanged', handleDateChange as EventListener)
    }
  }, [selectedDate])

  // Load search query from localStorage if coming from home page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedQuery = localStorage.getItem('searchQuery')
      if (savedQuery) {
        setSearchQuery(savedQuery)
        localStorage.removeItem('searchQuery') // Clear after loading
      }
    }
  }, [])

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      const cartData = {
        items: cartItems.reduce((acc, item) => {
          acc[item.id] = item.quantity
          return acc
        }, {} as { [key: string]: number }),
        orderDate: selectedDate,
        totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }
      localStorage.setItem('tempCart', JSON.stringify(cartData))
    } else {
      localStorage.removeItem('tempCart')
    }
  }, [cartItems, selectedDate])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tempCart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        if (cartData.orderDate === selectedDate) {
          // Convert back to cart items format
          const items: CartItem[] = Object.entries(cartData.items).map(([id, quantity]) => ({
            id,
            name: `Item ${id}`, // This would be populated properly from API
            price: 100, // This would be populated properly from API
            quantity: quantity as number
          }))
          setCartItems(items)
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        localStorage.removeItem('tempCart')
      }
    }
  }, [selectedDate])

  // Update time every minute (Vietnam time)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getVietnamTime())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Calculate countdown for selected date using new timezone logic
  const countdown = useMemo(() => {
    return getOrderingCountdown(selectedDate)
  }, [currentTime, selectedDate])

  const goToCheckout = useCallback(() => {
    // Clear temporary cart and save final cart to localStorage
    localStorage.removeItem('tempCart')
    const orderCart = {
      items: cartItems.reduce((acc, item) => {
        acc[item.id] = item.quantity
        return acc
      }, {} as { [key: string]: number }),
      orderDate: selectedDate,
      totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }
    localStorage.setItem('orderCart', JSON.stringify(orderCart))
    router.push('/student/checkout')
  }, [cartItems, selectedDate])

  // Clear search functionality
  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Category options - memoized for performance
  const categories = useMemo(() => [
    { key: 'all', label: 'All Items', emoji: '🍽️' },
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { key: 'lunch', label: 'Lunch', emoji: '🌞' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
    { key: 'beverages', label: 'Beverages', emoji: '☕' }
  ], [])

  // Calculate cart totals - memoized
  const { cartTotal, cartItemsCount } = useMemo(() => ({
    cartTotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    cartItemsCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }), [cartItems])

  // Mock menu items with variations - optimized loading
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true)
      try {
        // Use the new student menu API with proper parameters
        const params = new URLSearchParams({
          date: selectedDate,
          category: selectedCategory,
          search: searchQuery,
          vegOnly: showVegOnly.toString()
        })
        
        const response = await fetch(`/api/student/menu?${params}`)
        const data = await response.json()
        
        if (data.success) {
          // Transform API response to match component interface
          const transformedItems: MenuItem[] = data.menuItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            offerPrice: item.offerPrice,
            category: item.categories?.[0] || 'SNACKS', // Use first category for display
            isVegetarian: item.isVegetarian,
            image: item.image,
            variations: item.variants?.map((variant: any) => ({
              id: variant.id,
              name: variant.name,
              quantity: variant.name, // Use name as quantity description
              price: variant.price,
              offerPrice: null
            })) || []
          }))
          
          setMenuItems(transformedItems)
        } else {
          console.error('Failed to fetch menu items:', data.error)
          setMenuItems([])
        }
      } catch (error) {
        console.error('Error fetching menu items:', error)
        setMenuItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchMenuItems()
  }, [selectedDate, selectedCategory, searchQuery, showVegOnly])

  // Filter items based on category, search, and vegetarian preference - memoized
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesVegFilter = !showVegOnly || item.isVegetarian
      
      return matchesCategory && matchesSearch && matchesVegFilter
    })
  }, [menuItems, selectedCategory, searchQuery, showVegOnly])

  // Optimized cart functions with useCallback
  const addToCart = useCallback((item: MenuItem, variationId?: string) => {
    // If item has variations and no variation selected, show bottom sheet
    if (item.variations && item.variations.length > 0 && !variationId) {
      setSelectedItem(item)
      setShowVariationSheet(true)
      return
    }

    // Get the actual item to add (with variation if selected)
    let itemId = item.id
    let itemName = item.name
    let itemPrice = item.price

    if (variationId && item.variations) {
      const variation = item.variations.find(v => v.id === variationId)
      if (variation) {
        itemId = `${item.id}-${variationId}`
        itemName = `${item.name} (${variation.quantity})`
        itemPrice = variation.offerPrice || variation.price
      }
    } else if (item.offerPrice) {
      itemPrice = item.offerPrice
    }

    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId)
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prev, { id: itemId, name: itemName, price: itemPrice, quantity: 1 }]
      }
    })

    // Close bottom sheet if open
    setShowVariationSheet(false)
    setSelectedItem(null)
  }, [])

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId)
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      } else {
        return prev.filter(cartItem => cartItem.id !== itemId)
      }
    })
  }, [])

  const getItemQuantityInCart = useCallback((itemId: string) => {
    const item = cartItems.find(cartItem => cartItem.id === itemId)
    return item ? item.quantity : 0
  }, [cartItems])

  const handleCategorySelect = useCallback((categoryKey: string) => {
    setSelectedCategory(categoryKey)
    setShowCategoryMenu(false)
  }, [])

  const getCurrentCategory = useCallback(() => {
    return categories.find(cat => cat.key === selectedCategory) || categories[0]
  }, [categories, selectedCategory])

  // Optimized image URL function - memoized
  const getImageUrl = useCallback((itemName: string, category: string) => {
    const foodImages: { [key: string]: string } = {
      'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop',
      'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop',
      'chicken biryani': 'https://images.unsplash.com/photo-1563379091339-03246a1d0220?w=200&h=200&fit=crop',
      'dal tadka': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop',
      'naan': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop',
      'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop',
      'roti': 'https://images.unsplash.com/photo-1599487488170-d11ec9172f0?w=200&h=200&fit=crop',
      'curry': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop',
      'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop',
      'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop',
      'burger': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop',
      'sandwich': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=200&h=200&fit=crop',
      'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
      'soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&h=200&fit=crop',
      'dessert': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop',
      'beverage': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop',
      'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&h=200&fit=crop',
      'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop',
      'snack': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&h=200&fit=crop',
      'breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&h=200&fit=crop',
      'lunch': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
      'dinner': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop'
    }
    
    // Try to match by item name first
    const nameKey = Object.keys(foodImages).find(key => 
      itemName.toLowerCase().includes(key)
    )
    if (nameKey && foodImages[nameKey]) return foodImages[nameKey]
    
    // Fall back to category
    const categoryKey = Object.keys(foodImages).find(key => 
      category.toLowerCase().includes(key)
    )
    if (categoryKey && foodImages[categoryKey]) return foodImages[categoryKey]
    
    // Default fallback
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop'
  }, [])

  if (loading) {
    return (
      <StudentLayout className="pb-16">
        {/* Top Nav - Loading */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-20 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Sticky Search Bar - Loading */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
          <div className="flex space-x-3">
            <div className="flex-1 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
        
        {/* Menu Items - Loading */}
        <div className="px-4 py-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex">
                <div className="w-24 h-24 bg-gray-200 animate-pulse flex-shrink-0"></div>
                <div className="flex-1 p-4">
                  <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout className="pb-16">
      {/* Sticky Search Bar */}
      <div className="sticky top-[65px] z-40 bg-white shadow-sm">
        {/* Search Bar with Veg Toggle */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex space-x-3">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search hostel dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Veg Toggle Switch with Text */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
              <Leaf className={`w-4 h-4 transition-colors duration-200 ${showVegOnly ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700">Veg</span>
              <div className="relative">
                <input
                  type="checkbox"
                  id="veg-toggle"
                  checked={showVegOnly}
                  onChange={(e) => setShowVegOnly(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="veg-toggle"
                  className={`block w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ${
                    showVegOnly ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      showVegOnly ? 'translate-x-5' : 'translate-x-0'
                    } mt-0.5 ml-0.5`}
                  ></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cutoff Notice Banner */}
        {countdown.isPastCutoff && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <div className="text-center">
              <div className="text-sm text-red-800">
                <strong>Ordering closed for this date.</strong> Orders must be placed before 10:00 PM Vietnam time the day before.
              </div>
              <div className="text-xs text-red-600 mt-1">
                Choose a different date to place your order.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3" style={{ paddingBottom: cartItems.length > 0 ? '140px' : '80px' }}>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">
              {searchQuery ? '🔍' : showVegOnly ? '🥗' : '🍽️'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No items found' : showVegOnly ? 'No vegetarian items' : 'No items found'}
            </h3>
            <p className="text-sm text-gray-600">
              {searchQuery ? 'Try a different search term' : showVegOnly ? 'Try turning off the veg filter' : 'Try a different category'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const quantityInCart = getItemQuantityInCart(item.id)
            
            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex">
                  {/* Food Image */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img 
                      src={getImageUrl(item.name, item.category)} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      {item.isVegetarian ? (
                        <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {item.offerPrice ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-green-600">₹{item.offerPrice}</span>
                                <span className="text-sm text-gray-500 line-through">₹{item.price}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                            )}
                            {item.variations && item.variations.length > 0 && (
                              <span className="text-xs text-gray-500">{item.variations.length} options available</span>
                            )}
                          </div>
                          {quantityInCart > 0 ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                disabled={countdown.isPastCutoff}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                                  countdown.isPastCutoff 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                }`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900">{quantityInCart}</span>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={countdown.isPastCutoff}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                                  countdown.isPastCutoff 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(item)}
                              disabled={countdown.isPastCutoff}
                              className={`px-4 py-2 text-sm rounded-xl flex items-center space-x-1 transition-all duration-200 shadow-sm ${
                                countdown.isPastCutoff 
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 hover:shadow-md'
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                              <span>{countdown.isPastCutoff ? 'Closed' : 'Add'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Floating Category Menu Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200 active:scale-90 hover:shadow-xl"
          >
            <div className="flex flex-col items-center">
              <span className="text-lg">{getCurrentCategory().emoji}</span>
              <Menu className={`w-3 h-3 text-gray-600 mt-0.5 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Category Menu Dropdown */}
          {showCategoryMenu && (
            <div className="absolute bottom-14 right-0 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-50">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-100">
                  Select Category
                </div>
                {categories.map((category) => {
                  const count = category.key === 'all' 
                    ? filteredItems.length 
                    : menuItems.filter(item => {
                        const matchesCategory = item.category.toLowerCase() === category.key
                        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                             item.description.toLowerCase().includes(searchQuery.toLowerCase())
                        const matchesVegFilter = !showVegOnly || item.isVegetarian
                        return matchesCategory && matchesSearch && matchesVegFilter
                      }).length

                  return (
                    <button
                      key={category.key}
                      onClick={() => handleCategorySelect(category.key)}
                      className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all duration-200 hover:bg-gray-50 active:scale-95 ${
                        selectedCategory === category.key ? 'bg-green-50 text-green-900' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-base">{category.emoji}</span>
                          <span className="font-medium">{category.label}</span>
                        </div>
                        <span className="text-xs text-gray-500">({count})</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Cart Section - Single Line */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs font-bold text-white">{cartItems.length}</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-600">₹{cartTotal}</div>
                </div>
              </div>
              <button
                onClick={goToCheckout}
                disabled={countdown.isPastCutoff}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm ${
                  countdown.isPastCutoff 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 hover:shadow-md'
                }`}
              >
                {countdown.isPastCutoff ? 'Ordering Closed' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside overlay to close menus */}
      {showCategoryMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-10" 
          onClick={() => {
            setShowCategoryMenu(false)
            setShowVariationSheet(false)
            setSelectedItem(null)
          }}
        ></div>
      )}

      {/* Variation Bottom Sheet */}
      {showVariationSheet && selectedItem && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-50 animate-in fade-in duration-200" onClick={() => {
          setShowVariationSheet(false)
          setSelectedItem(null)
        }}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-96 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Header */}
              <div className="px-4 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{selectedItem.name}</h3>
                <p className="text-sm text-gray-600">Select quantity</p>
              </div>
              
              {/* Variations */}
              <div className="px-4 py-4 max-h-64 overflow-y-auto space-y-3">
                {selectedItem.variations?.map((variation) => (
                  <button
                    key={variation.id}
                    onClick={() => addToCart(selectedItem, variation.id)}
                    className="w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-98"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{variation.name}</div>
                        <div className="text-sm text-gray-600">{variation.quantity}</div>
                      </div>
                      <div className="text-right">
                        {variation.offerPrice ? (
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-green-600">₹{variation.offerPrice}</span>
                            <span className="text-sm text-gray-500 line-through">₹{variation.price}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">₹{variation.price}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  )
} 