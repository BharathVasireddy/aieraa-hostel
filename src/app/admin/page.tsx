'use client'

import { Bell, Clock, DollarSign, Users, TrendingUp, BarChart3, AlertCircle, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import BottomNavigation from '@/components/BottomNavigation'

interface DashboardStats {
  pendingOrders: number
  todayRevenue: number
  totalStudents: number
  servedOrders: number
  menuItems: number
  pendingRegistrations: number
  approvedStudents: number
  totalOrders: number
  todayOrders: number
  totalRevenue: number
}

export default function ManagerDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    todayRevenue: 0,
    totalStudents: 0,
    servedOrders: 0,
    menuItems: 0,
    pendingRegistrations: 0,
    approvedStudents: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchDashboardStats()
    }
  }, [session])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch users data
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const userData = await usersResponse.json()
        const users = userData || []
        
        const pendingRegistrations = users.filter((user: any) => user.status === 'PENDING').length
        const approvedStudents = users.filter((user: any) => user.status === 'APPROVED' && user.role === 'STUDENT').length
        const totalStudents = users.filter((user: any) => user.role === 'STUDENT').length

        setStats(prev => ({
          ...prev,
          pendingRegistrations,
          approvedStudents,
          totalStudents
        }))
      }

      // Fetch analytics data
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setStats(prev => ({
          ...prev,
          totalOrders: data.totalOrders || 0,
          todayOrders: data.todayOrders || 0,
          pendingOrders: data.pendingOrders || 0,
          menuItems: data.menuItems || 0,
          totalRevenue: data.totalRevenue || 0,
          todayRevenue: data.todayRevenue || 0,
          servedOrders: data.servedOrders || 0
        }))
      } else {
        console.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {session?.user?.role === 'ADMIN' ? 'Super Admin Dashboard' : 'Manager Dashboard'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {session?.user?.role === 'ADMIN' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👑 Super Admin - All Universities Access
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🎯 University Manager
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Manage Students</span>
            {stats.pendingRegistrations > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {stats.pendingRegistrations}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Pending Registrations Alert */}
        {stats.pendingRegistrations > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  {stats.pendingRegistrations} Student Registration{stats.pendingRegistrations > 1 ? 's' : ''} Pending Approval
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  New students are waiting for account approval
                </p>
              </div>
              <button 
                onClick={() => router.push('/admin/users')}
                className="bg-orange-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Pending Orders</p>
                <p className="text-2xl font-bold text-blue-700">{loading ? '-' : stats.pendingOrders}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.pendingOrders === 0 ? 'No orders pending' : 'Orders awaiting action'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold text-green-700">₹{loading ? '-' : stats.todayRevenue}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.todayRevenue === 0 ? 'No sales today' : 'Revenue generated'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{loading ? '-' : stats.totalStudents}</div>
            <div className="text-xs text-gray-600">Total Students</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{loading ? '-' : stats.servedOrders}</div>
            <div className="text-xs text-gray-600">Served</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{loading ? '-' : stats.menuItems}</div>
            <div className="text-xs text-gray-600">Menu Items</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">{loading ? '-' : stats.approvedStudents}</div>
            <div className="text-xs text-green-600">Approved</div>
          </div>
        </div>

        {/* Student Registration Management */}
        <div className="bg-white border border-gray-100 rounded-lg">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Student Registration Status</h2>
              <button 
                onClick={() => router.push('/admin/users')}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Manage Users
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-900">Pending Approval</p>
                  <p className="text-lg font-bold text-orange-700">{loading ? '-' : stats.pendingRegistrations}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Approved Students</p>
                  <p className="text-lg font-bold text-green-700">{loading ? '-' : stats.approvedStudents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Orders Section */}
        <div className="bg-white border border-gray-100 rounded-lg">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Pending Orders</h2>
              <button 
                onClick={() => router.push('/admin/orders')}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">No pending orders</p>
              <p className="text-xs text-gray-500">Orders will appear here when students place them</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => router.push('/admin/users')}
            className={`p-4 border rounded-lg hover:bg-purple-100 transition-colors text-center ${
              stats.pendingRegistrations > 0 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-purple-50 border-purple-100'
            }`}
          >
            <div className="relative">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              {stats.pendingRegistrations > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.pendingRegistrations}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-purple-900">
              {stats.pendingRegistrations > 0 ? 'Approve Students' : 'Manage Users'}
            </p>
          </button>
          
          <button 
            onClick={() => router.push('/admin/orders')}
            className="p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors text-center"
          >
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-blue-900">Orders</p>
          </button>
          
          <button 
            onClick={() => router.push('/admin/menu')}
            className="p-4 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors text-center"
          >
            <span className="text-xl mb-2 block">🍽️</span>
            <p className="text-xs font-medium text-green-900">Menu</p>
          </button>
        </div>

        {/* Additional Quick Actions Row */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => router.push('/admin/analytics')}
            className="p-4 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors text-center"
          >
            <BarChart3 className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-orange-900">Analytics</p>
          </button>
          
          <button 
            onClick={() => router.push('/admin/settings')}
            className="p-4 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            <span className="text-xl mb-2 block">⚙️</span>
            <p className="text-xs font-medium text-gray-900">Settings</p>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
} 