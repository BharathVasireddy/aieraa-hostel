'use client'

import { Clock, Star, RotateCcw, Heart, Plus } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'

export default function QuickOrder() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState('recent')

  const reorder = (orderItems: string[]) => {
    console.log('Reordering:', orderItems)
    // Add logic to add items to cart and redirect
    router.push('/student/menu')
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Quick Order</h1>
            <p className="text-sm text-gray-600">Reorder your favorites instantly</p>
          </div>
          <button 
            onClick={() => router.push('/student/menu')}
            className="p-2 bg-blue-100 rounded-lg"
          >
            <Plus className="h-4 w-4 text-blue-600" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedTab('recent')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
              selectedTab === 'recent' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Recent Orders
          </button>
          <button 
            onClick={() => setSelectedTab('favorites')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
              selectedTab === 'favorites' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Favorites
          </button>
        </div>

        {selectedTab === 'recent' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            
            {/* Recent Order 1 */}
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Order #1001</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Dec 1, 2024 • Breakfast</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Masala Dosa</span>
                      <span className="text-sm font-medium">₹60</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Dal Rice Combo</span>
                      <span className="text-sm font-medium">₹80</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-sm font-bold text-gray-900">Total: ₹140</span>
                  <p className="text-xs text-gray-500">2 items</p>
                </div>
                <button 
                  onClick={() => reorder(['Masala Dosa', 'Dal Rice Combo'])}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reorder</span>
                </button>
              </div>
            </div>

            {/* Recent Order 2 */}
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Order #0998</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Nov 30, 2024 • Lunch</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Chicken Biryani</span>
                      <span className="text-sm font-medium">₹120</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-sm font-bold text-gray-900">Total: ₹120</span>
                  <p className="text-xs text-gray-500">1 item</p>
                </div>
                <button 
                  onClick={() => reorder(['Chicken Biryani'])}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reorder</span>
                </button>
              </div>
            </div>

            {/* Recent Order 3 */}
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Order #0995</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Nov 29, 2024 • Dinner</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Idli Sambar</span>
                      <span className="text-sm font-medium">₹50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Veg Pulao</span>
                      <span className="text-sm font-medium">₹90</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-sm font-bold text-gray-900">Total: ₹140</span>
                  <p className="text-xs text-gray-500">2 items</p>
                </div>
                <button 
                  onClick={() => reorder(['Idli Sambar', 'Veg Pulao'])}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reorder</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'favorites' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Favorite Items</h2>
              <p className="text-sm text-gray-500">4 favorites</p>
            </div>
            
            {/* Favorite Item 1 */}
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🍛</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Chicken Biryani</h3>
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Aromatic basmati rice with tender chicken</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-900">₹120</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500 ml-1">4.9</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => reorder(['Chicken Biryani'])}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Item 2 */}
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🥘</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Masala Dosa</h3>
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Crispy dosa with spicy potato filling</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-900">₹60</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500 ml-1">4.8</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => reorder(['Masala Dosa'])}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Item 3 */}
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🍚</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Dal Rice Combo</h3>
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Yellow dal with steamed rice & pickle</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-900">₹80</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500 ml-1">4.7</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => reorder(['Dal Rice Combo'])}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Combo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-blue-900 text-sm">Usual Breakfast Combo</h3>
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </div>
                  <p className="text-xs text-blue-700 mb-2">Masala Dosa + Coffee • Your go-to breakfast</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-blue-900">₹80</span>
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Save ₹20</span>
                    </div>
                    <button 
                      onClick={() => reorder(['Masala Dosa', 'Coffee'])}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                    >
                      Reorder Combo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Ordering Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">24</div>
              <div className="text-xs text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">₹2,890</div>
              <div className="text-xs text-gray-600">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">4</div>
              <div className="text-xs text-gray-600">Favorites</div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
} 