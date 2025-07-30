'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Activity, AlertCircle, BarChart3, Building, ChefHat, Crown, Eye, MapPin, Plus, Search, Settings, ToggleLeft, ToggleRight, User, UserPlus, Users } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

interface University {
  id: string
  name: string
  code: string
  city: string
  isActive: boolean
  createdAt: string
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    status: string
  }>
  stats: {
    activeStudents: number
    totalOrders: number
    activeMenuItems: number
  }
  settings?: {
    cutoffHours: number
    maxAdvanceOrderDays: number
    baseTaxRate: number
  }
}

export default function SuperAdminUniversities() {
  const { data: session } = useSession()
  const router = useRouter()
    const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [newUniversity, setNewUniversity] = useState({ name: '', code: '', city: '' })
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    email: '', 
    role: 'MANAGER', 
    phone: '', 
    password: '' 
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [staffLoading, setStaffLoading] = useState(false)

  // Check if user is super admin
  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/admin')
      return
    }
    fetchUniversities()
  }, [session?.user?.role, includeInactive])

  const fetchUniversities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/universities?includeInactive=${includeInactive}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUniversities(data.universities)
        } else {
          console.error('API returned success: false', data)
          showToast({
            type: 'error',
            title: 'Data Load Error',
            message: 'Failed to load universities data'
          })
        }
      } else {
        console.error(`HTTP ${response.status}:`, response.statusText)
        if (response.status === 500) {
          showToast({
            type: 'error',
            title: 'Server Error',
            message: 'University data could not be loaded. Please refresh the page.'
          })
        } else if (response.status === 403) {
          showToast({
            type: 'error',
            title: 'Access Denied',
            message: 'Super Admin privileges required'
          })
          router.push('/admin')
        }
      }
    } catch (error) {
    console.error(error)
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load universities. Please check your connection.'
      })
    } finally {
      setLoading(false)
    }
  }

  const createUniversity = async () => {
    if (!newUniversity.name || !newUniversity.code || !newUniversity.city) {
      showToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all required fields (name, code, and city)'
      })
      return
    }

    // Validate code format (uppercase letters and numbers only, 2-10 characters)
    const codeRegex = /^[A-Z0-9]{2,10}$/
    if (!codeRegex.test(newUniversity.code)) {
      showToast({
        type: 'warning',
        title: 'Invalid Code Format',
        message: 'University code must be 2-10 characters, uppercase letters and numbers only (e.g., MIT, STAN, CTU)'
      })
      return
    }

    try {
      setCreateLoading(true)
      const response = await fetch('/api/admin/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUniversity)
      })

      const data = await response.json()
      
      if (response.ok) {
        setUniversities(prev => [data.university, ...prev])
        setShowCreateModal(false)
        setNewUniversity({ name: '', code: '', city: '' })
        showToast({
          type: 'success',
          title: 'University Created',
          message: `${data.university.name} (${data.university.code}) has been created successfully!`
        })
        
        // Avoid automatic refresh to prevent HTTP 500 error
        // The data is already updated in local state
      } else {
        // Handle specific error types
        if (data.error?.includes('code already exists')) {
          showToast({
            type: 'warning',
            title: 'Code Already Exists',
            message: `The code "${newUniversity.code}" is already taken. Please choose a different code.`
          })
        } else if (data.error?.includes('name already exists')) {
          showToast({
            type: 'warning',
            title: 'University Name Exists',
            message: 'A university with this name already exists.'
          })
        } else {
          showToast({
            type: 'error',
            title: 'Creation Failed',
            message: data.error || 'Failed to create university'
          })
        }
      }
    } catch (error) {
    console.error(error)
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create university. Please try again.'
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const toggleUniversityStatus = async (university: University) => {
    try {
      const response = await fetch(`/api/admin/universities/${university.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !university.isActive })
      })

      if (response.ok) {
        setUniversities(prev => prev.map(uni => 
          uni.id === university.id 
            ? { ...uni, isActive: !uni.isActive }
            : uni
        ))
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: `${university.name} has been ${!university.isActive ? 'activated' : 'deactivated'} successfully`
        })
      } else {
        const data = await response.json()
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: data.error || 'Failed to update university status'
        })
      }
    } catch (error) {
    console.error(error)
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to update university status. Please try again.'
      })
    }
  }

  const assignStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      showToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all required fields'
      })
      return
    }

    if (!selectedUniversity) {return}

    try {
      setStaffLoading(true)
      const response = await fetch(`/api/admin/universities/${selectedUniversity.id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update local state
        setUniversities(prev => prev.map(uni => 
          uni.id === selectedUniversity.id 
            ? { ...uni, users: [...uni.users, data.user] }
            : uni
        ))
        setShowStaffModal(false)
        setNewStaff({ name: '', email: '', role: 'MANAGER', phone: '', password: '' })
        showToast({
          type: 'success',
          title: 'Staff Assigned',
          message: `${newStaff.role.toLowerCase()} assigned to ${selectedUniversity.name} successfully!`
        })
      } else {
        showToast({
          type: 'error',
          title: 'Assignment Failed',
          message: data.error || 'Failed to assign staff'
        })
      }
    } catch (error) {
    console.error(error)
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to assign staff. Please try again.'
      })
    } finally {
      setStaffLoading(false)
    }
  }

  // Filter universities based on search
  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    uni.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    uni.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading universities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Crown className="w-6 h-6 text-purple-600 mr-2" />
              University Management
            </h1>
            <p className="text-gray-600 mt-1">Manage universities and assign staff members</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create University</span>
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search universities by name, city, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span>Include inactive</span>
          </label>
        </div>

        {/* Universities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUniversities.map((university) => (
            <div 
              key={university.id} 
              className={`bg-white rounded-xl border p-6 ${
                university.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              {/* University Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{university.name}</h3>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {university.city}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {university.code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {university.isActive ? (
                    <Activity className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-xl font-bold text-blue-600">{university.stats?.activeStudents || 0}</div>
                  <div className="text-xs text-blue-700">Students</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-xl font-bold text-green-600">{university.stats?.totalOrders || 0}</div>
                  <div className="text-xs text-green-700">Orders</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="text-xl font-bold text-orange-600">{university.stats?.activeMenuItems || 0}</div>
                  <div className="text-xs text-orange-700">Menu Items</div>
                </div>
              </div>

              {/* Staff */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Staff Members</h4>
                <div className="space-y-1">
                  {university.users.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No staff assigned</p>
                  ) : (
                    university.users.slice(0, 2).map((user) => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{user.name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'MANAGER' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'MANAGER' ? (
                            <Crown className="w-3 h-3 inline mr-1" />
                          ) : (
                            <ChefHat className="w-3 h-3 inline mr-1" />
                          )}
                          {user.role}
                        </span>
                      </div>
                    ))
                  )}
                  {university.users.length > 2 && (
                    <p className="text-xs text-gray-500">+{university.users.length - 2} more</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleUniversityStatus(university)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium ${
                    university.isActive
                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                >
                  {university.isActive ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Activate</span>
                    </>
                  )}
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUniversity(university)
                      setShowStaffModal(true)
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 text-purple-700 bg-purple-100 hover:bg-purple-200 rounded text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Staff</span>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/admin/universities/${university.id}`)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUniversities.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No universities found</p>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search criteria
              </p>
            )}
          </div>
        )}
      </div>

      {/* Create University Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold">Create New University</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University Name *
                </label>
                <input
                  type="text"
                  value={newUniversity.name}
                  onChange={(e) => setNewUniversity(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Harvard University"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University Code *
                </label>
                <input
                  type="text"
                  value={newUniversity.code}
                  onChange={(e) => setNewUniversity(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                    newUniversity.code && !/^[A-Z0-9]{2,10}$/.test(newUniversity.code)
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="e.g., MIT, STAN, CTU, HARVARD"
                  maxLength={10}
                />
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-500">
                    2-10 characters, uppercase letters and numbers only
                  </p>
                  {newUniversity.code && !/^[A-Z0-9]{2,10}$/.test(newUniversity.code) && (
                    <p className="text-xs text-red-600">
                      ⚠️ Invalid format - use only uppercase letters and numbers (2-10 chars)
                    </p>
                  )}
                  <p className="text-xs text-blue-600">
                    💡 Examples: MIT, STAN, HARVARD, CTU, OXFORD, CMU2024
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={newUniversity.city}
                  onChange={(e) => setNewUniversity(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Cambridge"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createUniversity}
                disabled={createLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {createLoading ? 'Creating...' : 'Create University'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showStaffModal && selectedUniversity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Assign Staff to {selectedUniversity.name}
            </h3>
            
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
                onClick={() => setShowStaffModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={assignStaff}
                disabled={staffLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {staffLoading ? 'Assigning...' : 'Assign Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 