'use client'

import { Bell, Clock, CreditCard, Settings, LogOut, Users, ChefHat, Package, User, Shield, Activity, Edit3, AlertTriangle } from 'lucide-react'
import BottomNavigation from '@/components/BottomNavigation'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface DashboardStats {
  activeStudents: number
  menuItems: number
  pendingOrders: number
  uptime: number
}

export default function ManagerSettings() {
  const router = useRouter()
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: 0,
    menuItems: 0,
    pendingOrders: 0,
    uptime: 98
  })
  const [loading, setLoading] = useState(true)
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false)
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false)
  const [logoutReason, setLogoutReason] = useState('')

  useEffect(() => {
    if (session?.user) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      // Fetch dashboard statistics
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setStats({
          activeStudents: data.approvedStudents || 0,
          menuItems: data.menuItems || 0,
          pendingOrders: data.pendingOrders || 0,
          uptime: 98 // Mock uptime
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await signOut({ callbackUrl: '/auth/signin' })
    }
  }

  const handleEditProfile = () => {
    router.push('/admin/profile')
  }

  const handleChangePassword = () => {
    router.push('/admin/profile?tab=security')
  }

  const handleActivityLog = () => {
    router.push('/admin/profile?tab=activity')
  }

  const handleHomepageConfig = () => {
    router.push('/admin/settings/homepage')
  }

  const handleOrderCutoffConfig = () => {
    // Navigate to order cutoff configuration page
    router.push('/admin/settings/order-cutoff')
    // For now, show a modal or alert since we don't have this page yet
    alert('Order cutoff time configuration: This feature will allow you to set the daily cutoff time for orders (e.g., 10:00 PM). Orders placed after this time will be scheduled for the next day.')
  }

  const handleKitchenCapacity = () => {
    // Navigate to kitchen capacity management
    alert('Kitchen capacity management: This feature will allow you to set daily order limits, peak hours, and capacity planning for efficient kitchen operations. You can set maximum orders per day, peak hours, and staff capacity.')
  }

  const handleSystemBackup = () => {
    if (confirm('Are you sure you want to create a system backup? This will create a backup of all data including student records, orders, menu items, and system configurations.')) {
      // Implement backup functionality
      alert('System backup initiated. You will receive a notification when the backup is complete.')
    }
  }

  const handleForceLogoutStudents = async () => {
    if (!confirm('⚠️ CRITICAL ACTION: This will immediately log out ALL student sessions. They will need to log in again. Are you absolutely sure?')) {
      return
    }

    try {
      setForceLogoutLoading(true)
      const response = await fetch('/api/admin/force-logout-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: logoutReason || 'Emergency logout by super admin'
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Success: Forced logout for ${data.affectedStudents} student sessions.\n\nReason: ${data.reason}\nTimestamp: ${new Date(data.timestamp).toLocaleString()}`)
        setShowForceLogoutModal(false)
        setLogoutReason('')
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error forcing student logout:', error)
      alert('❌ Failed to force logout student sessions. Please try again.')
    } finally {
      setForceLogoutLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <div className="flex items-center gap-2 mt-1">
              {session?.user?.role === 'ADMIN' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👑 Super Admin
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🎯 University Manager
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {session?.user?.name ? getInitials(session.user.name) : 'A'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {session?.user?.name || 'Manager'}
              </h2>
              <p className="text-gray-600">{session?.user?.email || 'manager@aieraa.com'}</p>
              <p className="text-sm text-blue-600 font-medium mt-1">
                {session?.user?.university || 'University Name'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  session?.user?.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {session?.user?.role || 'MANAGER'}
                </span>
              </div>
            </div>
            <button
              onClick={handleEditProfile}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Operations */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Operations</h3>
          </div>
          
          <div className="space-y-0">
            <button 
              onClick={handleHomepageConfig}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏠</span>
                <span className="text-gray-900">Homepage Configuration</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">Popular & Specials</span>
                <span className="text-gray-400 ml-2">›</span>
              </div>
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              onClick={handleOrderCutoffConfig}
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Order Cutoff Time</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">10:00 PM</span>
                <span className="text-gray-400 ml-2">›</span>
              </div>
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              onClick={handleKitchenCapacity}
            >
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Kitchen Capacity</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">200 orders/day</span>
                <span className="text-gray-400 ml-2">›</span>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/admin/users')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Staff Management</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            {/* Force Logout All Students - Only for Super Admin */}
            {session?.user?.role === 'ADMIN' && (
              <button 
                onClick={() => setShowForceLogoutModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors border-t border-red-100"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <span className="text-red-700 font-medium">Force Logout All Students</span>
                    <p className="text-xs text-red-600 mt-0.5">Emergency session termination</p>
                  </div>
                </div>
                <span className="text-red-400">›</span>
              </button>
            )}
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">App Settings</h3>
          </div>
          
          <div className="space-y-0">
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Notification settings: Configure push notifications, email alerts for orders, student registrations, and system updates.')}
            >
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Notification Settings</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Payment methods: Configure payment gateways, pricing tiers, discounts, and financial reporting settings for the hostel meal system.')}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Payment Methods</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              onClick={() => alert('General settings: Configure app theme, language, timezone, data backup settings, and system preferences.')}
            >
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">General Settings</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* System Stats */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '-' : stats.activeStudents}
              </div>
              <div className="text-xs text-blue-600 mt-1">Active Students</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {loading ? '-' : stats.menuItems}
              </div>
              <div className="text-xs text-green-600 mt-1">Menu Items</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? '-' : stats.pendingOrders}
              </div>
              <div className="text-xs text-yellow-600 mt-1">Pending Orders</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.uptime}%</div>
              <div className="text-xs text-purple-600 mt-1">Uptime</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => router.push('/admin/analytics')}
              className="p-4 bg-orange-50 rounded-xl text-center hover:bg-orange-100 transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium text-orange-700">Export Reports</p>
            </button>
            
            <button 
              className="p-4 bg-red-50 rounded-xl text-center hover:bg-red-100 transition-colors"
              onClick={handleSystemBackup}
            >
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm font-medium text-red-700">System Backup</p>
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Account</h3>
          </div>
          
          <div className="space-y-0">
            <button 
              onClick={handleEditProfile}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Edit Profile</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button 
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Change Password</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button 
              onClick={handleActivityLog}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Activity Log</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-100 text-red-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </div>
            <span className="text-red-400">›</span>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">Aieraa Hostel v1.0.0</p>
          <p className="text-xs text-gray-400">© 2024 All rights reserved</p>
        </div>
      </div>

      {/* Force Logout Modal */}
      {showForceLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Force Logout All Students</h3>
                <p className="text-sm text-red-600">This is a critical system action</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                This will immediately terminate all active student sessions. Students will need to log in again to access the system.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for force logout (optional):
              </label>
              <textarea
                value={logoutReason}
                onChange={(e) => setLogoutReason(e.target.value)}
                placeholder="e.g., Emergency maintenance, Security breach, System update..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700">
                ⚠️ <strong>Warning:</strong> This action affects all students across all universities and cannot be undone. Use only in emergency situations.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowForceLogoutModal(false)
                  setLogoutReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={forceLogoutLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleForceLogoutStudents}
                disabled={forceLogoutLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {forceLogoutLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  'Force Logout All'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
} 