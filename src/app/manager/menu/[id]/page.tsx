'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/components/UserProvider'
import StatusBadge from '@/components/ui/StatusBadge'
import { 
  ArrowLeft, 
  Edit, 
  Star,
  Leaf,
  UtensilsCrossed,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import AvailabilityModal from '@/components/manager/AvailabilityModal'

interface MenuItemVariant {
  id: string
  name: string
  price: number
  isDefault: boolean
  isActive: boolean
}

interface MenuItemAvailability {
  id: string
  date: string
  isAvailable: boolean
  maxQuantity?: number
  currentQuantity: number
}

interface MenuItemDetails {
  id: string
  name: string
  description?: string
  basePrice: number
  offerPrice?: number
  categories: string[]
  image?: string
  isVegetarian: boolean
  isVegan: boolean
  isFeatured: boolean
  isActive: boolean
  allergens: string[]
  variants: MenuItemVariant[]
  availability: MenuItemAvailability[]
  createdAt: string
  updatedAt: string
  university: {
    name: string
    code: string
  }
}

export default function MenuItemDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [menuItem, setMenuItem] = useState<MenuItemDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemDetails | null>(null)

  const menuItemId = params?.id as string

  useEffect(() => {
    if (menuItemId) {
      fetchMenuItemDetails()
    }
  }, [menuItemId])

  const fetchMenuItemDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/manager/menu/${menuItemId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu item details')
      }
      
      const data = await response.json()
      setMenuItem(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu item')
    } finally {
      setLoading(false)
    }
  }

  const toggleItemStatus = async () => {
    if (!menuItem) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/manager/menu/${menuItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !menuItem.isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update item status')
      }

      setMenuItem(prev => prev ? { ...prev, isActive: !prev.isActive } : null)
    } catch (err) {
      console.error('Failed to update item status:', err)
      alert('Failed to update item status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const toggleFeatured = async () => {
    if (!menuItem) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/manager/menu/${menuItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !menuItem.isFeatured })
      })

      if (!response.ok) {
        throw new Error('Failed to update featured status')
      }

      setMenuItem(prev => prev ? { ...prev, isFeatured: !prev.isFeatured } : null)
    } catch (err) {
      console.error('Failed to update featured status:', err)
      alert('Failed to update featured status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const vietnamDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    
    const day = vietnamDate.getDate().toString().padStart(2, '0')
    const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0')
    const year = vietnamDate.getFullYear()
    
    return `${day}/${month}/${year}`
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'BREAKFAST': 'bg-orange-100 text-orange-800',
      'LUNCH': 'bg-green-100 text-green-800',
      'DINNER': 'bg-blue-100 text-blue-800',
      'SNACKS': 'bg-purple-100 text-purple-800',
      'BEVERAGES': 'bg-pink-100 text-pink-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded mb-6"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Menu Item</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/manager/menu')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="text-center py-12">
        <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Menu Item Not Found</h2>
        <p className="text-gray-600 mb-4">The menu item you're looking for doesn't exist or you don't have access to it.</p>
        <Link
          href="/manager/menu"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/manager/menu"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{menuItem.name}</h1>
            <p className="text-gray-600">Created on {formatDate(menuItem.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={menuItem.isActive ? 'ACTIVE' : 'INACTIVE'} size="md" />
          <Link href={`/manager/menu/${menuItemId}/edit`}>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Edit className="w-4 h-4" />
              <span>Edit Item</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start space-x-6">
              {/* Image */}
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                {menuItem.image ? (
                  <img 
                    src={menuItem.image} 
                    alt={menuItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">{menuItem.name}</h2>
                      {menuItem.isFeatured && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                      {menuItem.isVegetarian && <Leaf className="w-5 h-5 text-green-500" />}
                      {menuItem.isVegan && (
                        <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">V</span>
                        </div>
                      )}
                    </div>
                    
                    {menuItem.description && (
                      <p className="text-gray-700 mb-4">{menuItem.description}</p>
                    )}

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {menuItem.categories.map((category, index) => (
                        <span 
                          key={index}
                          className={`text-sm px-3 py-1 rounded-full ${getCategoryBadgeColor(category)}`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center space-x-4">
                      {menuItem.offerPrice ? (
                        <>
                          <span className="text-xl font-bold text-green-600">
                            {formatCurrency(menuItem.offerPrice)}
                          </span>
                          <span className="text-lg text-gray-500 line-through">
                            {formatCurrency(menuItem.basePrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrency(menuItem.basePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Variants */}
          {menuItem.variants.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Variants</h3>
              <div className="space-y-3">
                {menuItem.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{variant.name}</span>
                      {variant.isDefault && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900">{formatCurrency(variant.price)}</span>
                      <StatusBadge status={variant.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allergens */}
          {menuItem.allergens.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergens</h3>
              <div className="flex flex-wrap gap-2">
                {menuItem.allergens.map((allergen, index) => (
                  <span 
                    key={index}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full"
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={toggleFeatured}
                disabled={updating}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  menuItem.isFeatured 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                <span>{menuItem.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}</span>
              </button>

              <button
                onClick={toggleItemStatus}
                disabled={updating}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  menuItem.isActive 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {updating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : menuItem.isActive ? (
                  <ToggleLeft className="w-4 h-4" />
                ) : (
                  <ToggleRight className="w-4 h-4" />
                )}
                <span>{menuItem.isActive ? 'Deactivate Item' : 'Activate Item'}</span>
              </button>
            </div>
          </div>

          {/* Item Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(menuItem.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(menuItem.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">University</span>
                <span className="text-sm font-medium text-gray-900">{menuItem.university.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Variants</span>
                <span className="text-sm font-medium text-gray-900">{menuItem.variants.length}</span>
              </div>
            </div>
          </div>

          {/* Availability Preview */}
          {menuItem.availability.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Availability</h3>
                <button
                  onClick={() => {
                    setSelectedMenuItem(menuItem)
                    setShowAvailabilityModal(true)
                  }}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Manage</span>
                </button>
              </div>
              <div className="space-y-2">
                {menuItem.availability.slice(0, 7).map((availability) => (
                  <div key={availability.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{formatDate(availability.date)}</span>
                    <StatusBadge 
                      status={availability.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} 
                      size="sm" 
                    />
                  </div>
                ))}
                {menuItem.availability.length > 7 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{menuItem.availability.length - 7} more days
                  </p>
                )}
              </div>
            </div>
          )}

          {/* If no availability set */}
          {menuItem.availability.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Availability Set</h3>
                <p className="text-gray-600 mb-4">This item doesn't have availability schedule configured.</p>
                <button
                  onClick={() => {
                    setSelectedMenuItem(menuItem)
                    setShowAvailabilityModal(true)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Set Availability</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Availability Management Modal */}
      {showAvailabilityModal && selectedMenuItem && (
        <AvailabilityModal
          menuItem={{
            id: selectedMenuItem.id,
            name: selectedMenuItem.name,
            image: selectedMenuItem.image
          }}
          onClose={() => {
            setShowAvailabilityModal(false)
            setSelectedMenuItem(null)
          }}
          onSave={() => {
            fetchMenuItemDetails() // Refresh the details
            setShowAvailabilityModal(false)
            setSelectedMenuItem(null)
          }}
        />
      )}
    </div>
  )
} 