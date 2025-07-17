'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'

interface BannerFormData {
  title: string
  description: string
  image: string
  actionType: 'none' | 'menu' | 'category' | 'url' | 'search'
  actionValue: string
  buttonText: string
  discountPercentage: string
  offerValidUntil: string
  backgroundColor: string
  textColor: string
}

export default function NewPromotionalBannerPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    description: '',
    image: '',
    actionType: 'menu',
    actionValue: '',
    buttonText: 'Get Now',
    discountPercentage: '',
    offerValidUntil: '',
    backgroundColor: '#10B981',
    textColor: '#FFFFFF'
  })
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success && data.url) {
        setFormData(prev => ({
          ...prev,
          image: data.url
        }))
      } else {
        setError(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
        offerValidUntil: formData.offerValidUntil || undefined
      }

      const response = await fetch('/api/admin/promotional-banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()
      if (data.success) {
        router.push('/admin/promotional-banners')
      } else {
        setError(data.error || 'Failed to create banner')
      }
    } catch (error) {
      console.error('Error creating banner:', error)
      setError('Failed to create banner')
    } finally {
      setLoading(false)
    }
  }

  const getActionValuePlaceholder = () => {
    switch (formData.actionType) {
      case 'category':
        return 'e.g., BREAKFAST, LUNCH, DINNER'
      case 'url':
        return 'https://example.com'
      case 'search':
        return 'e.g., pizza, biryani'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/promotional-banners"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Promotional Banner</h1>
          <p className="text-gray-600 mt-1">Add a new promotional banner for the student dashboard</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., New Year Offer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    maxLength={200}
                    rows={3}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Brief description of the offer..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image *
                  </label>
                  <div className="space-y-3">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Banner preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {uploading ? 'Uploading...' : 'Click to upload image'}
                          </p>
                        </div>
                        
                        <div className="text-center text-sm text-gray-500">or</div>
                        
                        <input
                          type="url"
                          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                          value={formData.image || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value || '' }))}
                          autoComplete="off"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Type
                  </label>
                  <select
                    name="actionType"
                    value={formData.actionType || 'menu'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="none">No Action</option>
                    <option value="menu">Browse Menu</option>
                    <option value="category">Filter by Category</option>
                    <option value="search">Search Term</option>
                    <option value="url">External URL</option>
                  </select>
                </div>

                <div style={{ display: formData.actionType !== 'none' && formData.actionType !== 'menu' ? 'block' : 'none' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Value
                  </label>
                  <input
                    type="text"
                    name="actionValue"
                    value={formData.actionValue || ''}
                    onChange={handleInputChange}
                    autoComplete="off"
                    disabled={formData.actionType === 'none' || formData.actionType === 'menu'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={getActionValuePlaceholder()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    name="buttonText"
                    value={formData.buttonText || ''}
                    onChange={handleInputChange}
                    maxLength={50}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Get Now, Order Now"
                  />
                </div>
              </div>
            </div>

            {/* Offer Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage || ''}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="datetime-local"
                    name="offerValidUntil"
                    value={formData.offerValidUntil || ''}
                    onChange={handleInputChange}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Design & Preview */}
          <div className="space-y-6">
            {/* Design Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor || '#10B981'}
                      onChange={handleInputChange}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="backgroundColor"
                      value={formData.backgroundColor || ''}
                      onChange={handleInputChange}
                      autoComplete="off"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="#10B981"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      name="textColor"
                      value={formData.textColor || '#FFFFFF'}
                      onChange={handleInputChange}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="textColor"
                      value={formData.textColor || ''}
                      onChange={handleInputChange}
                      autoComplete="off"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              
              <div className="space-y-4">
                                 <div
                   className="rounded-2xl p-6 text-white relative overflow-hidden h-40 flex items-center"
                   style={{ 
                     backgroundColor: formData.backgroundColor || '#10B981',
                     color: formData.textColor || '#FFFFFF'
                   }}
                 >
                  {/* Background Image */}
                  {formData.image && (
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <img 
                        src={formData.image} 
                        alt="Preview"
                        className="w-full h-full object-cover opacity-20"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex-1">
                                         <div className="max-w-[60%]">
                       <h3 className="text-lg font-bold mb-2">{formData.title || 'Banner Title'}</h3>
                       {(formData.description || '').trim() && (
                         <p className="text-sm opacity-90 mb-3">
                           {formData.description}
                         </p>
                       )}
                       
                       {/* Offer Badge */}
                       {(formData.discountPercentage || '').toString().trim() && (
                         <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold mb-3">
                           {formData.discountPercentage}% OFF
                         </div>
                       )}
                       
                       {/* Action Button */}
                       <button className="bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 px-4 py-2 rounded-xl text-sm font-medium">
                         {formData.buttonText || 'Get Now'}
                       </button>
                     </div>
                  </div>

                  {/* Decorative Image */}
                  {formData.image && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-xl overflow-hidden shadow-lg">
                      <img 
                        src={formData.image} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Link
            href="/admin/promotional-banners"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.image}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Banner'}
          </button>
        </div>
      </form>
    </div>
  )
} 