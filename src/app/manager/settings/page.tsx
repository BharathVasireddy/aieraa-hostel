'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Save, Check, AlertCircle } from 'lucide-react'
import { showToast, ToastContainer } from '@/components/ui/Toast'

interface UniversitySettings {
  cutoffHours: number
  maxAdvanceOrderDays: number
  minAdvanceOrderHours: number
  allowWeekendOrders: boolean
  baseTaxRate: number
  serviceTaxRate: number
}

interface University {
  id: string
  name: string
  code: string
  settings: UniversitySettings
}

export default function ManagerSettings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [university, setUniversity] = useState<University | null>(null)
  const [settings, setSettings] = useState<UniversitySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Don't redirect if session is still loading
    if (!session) return
    
    if (session.user?.role !== 'MANAGER') {
      router.push('/manager')
      return
    }
    fetchUniversitySettings()
  }, [session])

  const fetchUniversitySettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/manager/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUniversity(data.university)
          setSettings(data.university.settings)
        }
      } else {
        showToast({
          type: 'error',
          title: 'Failed to load settings'
        })
      }
    } catch (error) {
      console.error(error)
      showToast({
        type: 'error',
        title: 'Failed to load settings'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/manager/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setSaved(true)
        showToast({
          type: 'success',
          title: 'Settings updated successfully'
        })
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await response.json()
        showToast({
          type: 'error',
          title: data.error || 'Failed to update settings'
        })
      }
    } catch (error) {
      console.error(error)
      showToast({
        type: 'error',
        title: 'Failed to update settings'
      })
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (hours: number) => {
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:00 ${period}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!university || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings Not Found</h2>
          <p className="text-gray-600">Unable to load university settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/manager')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="w-6 h-6 text-green-600 mr-2" />
                Order Settings
              </h1>
              <p className="text-gray-600">{university.name} ({university.code})</p>
            </div>
          </div>
          <button
            onClick={updateSettings}
            disabled={saving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              saved 
                ? 'bg-green-600 text-white' 
                : 'bg-green-600 text-white hover:bg-green-700'
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

      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Cutoff Time Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Daily Order Cutoff</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cutoff Time for Next Day Orders
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={settings.cutoffHours}
                  onChange={(e) => setSettings(prev => ({
                    ...prev!,
                    cutoffHours: parseInt(e.target.value)
                  }))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-lg font-semibold text-green-600 bg-green-100 px-4 py-2 rounded-lg min-w-[100px] text-center">
                  {formatTime(settings.cutoffHours)}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Students cannot place orders for the next day after this time.</p>
                <p className="mt-1">
                  <strong>Current setting:</strong> Orders for tomorrow must be placed before {formatTime(settings.cutoffHours)} today.
                </p>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">How it works:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Before {formatTime(settings.cutoffHours)}: Students can order for tomorrow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>After {formatTime(settings.cutoffHours)}: Orders for tomorrow are closed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Students can still order for day after tomorrow and beyond</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Settings (Read-only for managers) */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Order Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Maximum Advance Order Days
              </label>
              <div className="text-lg font-medium text-gray-900">
                {settings.maxAdvanceOrderDays} days
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Students can order up to this many days in advance
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Minimum Advance Order Hours
              </label>
              <div className="text-lg font-medium text-gray-900">
                {settings.minAdvanceOrderHours} hours
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum time between order placement and meal date
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Weekend Orders
              </label>
              <div className="text-lg font-medium text-gray-900">
                {settings.allowWeekendOrders ? 'Allowed' : 'Not Allowed'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Whether students can order for weekends
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Tax Rate
              </label>
              <div className="text-lg font-medium text-gray-900">
                {(settings.baseTaxRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Applied to all orders
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> To modify other settings like advance days, tax rates, or weekend orders, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
} 