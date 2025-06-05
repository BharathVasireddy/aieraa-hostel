'use client'

import { TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Calendar, Clock, Target, RefreshCw, Download, BarChart3, PieChart } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'
import { useRouter } from 'next/navigation'
import { lightningFetch, lightningCache } from '@/lib/cache'

interface AnalyticsData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  keyMetrics: {
    totalRevenue: number
    revenueGrowth: number
    totalOrders: number
    orderGrowth: number
    avgOrderValue: number
    activeStudents: number
    totalStudents: number
    orderSuccessRate: number
  }
  dailyData: Array<{
    date: string
    dayName: string
    revenue: number
    orders: number
  }>
  popularItems: Array<{
    id: string
    name: string
    category: string
    orders: number
    quantity: number
    revenue: number
  }>
  categoryBreakdown: Array<{
    category: string
    _count: number
  }>
  orderStatusStats: Array<{
    status: string
    _count: number
    _sum: { totalAmount: number }
  }>
  studentSegments: {
    heavy: { count: number; avgSpend: number }
    regular: { count: number; avgSpend: number }
    occasional: { count: number; avgSpend: number }
    new: { count: number; avgSpend: number }
  }
}

export default function AdminAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check instant cache first
      const cacheKey = `analytics_${selectedPeriod}`
      const cachedAnalytics = lightningCache.getInstant<AnalyticsData>(cacheKey)
      if (cachedAnalytics) {
        console.log('⚡ INSTANT analytics from cache')
        setAnalytics(cachedAnalytics)
        setLoading(false)
        return
      }
      
      // Use lightning fetch with 10 minute cache for analytics
      const data = await lightningFetch(`/api/admin/analytics?period=${selectedPeriod}`, {}, 10)
      setAnalytics(data)
      
      // Store in instant cache for immediate future access
      lightningCache.setInstant(cacheKey, data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    // Clear cache and force fresh data
    const cacheKey = `analytics_${selectedPeriod}`
    lightningCache.delete(cacheKey)
    
    try {
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        // Store fresh data in instant cache
        lightningCache.setInstant(cacheKey, data)
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    }
    setRefreshing(false)
  }, [selectedPeriod])

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-3 h-3" />
    if (growth < 0) return <TrendingDown className="w-3 h-3" />
    return null
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const periods = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Analytics" showNotifications={true} />
        <div className="px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
              ))}
            </div>
            <div className="bg-gray-200 h-48 rounded-lg"></div>
            <div className="bg-gray-200 h-32 rounded-lg"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load analytics data</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const maxRevenue = analytics.dailyData && analytics.dailyData.length > 0 
    ? Math.max(...analytics.dailyData.map(d => d.revenue))
    : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Analytics Dashboard" 
        showNotifications={true}
        rightElement={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-6">
        {/* Period Selector */}
        <div className="flex space-x-2">
          {periods.map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 text-sm rounded-lg font-medium ${
                selectedPeriod === period.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <div className={`flex items-center ${getGrowthColor(analytics.keyMetrics.revenueGrowth)}`}>
                {getGrowthIcon(analytics.keyMetrics.revenueGrowth)}
                <span className="text-xs font-medium ml-1">
                  {formatPercentage(analytics.keyMetrics.revenueGrowth)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(analytics.keyMetrics.totalRevenue)}
              </p>
              <p className="text-sm text-blue-600">Total Revenue</p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-6 h-6 text-green-600" />
              <div className={`flex items-center ${getGrowthColor(analytics.keyMetrics.orderGrowth)}`}>
                {getGrowthIcon(analytics.keyMetrics.orderGrowth)}
                <span className="text-xs font-medium ml-1">
                  {formatPercentage(analytics.keyMetrics.orderGrowth)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{analytics.keyMetrics.totalOrders}</p>
              <p className="text-sm text-green-600">Total Orders</p>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-orange-600" />
              <div className="text-orange-600">
                <span className="text-xs font-medium">
                  {analytics.keyMetrics.activeStudents}/{analytics.keyMetrics.totalStudents}
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{analytics.keyMetrics.activeStudents}</p>
              <p className="text-sm text-orange-600">Active Students</p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-6 h-6 text-purple-600" />
              <div className="text-purple-600">
                <span className="text-xs font-medium">
                  {analytics.keyMetrics.orderSuccessRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(analytics.keyMetrics.avgOrderValue)}
              </p>
              <p className="text-sm text-purple-600">Avg Order Value</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          {!analytics.dailyData || analytics.dailyData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No revenue data available for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.dailyData.map((data, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-12">{data.dayName}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-right w-20">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(data.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">{data.orders} orders</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Items */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Items</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          {!analytics.popularItems || analytics.popularItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No order data available for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.popularItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} sold • {formatCurrency(item.revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{item.orders}</div>
                    <div className="text-xs text-gray-500">orders</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          {!analytics.categoryBreakdown || analytics.categoryBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No category data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {analytics.categoryBreakdown.map((category, index) => {
                const categoryEmojis: { [key: string]: string } = {
                  'BREAKFAST': '☀️',
                  'LUNCH': '🌞',
                  'DINNER': '🌙',
                  'SNACKS': '🍿',
                  'BEVERAGES': '☕'
                }
                
                return (
                  <div key={category.category} className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">
                        {categoryEmojis[category.category] || '🍽️'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {category.category.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-600">{category._count} items</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Student Segments */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Segments</h3>
          <div className="space-y-3">
            {[
              { 
                key: 'heavy',
                segment: 'Heavy Users', 
                ...(analytics.studentSegments?.heavy || { count: 0, avgSpend: 0 }),
                color: 'bg-red-100 text-red-700' 
              },
              { 
                key: 'regular',
                segment: 'Regular Users', 
                ...(analytics.studentSegments?.regular || { count: 0, avgSpend: 0 }),
                color: 'bg-blue-100 text-blue-700' 
              },
              { 
                key: 'occasional',
                segment: 'Occasional Users', 
                ...(analytics.studentSegments?.occasional || { count: 0, avgSpend: 0 }),
                color: 'bg-green-100 text-green-700' 
              },
              { 
                key: 'new',
                segment: 'New Users', 
                ...(analytics.studentSegments?.new || { count: 0, avgSpend: 0 }),
                color: 'bg-purple-100 text-purple-700' 
              }
            ].map((segment) => (
              <div key={segment.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-md text-xs font-medium ${segment.color}`}>
                    {segment.segment}
                  </div>
                  <span className="text-sm text-gray-600">{segment.count} students</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(segment.avgSpend)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h3>
          {!analytics.orderStatusStats || analytics.orderStatusStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No order status data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.orderStatusStats.map((status) => {
                const statusConfig: { [key: string]: { color: string; label: string } } = {
                  'PENDING': { color: 'bg-orange-100 text-orange-700', label: 'Pending' },
                  'APPROVED': { color: 'bg-blue-100 text-blue-700', label: 'Approved' },
                  'PREPARING': { color: 'bg-purple-100 text-purple-700', label: 'Preparing' },
                  'READY': { color: 'bg-green-100 text-green-700', label: 'Ready' },
                  'SERVED': { color: 'bg-emerald-100 text-emerald-700', label: 'Served' },
                  'REJECTED': { color: 'bg-red-100 text-red-700', label: 'Rejected' },
                  'CANCELLED': { color: 'bg-gray-100 text-gray-700', label: 'Cancelled' }
                }
                
                const config = statusConfig[status.status] || { color: 'bg-gray-100 text-gray-700', label: status.status }
                
                return (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
                        {config.label}
                      </div>
                      <span className="text-sm text-gray-600">{status._count} orders</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(status._sum?.totalAmount || 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900">
                {analytics.keyMetrics.orderSuccessRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-xs text-green-600 mt-1">
                {analytics.keyMetrics.totalOrders} total orders
              </p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-center">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900">
                {analytics.keyMetrics.activeStudents}
              </p>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-xs text-blue-600 mt-1">
                {((analytics.keyMetrics.activeStudents / analytics.keyMetrics.totalStudents) * 100).toFixed(1)}% engagement
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors border border-blue-100">
              <Download className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-700">Export Report</p>
            </button>
            
            <button className="p-3 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors border border-green-100">
              <BarChart3 className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-700">Detailed Analytics</p>
            </button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
} 