'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Building, Building2, Calendar, Check, ChefHat, Crown, Edit, Mail, MapPin, Phone, Plus, Save, Settings, Trash2, User, UserPlus, Users, X } from 'lucide-react'

interface University {
  id: string
  name: string
  code: string
  city: string
  isActive: boolean
  createdAt: string
  settings: {
    cutoffHours: number
    maxAdvanceOrderDays: number
    minAdvanceOrderHours: number
    allowWeekendOrders: boolean
    baseTaxRate: number
    serviceTaxRate: number
  }
  stats: {
    activeStudents: number
    totalOrders: number
    activeMenuItems: number
  }
  users: Array<{
    id: string
    name: string
    email: string
    phone?: string
    role: 'MANAGER' | 'CATERER'
    status: string
    createdAt: string
  }>
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  university?: {
    id: string
    name: string
  }
}

export default function UniversityDetailsPage() {
  const params = useParams()
  const universityId = params.id as string
  const router = useRouter()

  const [university, setUniversity] = useState<University | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'CATERER'>('MANAGER')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [createStaffLoading, setCreateStaffLoading] = useState(false)
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    email: '', 
    role: 'MANAGER', 
    phone: '', 
    password: '' 
  })

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    city: '',
    isActive: true,
    settings: {
      cutoffHours: 22,
      maxAdvanceOrderDays: 7,
      minAdvanceOrderHours: 12,
      allowWeekendOrders: true,
      baseTaxRate: 0.0,
      serviceTaxRate: 0.0
    }
  })

  // Fetch university details with useCallback to prevent infinite re-renders
  const fetchUniversity = useCallback(async () => {
    if (!universityId) {return}
    
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/admin/universities/${universityId}`)
      const data = await response.json()

      if (response.ok) {
        setUniversity(data.university)
        setEditForm({
          name: data.university.name,
          code: data.university.code,
          city: data.university.city,
          isActive: data.university.isActive,
          settings: data.university.settings
        })
      } else {
        setError(data.error || 'Failed to fetch university')
      }
    } catch (err) {
      setError('Failed to fetch university')
    } finally {
      setLoading(false)
    }
  }, [universityId])

  // Fetch available users for staff assignment
  const fetchAvailableUsers = useCallback(async () => {
    try {
      setLoadingUsers(true)
      console.log('🔍 Fetching available users...')
      const response = await fetch('/api/admin/users?role=MANAGER,CATERER&status=APPROVED')
      const data = await response.json()

      console.log('📊 API Response:', {
        status: response.status,
        ok: response.ok,
        data: data
      })

      if (response.ok) {
        const users = data.users || data || []
        console.log('✅ Available users found:', users.length)
        setAvailableUsers(users)
      } else {
        console.error('❌ API Error:', data.error)
        setError(data.error || 'Failed to fetch available users')
      }
    } catch (err) {
      console.error('❌ Failed to fetch available users:', err)
      setError('Failed to fetch available users')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  // Update university details
  const handleUpdateUniversity = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/universities/${universityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (response.ok) {
        setUniversity(data.university)
        setEditMode(false)
        setError('')
      } else {
        setError(data.error || 'Failed to update university')
      }
    } catch (err) {
      setError('Failed to update university')
    } finally {
      setSaving(false)
    }
  }

  // Assign user to university
  const handleAssignUser = async (userId: string) => {
    try {
      console.log('🔄 Assigning user:', { userId, role: selectedRole, universityId })
      const response = await fetch(`/api/admin/universities/${universityId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: selectedRole }),
      })

      const data = await response.json()

      console.log('📊 Assign User Response:', {
        status: response.status,
        ok: response.ok,
        data: data
      })

      if (response.ok) {
        console.log('✅ User assigned successfully')
        void fetchUniversity()
        setShowAddStaffModal(false)
        void fetchAvailableUsers()
        setError('') // Clear any previous errors
      } else {
        console.error('❌ Assignment failed:', data.error)
        setError(data.error || 'Failed to assign user')
      }
    } catch (err) {
      console.error('❌ Assignment error:', err)
      setError('Failed to assign user')
    }
  }

  // Remove user from university
  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/universities/${universityId}/staff`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (response.ok) {
        void fetchUniversity()
        void fetchAvailableUsers()
      } else {
        setError(data.error || 'Failed to remove user')
      }
    } catch (err) {
      setError('Failed to remove user')
    }
  }

  // Create new staff member
  const handleCreateStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setCreateStaffLoading(true)
      const response = await fetch(`/api/admin/universities/${universityId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaff),
      })

      const data = await response.json()

      if (response.ok) {
        void fetchUniversity()
        setShowCreateStaffModal(false)
        setNewStaff({ name: '', email: '', role: 'MANAGER', phone: '', password: '' })
        setError('')
      } else {
        setError(data.error || 'Failed to create staff member')
      }
    } catch (err) {
      setError('Failed to create staff member')
    } finally {
      setCreateStaffLoading(false)
    }
  }

  // Cancel edit mode with proper state reset
  const cancelEdit = useCallback(() => {
    if (university) {
      setEditMode(false)
      setEditForm({
        name: university.name,
        code: university.code,
        city: university.city,
        isActive: university.isActive,
        settings: university.settings
      })
      setError('')
    }
  }, [university])

  // Load university data on mount and when universityId changes
  useEffect(() => {
    void fetchUniversity()
  }, [fetchUniversity])

  const managers = university?.users?.filter(user => user.role === 'MANAGER') || []
  const caterers = university?.users?.filter(user => user.role === 'CATERER') || []

  // Show loading state without flickering
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !university) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                setError('')
                void fetchUniversity()
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {university?.name}
                </h1>
                <p className="text-gray-600">University Details & Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleUpdateUniversity()}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - University Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      University Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        University Code
                      </label>
                      <input
                        type="text"
                        value={editForm.code}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">University is Active</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Name</span>
                    <span className="text-gray-900">{university?.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Code</span>
                    <span className="text-gray-900 font-mono">{university?.code}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">City</span>
                    <span className="text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {university?.city}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      university?.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {university?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <span className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(university?.createdAt || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Order Settings
              </h2>
              
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cutoff Hours (24h format)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={editForm.settings.cutoffHours}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          settings: { ...editForm.settings, cutoffHours: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Advance Order Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editForm.settings.maxAdvanceOrderDays}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          settings: { ...editForm.settings, maxAdvanceOrderDays: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Advance Order Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={editForm.settings.minAdvanceOrderHours}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        settings: { ...editForm.settings, minAdvanceOrderHours: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.settings.allowWeekendOrders}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          settings: { ...editForm.settings, allowWeekendOrders: e.target.checked }
                        })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Allow Weekend Orders</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={editForm.settings.baseTaxRate}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          settings: { ...editForm.settings, baseTaxRate: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
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
                        value={editForm.settings.serviceTaxRate}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          settings: { ...editForm.settings, serviceTaxRate: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Cutoff Time</span>
                      <p className="text-gray-900">{university?.settings?.cutoffHours || 22}:00</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Max Advance Days</span>
                      <p className="text-gray-900">{university?.settings?.maxAdvanceOrderDays || 7} days</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Min Advance Hours</span>
                      <p className="text-gray-900">{university?.settings?.minAdvanceOrderHours || 12} hours</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Weekend Orders</span>
                      <p className="text-gray-900">
                        {university?.settings?.allowWeekendOrders ? 'Allowed' : 'Not Allowed'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Base Tax</span>
                      <p className="text-gray-900">{university?.settings?.baseTaxRate || 0}%</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500">Service Tax</span>
                      <p className="text-gray-900">{university?.settings?.serviceTaxRate || 0}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Staff */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Active Students</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {university?.stats?.activeStudents || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Orders</span>
                  <span className="text-2xl font-bold text-green-600">
                    {university?.stats?.totalOrders || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Menu Items</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {university?.stats?.activeMenuItems || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Management */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Staff Management
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowAddStaffModal(true)
                      void fetchAvailableUsers()
                    }}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Staff
                  </button>
                  <button
                    onClick={() => setShowCreateStaffModal(true)}
                    className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create New
                  </button>
                </div>
              </div>

              {/* Managers */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Crown className="w-4 h-4 mr-1 text-yellow-500" />
                  Managers ({managers.length})
                </h3>
                
                {managers.length > 0 ? (
                  <div className="space-y-2">
                    {managers.map((manager) => (
                      <div key={manager.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{manager.name}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {manager.email}
                          </p>
                          {manager.phone && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {manager.phone}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => void handleRemoveUser(manager.id)}
                          className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No managers assigned</p>
                )}
              </div>

              {/* Caterers */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <ChefHat className="w-4 h-4 mr-1 text-blue-500" />
                  Caterers ({caterers.length})
                </h3>
                
                {caterers.length > 0 ? (
                  <div className="space-y-2">
                    {caterers.map((caterer) => (
                      <div key={caterer.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{caterer.name}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {caterer.email}
                          </p>
                          {caterer.phone && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {caterer.phone}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => void handleRemoveUser(caterer.id)}
                          className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No caterers assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Add Staff Member</h2>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRole('MANAGER')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      selectedRole === 'MANAGER'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <Crown className="w-4 h-4 mx-auto mb-1" />
                    Manager
                  </button>
                  <button
                    onClick={() => setSelectedRole('CATERER')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      selectedRole === 'CATERER'
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <ChefHat className="w-4 h-4 mx-auto mb-1" />
                    Caterer
                  </button>
                </div>
              </div>

              {/* Available Users */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Available {selectedRole === 'MANAGER' ? 'Managers' : 'Caterers'}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Users can be reassigned between universities. Already assigned users are shown in green.
                </p>
                
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableUsers
                      .filter(user => user.role === selectedRole)
                      .map((user) => {
                        const isCurrentlyAssigned = user.university?.id === universityId
                        const canAssign = !isCurrentlyAssigned
                        
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              isCurrentlyAssigned ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {user.university && (
                                <p className={`text-xs ${
                                  isCurrentlyAssigned ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {isCurrentlyAssigned ? 'Already assigned to this university' : `Currently at: ${user.university.name}`}
                                </p>
                              )}
                            </div>
                            {canAssign ? (
                              <button
                                onClick={() => void handleAssignUser(user.id)}
                                className="ml-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                              >
                                {user.university ? 'Reassign' : 'Assign'}
                              </button>
                            ) : (
                              <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                                Assigned
                              </span>
                            )}
                          </div>
                        )
                      })}
                    
                    {availableUsers.filter(user => user.role === selectedRole).length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No {selectedRole === 'MANAGER' ? 'managers' : 'caterers'} found
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Staff Modal */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create New Staff Member</h2>
              <button
                onClick={() => setShowCreateStaffModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="john@university.edu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="MANAGER">Manager</option>
                  <option value="CATERER">Caterer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="+1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Temporary password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Staff member should change this password after first login
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateStaffModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateStaff()}
                disabled={createStaffLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {createStaffLoading ? 'Creating...' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 