'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Palette, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

interface PromotionalBanner {
  id: string
  title: string
  description?: string
  image: string
  actionType: string
  actionValue?: string
  buttonText?: string
  discountPercentage?: number
  offerValidUntil?: string
  backgroundColor: string
  textColor: string
  order: number
  isActive: boolean
  createdAt: string
  createdBy: string
}

export default function PromotionalBannersPage() {
  const [banners, setBanners] = useState<PromotionalBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/promotional-banners')
      const data = await response.json()
      
      if (data.success) {
        setBanners(data.banners)
      } else {
        setError(data.error || 'Failed to fetch banners')
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      setError('Failed to fetch banners')
    } finally {
      setLoading(false)
    }
  }

  const toggleBannerStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/promotional-banners/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      const data = await response.json()
      if (data.success) {
        void fetchBanners() // Refresh the list
      } else {
        setError(data.error || 'Failed to update banner status')
      }
    } catch (error) {
      console.error('Error updating banner status:', error)
      setError('Failed to update banner status')
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) {return}

    try {
      const response = await fetch(`/api/admin/promotional-banners/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        void fetchBanners() // Refresh the list
      } else {
        setError(data.error || 'Failed to delete banner')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      setError('Failed to delete banner')
    }
  }

  const updateBannerOrder = async (id: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/admin/promotional-banners/${id}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction }),
      })

      const data = await response.json()
      if (data.success) {
        void fetchBanners() // Refresh the list
      } else {
        setError(data.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      setError('Failed to update order')
    }
  }

  const getActionTypeDisplay = (actionType: string, actionValue?: string) => {
    switch (actionType) {
      case 'menu':
        return 'Browse Menu'
      case 'category':
        return `Category: ${actionValue}`
      case 'url':
        return `External Link: ${actionValue}`
      case 'search':
        return `Search: ${actionValue}`
      case 'none':
      default:
        return 'No Action'
    }
  }

  const isExpired = (offerValidUntil?: string) => {
    if (!offerValidUntil) {return false}
    return new Date(offerValidUntil) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Banners</h1>
          <p className="text-gray-600 mt-1">Manage promotional sliders for student dashboard</p>
        </div>
        <Link
          href="/admin/promotional-banners/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Banners List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {banners.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Palette className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No promotional banners</h3>
            <p className="text-gray-600 mb-6">Create your first promotional banner to engage students</p>
            <Link
              href="/admin/promotional-banners/new"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Banner</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Banner</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Action</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Offer</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Order</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {banners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: banner.backgroundColor }}>
                          {banner.image ? (
                            <img 
                              src={banner.image} 
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs">
                              Banner
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{banner.title}</h3>
                          {banner.description && (
                            <p className="text-sm text-gray-600 truncate max-w-xs">{banner.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: banner.backgroundColor }}
                            ></div>
                            <span className="text-xs text-gray-500">{banner.backgroundColor}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="text-gray-900">{getActionTypeDisplay(banner.actionType, banner.actionValue)}</div>
                        {banner.buttonText && (
                          <div className="text-gray-600">Button: {banner.buttonText}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {banner.discountPercentage ? (
                          <div className="text-green-600 font-medium">{banner.discountPercentage}% OFF</div>
                        ) : (
                          <div className="text-gray-500">No discount</div>
                        )}
                        {banner.offerValidUntil && (
                          <div className={`text-xs ${isExpired(banner.offerValidUntil) ? 'text-red-600' : 'text-gray-600'}`}>
                            {isExpired(banner.offerValidUntil) ? 'Expired' : 'Valid until'} {new Date(banner.offerValidUntil).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleBannerStatus(banner.id, banner.isActive)}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          banner.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {banner.isActive ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-900">{banner.order}</span>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => updateBannerOrder(banner.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateBannerOrder(banner.id, 'down')}
                            disabled={index === banners.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/promotional-banners/${banner.id}/edit`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 