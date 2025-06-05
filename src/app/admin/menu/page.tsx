'use client'

import { Plus, Search, Filter, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw, AlertTriangle, Building } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'

interface MenuItem {
  id: string
  name: string
  description: string
  basePrice: number
  categories: string[]
  isVegetarian: boolean
  isVegan: boolean
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  allergens: string[]
  isActive: boolean
  image?: string
  university: {
    id: string
    name: string
    code: string
  }
  variants: {
    id: string
    name: string
    price: number
    isDefault: boolean
    isActive: boolean
  }[]
  availability?: {
    date: string
    isAvailable: boolean
    maxQuantity?: number
  }[]
  createdAt: string
  updatedAt: string
}

interface University {
  id: string
  name: string
  code: string
  city: string
  state: string
}

export default function AdminMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState<string>('')
  const [currentUserData, setCurrentUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const categories = [
    { key: 'all', label: 'All Items' },
    { key: 'BREAKFAST', label: 'Breakfast' },
    { key: 'LUNCH', label: 'Lunch' },
    { key: 'DINNER', label: 'Dinner' },
    { key: 'SNACKS', label: 'Snacks' },
    { key: 'BEVERAGES', label: 'Beverages' }
  ]

  useEffect(() => {
    if (session?.user) {
      fetchCurrentUser()
      fetchUniversities()
      fetchMenuItems()
    }
  }, [session])

  useEffect(() => {
    filterItems()
  }, [menuItems, selectedTab, statusFilter, searchQuery])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/admin/profile')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserData(data.profile)
        
        // Set default university for managers
        if (data.profile.role === 'MANAGER' && data.profile.university) {
          setSelectedUniversity(data.profile.university.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const fetchUniversities = async () => {
    try {
      const response = await fetch('/api/universities')
      if (response.ok) {
        const data = await response.json()
        setUniversities(data)
        
        // Set first university as default for super admin
        if (data.length > 0 && !selectedUniversity) {
          setSelectedUniversity(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch universities:', error)
    }
  }

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/menu')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      } else {
        console.error('Failed to fetch menu items')
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMenuItems()
    setRefreshing(false)
  }

  const filterItems = () => {
    let filtered = menuItems

    // Filter by category
    if (selectedTab !== 'all') {
      filtered = filtered.filter(item => 
        item.categories?.includes(selectedTab)
      )
    }

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(item => item.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(item => !item.isActive)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.categories || []).some(cat => 
          cat?.toLowerCase().includes(query)
        )
      )
    }

    setFilteredItems(filtered)
  }

  const handleAddNew = () => {
    router.push('/admin/menu/new')
  }

  const handleEditItem = (item: MenuItem) => {
    router.push(`/admin/menu/${item.id}/edit`)
  }

  const toggleItemStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/menu/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        await fetchMenuItems()
      } else {
        console.error('Failed to toggle item status')
      }
    } catch (error) {
      console.error('Toggle status error:', error)
    }
  }

  const deleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(itemId)
      const response = await fetch(`/api/admin/menu/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMenuItems()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete menu item')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete menu item')
    } finally {
      setDeleting(null)
    }
  }

  const getItemCount = (category: string) => {
    if (category === 'all') return menuItems.length
    return menuItems.filter(item => 
      item.categories?.includes(category)
    ).length
  }

  const getStatusStats = () => {
    const total = menuItems.length
    const active = menuItems.filter(item => item.isActive).length
    const inactive = total - active
    return { total, active, inactive }
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader 
          title="Menu Management" 
          showNotifications={true}
        />
        <div className="px-4 py-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Menu Management" 
        showNotifications={true}
        rightElement={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 max-w-7xl mx-auto">
        {/* University Selector for Super Admin */}
        {currentUserData?.role === 'ADMIN' && (
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center space-x-4">
              <Building className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Managing University
                </label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {universities.map(university => (
                    <option key={university.id} value={university.id}>
                      {university.name} ({university.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Role & University Info */}
        {currentUserData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  {currentUserData.role === 'ADMIN' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      👑 Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      🎯 University Manager
                    </span>
                  )}
                </div>
                {currentUserData.university && (
                  <p className="text-sm text-gray-600 mt-1">
                    Managing: {currentUserData.university.name}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Menu Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats - Responsive Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-lg text-center border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg text-center border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg text-center border border-gray-100">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-xs text-gray-600">Inactive</div>
          </div>
        </div>

        {/* Add New Item Button */}
        <button 
          onClick={handleAddNew}
          className="w-full flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Menu Item
        </button>

        {/* Filters - Responsive Layout */}
        <div className="space-y-3">
          {/* Category Tabs - Responsive */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button 
                key={category.key}
                onClick={() => setSelectedTab(category.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                  selectedTab === category.key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label} ({getItemCount(category.key)})
              </button>
            ))}
          </div>

          {/* Search and Status Filter - Responsive */}
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Menu Items - Responsive Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🍽️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : selectedTab === 'all' 
                  ? 'Start by adding your first menu item' 
                  : `No items found in ${selectedTab.toLowerCase()} category`
              }
            </p>
            <button 
              onClick={handleAddNew}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Menu Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                      {item.isVegetarian && (
                        <span className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        </span>
                      )}
                      {item.isVegan && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Vegan</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <span className="text-xl font-bold text-gray-900">₹{item.basePrice.toFixed(2)}</span>
                        {item.variants && item.variants.length > 1 && (
                          <span className="text-sm text-gray-500 ml-2">({item.variants.length} variants)</span>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Categories Display */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(item.categories || []).map((cat, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </span>
                      ))}
                    </div>

                    {/* Variants Preview */}
                    {item.variants && item.variants.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-1">Variants:</div>
                        <div className="space-y-1">
                          {item.variants.slice(0, 2).map((variant, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className={variant.isDefault ? 'font-medium' : ''}>
                                {variant.name}{variant.isDefault ? ' (Default)' : ''}
                              </span>
                              <span>₹{variant.price.toFixed(2)}</span>
                            </div>
                          ))}
                          {item.variants.length > 2 && (
                            <div className="text-xs text-gray-500">+{item.variants.length - 2} more...</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{item.university.code}</span>
                      {item.calories && <span>{item.calories} cal</span>}
                      <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => toggleItemStatus(item.id, item.isActive)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={item.isActive ? 'Disable item' : 'Enable item'}
                      >
                        {item.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit item"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => deleteItem(item.id, item.name)}
                        disabled={deleting === item.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}