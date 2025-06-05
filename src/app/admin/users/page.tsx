'use client'

import { Search, Filter, CheckCircle, XCircle, Clock, Eye, User, Mail, Phone, RefreshCw, Check, X, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import BottomNavigation from '@/components/BottomNavigation'
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
      console.log('University Manager: Managing your university students')
    }
  }, [session])

  useEffect(() => {
    filterUsers()
  }, [users, selectedStatusTab, selectedRoleFilter, searchQuery])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load users'
      })
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by status
    if (selectedStatusTab !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatusTab)
    }

    // Filter by role
    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRoleFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.studentId?.toLowerCase().includes(query) ||
        user.roomNumber?.toLowerCase().includes(query) ||
        user.course?.toLowerCase().includes(query)
      )
    }

    setFilteredUsers(filtered)
  }

  const updateUserStatus = async (userId: string, newStatus: string, rejectionReason?: string) => {
    try {
      setProcessingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          rejectionReason
        })
      })

      if (response.ok) {
        const { user: updatedUser } = await response.json()
        setUsers(users.map(user => 
          user.id === userId ? updatedUser : user
        ))
        
        const statusMessages = {
          'APPROVED': 'User approved successfully',
          'REJECTED': 'User registration rejected',
          'SUSPENDED': 'User suspended',
          'PENDING': 'User status reset to pending'
        }

        addNotification({
          type: newStatus === 'APPROVED' ? 'success' : 'warning',
          title: 'User Status Updated',
          message: statusMessages[newStatus as keyof typeof statusMessages] || 'User status updated'
        })
      } else {
        throw new Error('Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user:', error)
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
      default: return 'text-gray-600 bg-gray-50'
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
    <div className="min-h-screen bg-white pb-20">
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <div className="flex items-center gap-2 mt-1">
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
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {filteredUsers.length} student{filteredUsers.length !== 1 ? 's' : ''} total
            </p>
            <p className="text-xs text-gray-400">
              {filteredUsers.filter(u => u.status === 'PENDING').length} pending approval
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex space-x-2">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value as FilterRole)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="ADMIN">Admins</option>
            <option value="CATERER">Caterers</option>
          </select>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-lg font-bold text-orange-600">{stats.pending}</div>
            <div className="text-xs text-orange-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="text-lg font-bold text-green-600">{stats.approved}</div>
            <div className="text-xs text-green-600">Approved</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="text-lg font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-red-600">Rejected</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="text-lg font-bold text-yellow-600">{stats.suspended}</div>
            <div className="text-xs text-yellow-600">Suspended</div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-4">
          {statusTabs.map(tab => (
            <button 
              key={tab.key}
              onClick={() => setSelectedStatusTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatusTab === tab.key 
                  ? `bg-${tab.color}-600 text-white` 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Users List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
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
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                {/* User Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      <span>{user.status}</span>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  {user.studentId && (
                    <div>
                      <span className="text-gray-500">Student ID:</span>
                      <span className="ml-2 font-medium">{user.studentId}</span>
                    </div>
                  )}
                  {user.roomNumber && (
                    <div>
                      <span className="text-gray-500">Room:</span>
                      <span className="ml-2 font-medium">{user.roomNumber}</span>
                    </div>
                  )}
                  {user.course && (
                    <div>
                      <span className="text-gray-500">Course:</span>
                      <span className="ml-2 font-medium">{user.course}</span>
                    </div>
                  )}
                  {user.year && (
                    <div>
                      <span className="text-gray-500">Year:</span>
                      <span className="ml-2 font-medium">{user.year}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 font-medium">{user.phone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">University:</span>
                    <span className="ml-2 font-medium">{user.university.name}</span>
                  </div>
                </div>

                {/* Registration Date */}
                <div className="text-xs text-gray-500 mb-3">
                  Registered {format(new Date(user.createdAt), 'MMM dd, yyyy h:mm a')}
                  {user.lastLoginAt && (
                    <span className="ml-4">
                      Last login {format(new Date(user.lastLoginAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {user.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => approveUser(user.id)}
                        disabled={processingUser === user.id}
                        className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => rejectUser(user.id)}
                        disabled={processingUser === user.id}
                        className="flex-1 bg-red-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  {user.status === 'APPROVED' && (
                    <button
                      onClick={() => suspendUser(user.id)}
                      disabled={processingUser === user.id}
                      className="flex-1 bg-yellow-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Suspend
                    </button>
                  )}

                  {(user.status === 'REJECTED' || user.status === 'SUSPENDED') && (
                    <button
                      onClick={() => approveUser(user.id)}
                      disabled={processingUser === user.id}
                      className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Reactivate
                    </button>
                  )}

                  <button
                    onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                    className="bg-gray-100 text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
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