'use client'

import { AlertTriangle, Check, CheckCircle, ChefHat, Clock, Crown, Filter, Mail, Phone, RefreshCw, Search, User, X, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import { useSession } from 'next-auth/react'

interface UserData {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  studentId?: string
  roomNumber?: string
  course?: string
  year?: number
  university: {
    id: string
    name: string
    code: string
  }
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
type FilterRole = 'all' | 'STUDENT' | 'ADMIN' | 'CATERER'

export default function AdminUsers() {
  const [selectedStatusTab, setSelectedStatusTab] = useState<FilterStatus>('PENDING')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<FilterRole>('all')
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [processingUser, setProcessingUser] = useState<string | null>(null)
  const { notifications, addNotification, removeNotification } = useNotifications()
  const session = useSession()

  useEffect(() => {
    fetchUsers()
    
    // Show role-based header message
    if (session?.data?.user?.role === 'ADMIN') {
      console.log('Super Admin: Can manage all universities')
    } else if (session?.data?.user?.role === 'MANAGER') {
      console.log('Manager: Can manage university students')
    }
  }, [session?.data?.user?.role])

  const applyFilters = () => {
    let filtered = [...users]

    // Apply status filter
    if (selectedStatusTab !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatusTab)
    }

    // Apply role filter
    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRoleFilter)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.studentId?.toLowerCase().includes(query) ||
        user.roomNumber?.toLowerCase().includes(query) ||
        user.course?.toLowerCase().includes(query) ||
        user.university.name.toLowerCase().includes(query) ||
        user.university.code.toLowerCase().includes(query)
      )
    }

    setFilteredUsers(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [users, selectedStatusTab, selectedRoleFilter, searchQuery, applyFilters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        console.error('Error fetching users:', data.error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to fetch users'
        })
      }
    } catch (error) {
    console.error(error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch users'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshUsers = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
    addNotification({
      type: 'success',
      title: 'Refreshed',
      message: 'User list updated'
    })
  }

  const updateUserStatus = async (userId: string, status: string, reason?: string) => {
    try {
      setProcessingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      })

      if (response.ok) {
        await fetchUsers()
        addNotification({
          type: 'success',
          title: 'Success',
          message: `User ${status.toLowerCase()} successfully`
        })
      } else {
        const data = await response.json()
        addNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to update user status'
        })
      }
    } catch (error) {
    console.error(error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user status'
      })
    } finally {
      setProcessingUser(null)
    }
  }

  const approveUser = (userId: string) => {
    updateUserStatus(userId, 'APPROVED')
  }

  const rejectUser = (userId: string, reason = 'Registration rejected by admin') => {
    updateUserStatus(userId, 'REJECTED', reason)
  }

  const suspendUser = (userId: string) => {
    updateUserStatus(userId, 'SUSPENDED')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      case 'SUSPENDED': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200'
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200'
      case 'SUSPENDED': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'text-blue-600 bg-blue-50'
      case 'ADMIN': return 'text-purple-600 bg-purple-50'
      case 'CATERER': return 'text-green-600 bg-green-50'
      case 'MANAGER': return 'text-indigo-600 bg-indigo-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-3 h-3" />
      case 'MANAGER': return <Crown className="w-3 h-3" />
      case 'CATERER': return <ChefHat className="w-3 h-3" />
      case 'STUDENT': return <User className="w-3 h-3" />
      default: return <User className="w-3 h-3" />
    }
  }

  const calculateStats = () => {
    const pending = users.filter(user => user.status === 'PENDING').length
    const approved = users.filter(user => user.status === 'APPROVED').length
    const rejected = users.filter(user => user.status === 'REJECTED').length
    const suspended = users.filter(user => user.status === 'SUSPENDED').length
    
    return { pending, approved, rejected, suspended }
  }

  const stats = calculateStats()

  const statusTabs = [
    { key: 'PENDING' as FilterStatus, label: 'Pending', count: stats.pending, color: 'orange' },
    { key: 'APPROVED' as FilterStatus, label: 'Approved', count: stats.approved, color: 'green' },
    { key: 'REJECTED' as FilterStatus, label: 'Rejected', count: stats.rejected, color: 'red' },
    { key: 'SUSPENDED' as FilterStatus, label: 'Suspended', count: stats.suspended, color: 'yellow' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationSystem />
      
      {/* Main Container with proper padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <div className="flex items-center gap-2 mt-2">
                {session?.data?.user?.role === 'ADMIN' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    👑 Super Admin - All Universities
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🎯 University Manager - Your Students
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {filteredUsers.length} student{filteredUsers.length !== 1 ? 's' : ''} total
                </p>
                <p className="text-xs text-gray-400">
                  {filteredUsers.filter(u => u.status === 'PENDING').length} pending approval
                </p>
              </div>
              <button
                onClick={refreshUsers}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, student ID, room, course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value as FilterRole)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="MANAGER">Managers</option>
              <option value="ADMIN">Admins</option>
              <option value="CATERER">Caterers</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex space-x-2 overflow-x-auto">
            {statusTabs.map(tab => (
              <button 
                key={tab.key}
                onClick={() => setSelectedStatusTab(tab.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatusTab === tab.key 
                    ? `bg-${tab.color}-600 text-white` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No matching users found' : `No ${selectedStatusTab.toLowerCase()} users`}
              </h3>
              <p className="text-sm text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : `${selectedStatusTab} users will appear here`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.studentId && (
                            <div className="flex items-center">
                              <span className="font-medium">ID:</span>
                              <span className="ml-1">{user.studentId}</span>
                            </div>
                          )}
                          {user.roomNumber && (
                            <div className="flex items-center">
                              <span className="font-medium">Room:</span>
                              <span className="ml-1">{user.roomNumber}</span>
                            </div>
                          )}
                          {user.course && (
                            <div className="flex items-center">
                              <span className="font-medium">Course:</span>
                              <span className="ml-1">{user.course}</span>
                            </div>
                          )}
                          {user.year && (
                            <div className="flex items-center">
                              <span className="font-medium">Year:</span>
                              <span className="ml-1">{user.year}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              <span className="text-xs">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{user.university.name}</div>
                          <div className="text-gray-500">({user.university.code})</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                          {getStatusIcon(user.status)}
                          <span className="ml-1">{user.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</div>
                        <div className="text-xs">{format(new Date(user.createdAt), 'h:mm a')}</div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-green-600">
                            Last: {format(new Date(user.lastLoginAt), 'MMM dd')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {user.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => approveUser(user.id)}
                                disabled={processingUser === user.id}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => rejectUser(user.id)}
                                disabled={processingUser === user.id}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {user.status === 'APPROVED' && (
                            <button
                              onClick={() => suspendUser(user.id)}
                              disabled={processingUser === user.id}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center disabled:opacity-50"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Suspend
                            </button>
                          )}

                          {(user.status === 'REJECTED' || user.status === 'SUSPENDED') && (
                            <button
                              onClick={() => approveUser(user.id)}
                              disabled={processingUser === user.id}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                            className="bg-gray-100 text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Mail className="w-3 h-3" />
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
    </div>
  )
} 