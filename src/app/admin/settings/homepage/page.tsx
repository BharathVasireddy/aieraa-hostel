'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit3, Eye, EyeOff, Star, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MenuItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  orders: number
  isVeg: boolean
  category: string
}

interface PopularDish extends MenuItem {
  isActive: boolean
}

interface TodaysSpecial extends MenuItem {
  discountPrice: number
  badge: string
  isActive: boolean
}

export default function HomepageSettings() {
  const router = useRouter()
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([])
  const [todaysSpecials, setTodaysSpecials] = useState<TodaysSpecial[]>([])
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([])
  const [activeTab, setActiveTab] = useState<'popular' | 'specials'>('popular')

  useEffect(() => {
    // Mock data for available menu items
    const mockItems: MenuItem[] = [
      {
        id: '1',
        name: 'Butter Chicken',
        price: 180,
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop',
        rating: 4.5,
        orders: 156,
        isVeg: false,
        category: 'main'
      },
      {
        id: '2',
        name: 'Paneer Tikka',
        price: 160,
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop',
        rating: 4.3,
        orders: 142,
        isVeg: true,
        category: 'starter'
      },
      {
        id: '3',
        name: 'Chicken Biryani',
        price: 220,
        image: 'https://images.unsplash.com/photo-1563379091339-03246a1d0220?w=200&h=200&fit=crop',
        rating: 4.7,
        orders: 203,
        isVeg: false,
        category: 'main'
      },
      {
        id: '4',
        name: 'Dal Tadka',
        price: 120,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop',
        rating: 4.2,
        orders: 89,
        isVeg: true,
        category: 'main'
      },
      {
        id: '5',
        name: 'Rajma Rice',
        price: 140,
        originalPrice: 160,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop',
        rating: 4.1,
        orders: 67,
        isVeg: true,
        category: 'combo'
      }
    ]

    setAvailableItems(mockItems)

    // Mock current popular dishes
    setPopularDishes([
      { ...mockItems[0], isActive: true },
      { ...mockItems[1], isActive: true },
      { ...mockItems[2], isActive: true }
    ])

    // Mock current specials
    setTodaysSpecials([
      {
        ...mockItems[4],
        discountPrice: 99,
        badge: 'Limited Time',
        isActive: true
      }
    ])
  }, [])

  const togglePopularDish = (id: string) => {
    setPopularDishes(prev => 
      prev.map(dish => 
        dish.id === id ? { ...dish, isActive: !dish.isActive } : dish
      )
    )
  }

  const toggleTodaysSpecial = (id: string) => {
    setTodaysSpecials(prev => 
      prev.map(special => 
        special.id === id ? { ...special, isActive: !special.isActive } : special
      )
    )
  }

  const addPopularDish = (item: MenuItem) => {
    if (popularDishes.find(dish => dish.id === item.id)) return
    
    setPopularDishes(prev => [...prev, { ...item, isActive: true }])
  }

  const removePopularDish = (id: string) => {
    setPopularDishes(prev => prev.filter(dish => dish.id !== id))
  }

  const addTodaysSpecial = (item: MenuItem) => {
    if (todaysSpecials.find(special => special.id === item.id)) return
    
    setTodaysSpecials(prev => [...prev, {
      ...item,
      discountPrice: Math.round(item.price * 0.8), // 20% discount by default
      badge: 'New Special',
      isActive: true
    }])
  }

  const removeTodaysSpecial = (id: string) => {
    setTodaysSpecials(prev => prev.filter(special => special.id !== id))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <img 
              src="https://aieraa.com/wp-content/uploads/2020/08/Aieraa-Overseas-Logo.png" 
              alt="Aieraa Logo" 
              className="w-6 h-6 object-contain"
            />
            <h1 className="text-lg font-bold text-gray-900">Homepage Settings</h1>
          </div>
          <button className="btn-primary text-sm px-3 py-1.5">
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex px-4">
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'popular'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="font-medium">Popular Dishes</span>
          </button>
          <button
            onClick={() => setActiveTab('specials')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'specials'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="font-medium">Today&apos;s Specials</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {activeTab === 'popular' && (
          <>
            {/* Popular Dishes Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Popular Right Now</h2>
                  <p className="text-sm text-gray-600">Manage which dishes appear in the popular section</p>
                </div>
                <span className="text-sm text-gray-500">
                  {popularDishes.filter(dish => dish.isActive).length} active
                </span>
              </div>

              <div className="space-y-3">
                {popularDishes.map((dish) => (
                  <div key={dish.id} className="card p-4">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={dish.image} 
                        alt={dish.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                          {dish.isVeg ? (
                            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>₹{dish.price}</span>
                          <span>⭐ {dish.rating}</span>
                          <span>{dish.orders} orders</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => togglePopularDish(dish.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            dish.isActive 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {dish.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removePopularDish(dish.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Popular Dish */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Popular Dish</h3>
                <div className="grid grid-cols-1 gap-3">
                  {availableItems
                    .filter(item => !popularDishes.find(dish => dish.id === item.id))
                    .map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:border-red-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                {item.isVeg ? (
                                  <div className="w-3 h-3 bg-green-100 border border-green-500 rounded-sm flex items-center justify-center">
                                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                  </div>
                                ) : (
                                  <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-sm flex items-center justify-center">
                                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">₹{item.price} • ⭐ {item.rating}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addPopularDish(item)}
                            className="btn-secondary text-sm px-3 py-1.5"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'specials' && (
          <>
            {/* Today's Specials Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Today&apos;s Specials</h2>
                  <p className="text-sm text-gray-600">Manage featured items with special offers</p>
                </div>
                <span className="text-sm text-gray-500">
                  {todaysSpecials.filter(special => special.isActive).length} active
                </span>
              </div>

              <div className="space-y-3">
                {todaysSpecials.map((special) => (
                  <div key={special.id} className="card p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img 
                          src={special.image} 
                          alt={special.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                          {special.badge}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{special.name}</h3>
                          {special.isVeg ? (
                            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg font-bold text-orange-600">₹{special.discountPrice}</span>
                          <span className="text-sm text-gray-500 line-through">₹{special.price}</span>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            {Math.round(((special.price - special.discountPrice) / special.price) * 100)}% OFF
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleTodaysSpecial(special.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            special.isActive 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {special.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeTodaysSpecial(special.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Special */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Special</h3>
                <div className="grid grid-cols-1 gap-3">
                  {availableItems
                    .filter(item => !todaysSpecials.find(special => special.id === item.id))
                    .map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                {item.isVeg ? (
                                  <div className="w-3 h-3 bg-green-100 border border-green-500 rounded-sm flex items-center justify-center">
                                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                  </div>
                                ) : (
                                  <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-sm flex items-center justify-center">
                                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">₹{item.price} • Can add discount</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addTodaysSpecial(item)}
                            className="btn-secondary text-sm px-3 py-1.5"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Special
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 