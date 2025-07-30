'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertCircle, ArrowLeft, Building, Calendar, Check, Clock, DollarSign, Mail, Phone, Save, Settings } from 'lucide-react'

interface UniversitySettings {
  cutoffHours: number
  maxAdvanceOrderDays: number
  minAdvanceOrderHours: number
  allowWeekendOrders: boolean
  baseTaxRate: number
  serviceTaxRate: number
  additionalTaxes: Array<{
    name: string
    rate: number
  }> | null
  contactEmail: string | null
  contactPhone: string | null
}

interface University {
  id: string
  name: string
  code: string
  city: string
  isActive: boolean
  settings: UniversitySettings
}

export default function UniversitySettings() {
  const params = useParams()
    const { data: session } = useSession()
  const router = useRouter()
  const [university, setUniversity] = useState<University | null>(null)
  const [settings, setSettings] = useState<UniversitySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newTax, setNewTax] = useState({ name: '', rate: 0 })

  useEffect(() => {
    if (params.id) {
      void fetchUniversitySettings()
    }
  }, [params.id])

  const fetchUniversitySettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/universities/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUniversity(data.university)
          setSettings(data.university.settings)
        }
      }
    } catch (error) {
    console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async () => {
    if (!settings) {return}

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/universities/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update settings')
      }
    } catch (error) {
    console.error(error)
      alert('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const addAdditionalTax = () => {
    if (!newTax.name || newTax.rate <= 0) {
      alert('Please enter a valid tax name and rate')
      return
    }

    setSettings(prev => ({
      ...prev!,
      additionalTaxes: [
        ...(prev?.additionalTaxes || []),
        { ...newTax }
      ]
    }))
    setNewTax({ name: '', rate: 0 })
  }

  const removeAdditionalTax = (index: number) => {
    setSettings(prev => ({
      ...prev!,
      additionalTaxes: prev?.additionalTaxes?.filter((_, i) => i !== index) || null
    }))
  }

  const formatTime = (hours: number) => {
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:00 ${period}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!university || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">University not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building className="w-6 h-6 text-purple-600 mr-2" />
                University Settings
              </h1>
              <p className="text-gray-600">{university.name} ({university.code})</p>
            </div>
          </div>
          <button
            onClick={() => void updateSettings()}
            disabled={saving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
              saved 
                ? 'bg-green-600 text-white' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Ordering Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Ordering Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Cutoff Time
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={settings.cutoffHours}
                  onChange={(e) => setSettings(prev => ({
                    ...prev!,
                    cutoffHours: parseInt(e.target.value)
                  }))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded">
                  {formatTime(settings.cutoffHours)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Students cannot place orders after this time
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Advance Ordering Days
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.maxAdvanceOrderDays}
                onChange={(e) => setSettings(prev => ({
                  ...prev!,
                  maxAdvanceOrderDays: parseInt(e.target.value)
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many days in advance students can order
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Advance Hours
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={settings.minAdvanceOrderHours}
                onChange={(e) => setSettings(prev => ({
                  ...prev!,
                  minAdvanceOrderHours: parseInt(e.target.value)
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum hours before meal time to place order
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="weekendOrders"
                checked={settings.allowWeekendOrders}
                onChange={(e) => setSettings(prev => ({
                  ...prev!,
                  allowWeekendOrders: e.target.checked
                }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="weekendOrders" className="text-sm font-medium text-gray-700">
                Allow Weekend Orders
              </label>
            </div>
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Tax Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.baseTaxRate * 100}
                onChange={(e) => setSettings(prev => ({
                  ...prev!,
                  baseTaxRate: parseFloat(e.target.value) / 100
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Primary tax rate (e.g., VAT, GST)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.serviceTaxRate * 100}
                onChange={(e) => setSettings(prev => ({
                  ...prev!,
                  serviceTaxRate: parseFloat(e.target.value) / 100
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Additional service tax rate
              </p>
            </div>
          </div>

          {/* Additional Taxes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Taxes</h3>
            
            {settings.additionalTaxes && settings.additionalTaxes.length > 0 && (
              <div className="space-y-2 mb-4">
                {settings.additionalTaxes.map((tax, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{tax.name}</span>
                      <span className="text-gray-600 ml-2">{(tax.rate * 100).toFixed(2)}%</span>
                    </div>
                    <button
                      onClick={() => removeAdditionalTax(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Tax name (e.g., City Tax)"
                value={newTax.name}
                onChange={(e) => setNewTax(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Rate %"
                step="0.01"
                value={newTax.rate || ''}
                onChange={(e) => setNewTax(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => void addAdditionalTax()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev!,
                  contactEmail: e.target.value || null
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="contact@university.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Contact Phone
              </label>
              <input
                type="tel"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev!,
                  contactPhone: e.target.value || null
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+1234567890"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Settings Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Cutoff Time:</strong> {formatTime(settings.cutoffHours)}</p>
              <p><strong>Advance Ordering:</strong> {settings.maxAdvanceOrderDays} days</p>
              <p><strong>Minimum Notice:</strong> {settings.minAdvanceOrderHours} hours</p>
            </div>
            <div>
              <p><strong>Base Tax:</strong> {(settings.baseTaxRate * 100).toFixed(2)}%</p>
              <p><strong>Service Tax:</strong> {(settings.serviceTaxRate * 100).toFixed(2)}%</p>
              <p><strong>Weekend Orders:</strong> {settings.allowWeekendOrders ? 'Allowed' : 'Not Allowed'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 