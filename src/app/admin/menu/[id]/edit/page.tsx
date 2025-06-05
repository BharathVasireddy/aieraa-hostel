'use client'

import { ArrowLeft, Save, RefreshCw, Building } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'

interface University {
  id: string
  name: string
  code: string
  address?: string
  contactInfo?: string
  isActive: boolean
}

interface MenuItemVariant {
  id?: string
  name: string
  price: string
  isDefault: boolean
  isActive: boolean
}

interface MenuItemFormData {
  name: string
  description: string
  basePrice: string
  categories: string[]
  isVegetarian: boolean
  isVegan: boolean
  image: string
  universityId: string
  variants: MenuItemVariant[]
}

export default function EditMenuItemPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string
  
  const [universities, setUniversities] = useState<University[]>([])
  const [currentUserData, setCurrentUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    basePrice: '',
    categories: [],
    isVegetarian: false,
    isVegan: false,
    image: '',
    universityId: '',
    variants: []
  })

  const categoryOptions = [
    { value: 'BREAKFAST', label: '🌅 Breakfast', emoji: '🌅' },
    { value: 'LUNCH', label: '🍽️ Lunch', emoji: '🍽️' },
    { value: 'DINNER', label: '🌙 Dinner', emoji: '🌙' },
    { value: 'SNACKS', label: '🥨 Snacks', emoji: '🥨' },
    { value: 'BEVERAGES', label: '☕ Beverages', emoji: '☕' }
  ]

  useEffect(() => {
    if (session?.user && itemId) {
      fetchCurrentUser()
      fetchUniversities()
      fetchMenuItem()
    }
  }, [session, itemId])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/admin/profile')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserData(data.profile)
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
      }
    } catch (error) {
      console.error('Failed to fetch universities:', error)
    }
  }

  const fetchMenuItem = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/menu/${itemId}`)
      if (response.ok) {
        const item = await response.json()
        setFormData({
          name: item.name,
          description: item.description || '',
          basePrice: item.basePrice?.toString() || item.price?.toString() || '',
          categories: item.categories || [item.category],
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          image: item.image || '',
          universityId: item.university.id,
          variants: item.variants?.length > 0 ? item.variants.map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price.toString(),
            isDefault: variant.isDefault,
            isActive: variant.isActive
          })) : [
            { name: 'Regular', price: item.price?.toString() || '', isDefault: true, isActive: true }
          ]
        })
      } else {
        console.error('Failed to fetch menu item')
        router.push('/admin/menu')
      }
    } catch (error) {
      console.error('Failed to fetch menu item:', error)
      router.push('/admin/menu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validate variants
      if (formData.variants.length === 0) {
        alert('Please add at least one variant')
        setSaving(false)
        return
      }

      // Ensure at least one variant is set as default
      const hasDefault = formData.variants.some(v => v.isDefault)
      if (!hasDefault) {
        formData.variants[0].isDefault = true
      }

      const submitData = {
        name: formData.name,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        categories: formData.categories,
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        image: formData.image,
        variants: formData.variants.map(variant => ({
          id: variant.id,
          name: variant.name,
          price: parseFloat(variant.price),
          isDefault: variant.isDefault,
          isActive: variant.isActive
        }))
      }

      const response = await fetch(`/api/admin/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push('/admin/menu')
      } else {
        const error = await response.json()
        console.error('Update failed:', error)
        alert(error.error || 'Failed to update menu item')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update menu item')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/menu')
  }

  const handleCategoryToggle = (categoryValue: string) => {
    const updatedCategories = formData.categories.includes(categoryValue)
      ? formData.categories.filter(cat => cat !== categoryValue)
      : [...formData.categories, categoryValue]
    
    // Ensure at least one category is selected
    if (updatedCategories.length > 0) {
      setFormData({ ...formData, categories: updatedCategories })
    }
  }

  const addVariant = () => {
    const newVariant: MenuItemVariant = {
      name: '',
      price: '',
      isDefault: false,
      isActive: true
    }
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant]
    })
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 1) {
      alert('At least one variant is required')
      return
    }
    
    const updatedVariants = formData.variants.filter((_, i) => i !== index)
    
    // If we removed the default variant, make the first one default
    if (formData.variants[index].isDefault && updatedVariants.length > 0) {
      updatedVariants[0].isDefault = true
    }
    
    setFormData({
      ...formData,
      variants: updatedVariants
    })
  }

  const updateVariant = (index: number, field: keyof MenuItemVariant, value: any) => {
    const updatedVariants = [...formData.variants]
    
    // If setting this variant as default, unset others
    if (field === 'isDefault' && value === true) {
      updatedVariants.forEach((variant, i) => {
        if (i !== index) variant.isDefault = false
      })
    }
    
    updatedVariants[index] = { ...updatedVariants[index], [field]: value }
    setFormData({
      ...formData,
      variants: updatedVariants
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader 
          title="Edit Menu Item" 
          showNotifications={false}
        />
        <div className="px-4 py-8 max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-12 rounded-lg"></div>
            <div className="bg-gray-200 h-24 rounded-lg"></div>
            <div className="bg-gray-200 h-12 rounded-lg"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Edit Menu Item" 
        showNotifications={false}
        rightElement={
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* User Role Info */}
        {currentUserData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center space-x-3">
              {currentUserData.role === 'ADMIN' ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  👑 Super Admin
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  🎯 University Manager
                </span>
              )}
              {currentUserData.university && (
                <span className="text-sm text-gray-600">
                  {currentUserData.university.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* University Display - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  University
                </label>
                <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {universities.find(uni => uni.id === formData.universityId)?.name || 'Unknown University'}
                </div>
                <p className="text-xs text-gray-500 mt-1">University cannot be changed when editing</p>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Masala Dosa, Chicken Biryani"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the item"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used if no variants are specified</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categories *</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {categoryOptions.map(option => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(option.value)}
                            onChange={() => handleCategoryToggle(option.value)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select all applicable meal categories</p>
                  </div>
                </div>
              </div>

              {/* Dietary Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Information</label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVegetarian}
                      onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div className="ml-3 flex items-center">
                      <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-sm flex items-center justify-center mr-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Vegetarian</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVegan}
                      onChange={(e) => setFormData({...formData, isVegan: e.target.checked})}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div className="ml-3 flex items-center">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full mr-2">Vegan</span>
                      <span className="text-sm font-medium text-gray-700">Vegan</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <div className="mt-3">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Product Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Product Variants</label>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Add Variant
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Variant Name *</label>
                          <input
                            type="text"
                            required
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., 250gms, Regular, Large"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={variant.isDefault}
                              onChange={(e) => updateVariant(index, 'isDefault', e.target.checked)}
                              className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">Default</span>
                          </label>
                          
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={variant.isActive}
                              onChange={(e) => updateVariant(index, 'isActive', e.target.checked)}
                              className="w-3 h-3 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-xs text-gray-600">Active</span>
                          </label>

                          {formData.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add different sizes, weights, or types for this item. Students will see these as options when ordering.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-medium"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Menu Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
} 