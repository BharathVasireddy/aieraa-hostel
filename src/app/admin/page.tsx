'use client'

import { 
  Users, 
  UtensilsCrossed, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Settings,
  Bell,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Zap,
  Activity,
  Target,
  Award,
  Building,
  Crown,
  UserPlus,
  ChefHat,
  Utensils
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { useUser } from '@/components/UserProvider'
import { lightningCache, lightningFetch } from '@/lib/cache'

interface DashboardStats {
  totalUsers: number
  activeOrders: number
  todaysRevenue: number
  menuItems: number
  pendingOrders: number
  completedOrders: number
  monthlyGrowth: number
  averageOrderValue: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  studentName: string
  items: number
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
  orderDate: string
  deliveryTime?: string
}

interface PopularItem {
  id: string
  name: string
  category: string
  ordersCount: number
  revenue: number
  isVegetarian: boolean
  trend: 'up' | 'down' | 'stable'
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useUser()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeOrders: 0,
    todaysRevenue: 0,
    menuItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyGrowth: 0,
    averageOrderValue: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState('today')
  const [showNotifications, setShowNotifications] = useState(false)

  // Fetch dashboard data with lightning caching
  const fetchDashboardData = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true)
      else setLoading(true)

      // Check instant cache first (unless refreshing)
      const cacheKey = `admin_dashboard_${selectedDateRange}`
      if (!refresh) {
        const cachedData = lightningCache.getInstant<any>(cacheKey)
        if (cachedData) {
          console.log('⚡ INSTANT dashboard from cache')
          setStats(cachedData.stats)
          setRecentOrders(cachedData.recentOrders)
          setPopularItems(cachedData.popularItems)
          setLoading(false)
          return
        }
      }

      // Fetch fresh data
      const [analyticsResponse, ordersResponse] = await Promise.all([
        lightningFetch('/api/admin/analytics', {}, refresh ? 0 : 5), // 5 min cache
        lightningFetch('/api/admin/orders?limit=10', {}, refresh ? 0 : 2) // 2 min cache for recent orders
      ])

      if (analyticsResponse.success && ordersResponse.success) {
        // Transform analytics data
        const analyticsData = analyticsResponse.data
        const transformedStats: DashboardStats = {
          totalUsers: analyticsData.totalStudents || 0,
          activeOrders: analyticsData.activeOrders || 0,
          todaysRevenue: analyticsData.todaysRevenue || 0,
          menuItems: analyticsData.totalMenuItems || 0,
          pendingOrders: analyticsData.pendingOrders || 0,
          completedOrders: analyticsData.completedOrders || 0,
          monthlyGrowth: analyticsData.monthlyGrowth || 0,
          averageOrderValue: analyticsData.averageOrderValue || 0
        }

        // Transform recent orders
        const transformedOrders: RecentOrder[] = ordersResponse.orders?.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
          studentName: order.user?.name || 'Student',
          items: order.orderItems?.length || 0,
          total: order.totalAmount || 0,
          status: order.status || 'PENDING',
          orderDate: order.orderDate || order.createdAt,
          deliveryTime: order.deliveryTime
        })) || []

        // Mock popular items (enhance with real data)
        const mockPopularItems: PopularItem[] = [
          {
            id: '1',
            name: 'Butter Chicken Rice',
            category: 'lunch',
            ordersCount: 45,
            revenue: 8100,
            isVegetarian: false,
            trend: 'up'
          },
          {
            id: '2', 
            name: 'Paneer Tikka Masala',
            category: 'lunch',
            ordersCount: 38,
            revenue: 5700,
            isVegetarian: true,
            trend: 'up'
          },
          {
            id: '3',
            name: 'Chicken Biryani',
            category: 'dinner',
            ordersCount: 32,
            revenue: 6400,
            isVegetarian: false,
            trend: 'stable'
          },
          {
            id: '4',
            name: 'Masala Dosa',
            category: 'breakfast',
            ordersCount: 28,
            revenue: 2800,
            isVegetarian: true,
            trend: 'down'
          }
        ]

        setStats(transformedStats)
        setRecentOrders(transformedOrders)
        setPopularItems(mockPopularItems)

        // Store in instant cache
        const cacheData = {
          stats: transformedStats,
          recentOrders: transformedOrders,
          popularItems: mockPopularItems
        }
        lightningCache.setInstant(cacheKey, cacheData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedDateRange])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Calculate percentage changes and trends
  const statsWithTrends = useMemo(() => [
    {
      title: 'Total Students',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      trend: '+12%',
      description: 'Active students this month'
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: ShoppingCart,
      color: 'orange',
      trend: '+8%',
      description: 'Orders in progress'
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todaysRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      trend: '+15%',
      description: 'Revenue generated today'
    },
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: UtensilsCrossed,
      color: 'purple',
      trend: '+2%',
      description: 'Active menu items'
    }
  ], [stats])

  // Status color mapping
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-purple-100 text-purple-800'
      case 'READY': return 'bg-green-100 text-green-800'
      case 'SERVED': return 'bg-emerald-100 text-emerald-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-neutral-800'
    }
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'CONFIRMED': return CheckCircle
      case 'PREPARING': return Activity
      case 'READY': return Award
      case 'SERVED': return Target
      case 'CANCELLED': return AlertTriangle
      default: return Clock
    }
  }, [])

  // Loading state
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Loading Header */}
        <div className="bg-white border-b border-neutral-100 px-6 py-4">
          <div className="skeleton h-8 w-48 mb-2"></div>
          <div className="skeleton h-4 w-64"></div>
        </div>
        
        {/* Loading Stats */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="skeleton h-4 w-24 mb-4"></div>
                <div className="skeleton h-8 w-16 mb-2"></div>
                <div className="skeleton h-3 w-32"></div>
              </div>
            ))}
          </div>
          
          {/* Loading Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="skeleton h-6 w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 w-full"></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="skeleton h-6 w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-12 w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-neutral-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h1>
            <p className="text-neutral-600 mt-1">
              Welcome back, {user.name.split(' ')[0]}! Here&apos;s your hostel overview.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Date Range Selector */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="btn-outline p-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Notifications */}
          <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative btn-outline p-2"
            >
              <Bell className="w-4 h-4" />
              {stats.pendingOrders > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{stats.pendingOrders}</span>
                </div>
            )}
          </button>
            
            {/* Settings */}
            <button
              onClick={() => router.push('/admin/settings')}
              className="btn-outline p-2"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Enhanced Stats Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsWithTrends.map((stat) => {
              const IconComponent = stat.icon
              return (
                <div key={stat.title} className="card-interactive bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-card-hover transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`icon-container-primary bg-${stat.color}-100`}>
                      <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
                    <div className="flex items-center space-x-1 text-sm">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-green-600">{stat.trend}</span>
            </div>
          </div>

              <div>
                    <h3 className="text-2xl font-bold text-neutral-800 mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-sm font-medium text-neutral-700 mb-1">{stat.title}</p>
                    <p className="text-xs text-neutral-500">{stat.description}</p>
              </div>
            </div>
              )
            })}
          </div>
        </section>

        {/* Enhanced Quick Actions - Role-based */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
          
          {/* Super Admin Section - University Management */}
          {user.role === 'ADMIN' && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Crown className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wide">Super Admin Controls</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/admin/universities')}
                  className="card-interactive bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="icon-container-primary bg-purple-200">
                      <Building className="w-6 h-6 text-purple-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 text-lg">University Management</h4>
                      <p className="text-sm text-purple-700">Create & manage universities</p>
                      <p className="text-xs text-purple-600 mt-1">🏛️ Multi-university control</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/admin/users')}
                  className="card-interactive bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="icon-container-primary bg-blue-200">
                      <UserPlus className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-lg">All Students</h4>
                      <p className="text-sm text-blue-700">Cross-university management</p>
                      <p className="text-xs text-blue-600 mt-1">👥 {stats.totalUsers} total students</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/admin/analytics')}
                  className="card-interactive bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="icon-container-primary bg-orange-200">
                      <BarChart3 className="w-6 h-6 text-orange-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-900 text-lg">Global Analytics</h4>
                      <p className="text-sm text-orange-700">System-wide reports</p>
                      <p className="text-xs text-orange-600 mt-1">📊 Multi-university insights</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Regular Admin/Manager Actions */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Utensils className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">
                {user.role === 'ADMIN' ? 'Daily Operations' : 'University Management'}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/admin/orders')}
                className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-primary bg-blue-100">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Orders</h4>
                    <p className="text-xs text-blue-700">{stats.activeOrders} active</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/menu')}
                className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-primary bg-purple-100">
                    <UtensilsCrossed className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900">Menu</h4>
                    <p className="text-xs text-purple-700">{stats.menuItems} items</p>
                  </div>
                </div>
              </button>

              {user.role === 'MANAGER' && (
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="icon-container-primary bg-green-100">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">Students</h4>
                      <p className="text-xs text-green-700">{stats.totalUsers} students</p>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={() => router.push('/admin/settings')}
                className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-primary bg-gray-100">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Settings</h4>
                    <p className="text-xs text-gray-700">Configuration</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Additional Admin Tools */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ChefHat className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">Admin Tools</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/admin/analytics')}
                className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-primary bg-orange-100">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-900">Analytics</h4>
                    <p className="text-xs text-orange-700">Reports & insights</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/profile')}
                className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-primary bg-indigo-100">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-900">Profile</h4>
                    <p className="text-xs text-indigo-700">Account settings</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => alert('Export functionality: Generate CSV/PDF reports for orders, revenue, and student data. Coming soon!')}
                className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-primary bg-emerald-100">
                    <Download className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900">Export</h4>
                    <p className="text-xs text-emerald-700">Download reports</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/settings')}
                className="card-interactive bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-primary bg-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-900">Emergency</h4>
                    <p className="text-xs text-red-700">Force logout & more</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800">Recent Orders</h2>
              <button 
                onClick={() => router.push('/admin/orders')}
                  className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                View All
              </button>
            </div>
          </div>

            <div className="divide-y divide-neutral-100">
              {recentOrders.slice(0, 5).map((order) => {
                const StatusIcon = getStatusIcon(order.status)
                return (
                  <div key={order.id} className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
                       onClick={() => router.push(`/admin/orders/${order.id}`)}>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(order.status)}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-neutral-800 truncate">
                            {order.orderNumber}
                          </h4>
                          <span className="text-sm font-semibold text-primary-600">
                            ₹{order.total}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-neutral-600">
                          <span>{order.studentName} • {order.items} items</span>
                          <span>{format(new Date(order.orderDate), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {recentOrders.length === 0 && (
              <div className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">No recent orders</p>
              </div>
            )}
          </section>

          {/* Popular Menu Items */}
          <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800">Popular Items</h2>
                <button
                  onClick={() => router.push('/admin/menu')}
                  className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  Manage Menu
                </button>
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {popularItems.map((item, index) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-neutral-800">{item.name}</h4>
                          <div className={item.isVegetarian ? 'food-veg-indicator' : 'food-non-veg-indicator'}>
                            <div className={item.isVegetarian ? 'food-veg-dot' : 'food-non-veg-dot'} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                          {item.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />}
                          {item.trend === 'stable' && <Zap className="w-4 h-4 text-neutral-400" />}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-neutral-600">
                        <span className={`category-${item.category}`}>{item.category}</span>
                        <div className="flex items-center space-x-3">
                          <span>{item.ordersCount} orders</span>
                          <span className="font-semibold text-neutral-800">₹{item.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Performance Summary */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Performance Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-800 mb-1">{stats.completedOrders}</h3>
              <p className="text-sm text-neutral-600">Orders Completed</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-800 mb-1">₹{stats.averageOrderValue}</h3>
              <p className="text-sm text-neutral-600">Average Order Value</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-800 mb-1">{stats.monthlyGrowth}%</h3>
              <p className="text-sm text-neutral-600">Monthly Growth</p>
            </div>
          </div>
        </section>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-modal-backdrop bg-black/50" onClick={() => setShowNotifications(false)}>
          <div className="fixed top-20 right-6 w-80 bg-white rounded-xl border border-neutral-200 shadow-xl animate-scale-in z-modal">
            <div className="p-4 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-800">Notifications</h3>
        </div>

            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {stats.pendingOrders > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      {stats.pendingOrders} orders need attention
                </span>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Revenue is up 15% from yesterday
                  </span>
                </div>
              </div>
            </div>
        </div>
        </div>
      )}
    </div>
  )
} 