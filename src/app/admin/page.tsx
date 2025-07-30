'use client';

import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Building,
  CheckCircle,
  ChefHat,
  Clock,
  Crown,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Utensils,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useUser } from '@/components/UserProvider';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoaders';

interface DashboardStats {
  totalUsers: number;
  activeOrders: number;
  todaysRevenue: number;
  menuItems: number;
  pendingOrders: number;
  completedOrders: number;
  monthlyGrowth: number;
  averageOrderValue: number;
  totalUniversities: number;
  activeManagers: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  items: number;
  total: number;
  status: string;
  orderDate: string;
  deliveryTime?: string;
  universityName: string;
}

interface PopularItem {
  id: string;
  name: string;
  category: string;
  ordersCount: number;
  revenue: number;
  isVegetarian: boolean;
  trend: 'up' | 'down' | 'stable';
  universityName: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeOrders: 0,
    todaysRevenue: 0,
    menuItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyGrowth: 0,
    averageOrderValue: 0,
    totalUniversities: 0,
    activeManagers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [showNotifications, setShowNotifications] = useState(false);

  // Progressive loading - fetch critical stats first
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics?period=week', {
        headers: {
          'Cache-Control': 'max-age=60', // 1 minute cache
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      // Add safety checks for data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response structure');
      }

      // API returns data directly, not wrapped in data.data
      // Structure: { keyMetrics: { ... }, dailyData: [...], etc. }
      const keyMetrics = data.keyMetrics || {};
      const orderStatusStats = data.orderStatusStats || [];
      const popularItems = data.popularItems || [];

      setStats({
        totalUsers: keyMetrics.totalStudents || 0,
        activeOrders: keyMetrics.totalOrders || 0,
        todaysRevenue: keyMetrics.totalRevenue || 0,
        menuItems: popularItems.length || 0,
        pendingOrders:
          orderStatusStats.find((s: any) => s.status === 'PENDING')?._count
            ?.id || 0,
        completedOrders:
          orderStatusStats.find((s: any) => s.status === 'SERVED')?._count
            ?.id || 0,
        monthlyGrowth: keyMetrics.revenueGrowth || 0,
        averageOrderValue: keyMetrics.avgOrderValue || 0,
        totalUniversities: keyMetrics.totalUniversities || 0,
        activeManagers: keyMetrics.activeManagers || 0,
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      // Set default values on error to prevent UI crashes
      setStats({
        totalUsers: 0,
        activeOrders: 0,
        todaysRevenue: 0,
        menuItems: 0,
        pendingOrders: 0,
        completedOrders: 0,
        monthlyGrowth: 0,
        averageOrderValue: 0,
        totalUniversities: 0,
        activeManagers: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch recent orders (less critical, can load after stats)
  const fetchRecentOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/orders?limit=5', {
        headers: {
          'Cache-Control': 'max-age=30', // 30 second cache
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const ordersData = await response.json();

      // Handle the actual API response structure
      const orders = Array.isArray(ordersData)
        ? ordersData
        : ordersData.orders || [];

      const transformedOrders: RecentOrder[] = orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
        studentName: order.user?.name || 'Student',
        items: order.orderItems?.length || 0,
        total: order.totalAmount || 0,
        status: order.status || 'PENDING',
        orderDate: order.orderDate || order.createdAt,
        deliveryTime: order.deliveryTime,
        universityName: order.university?.name || 'Unknown University',
      }));

      setRecentOrders(transformedOrders);
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Fetch popular items (least critical, load last)
  const fetchPopularItems = useCallback(async () => {
    try {
      // Mock popular items across all universities
      const mockPopularItems: PopularItem[] = [
        {
          id: '1',
          name: 'Butter Chicken Rice',
          category: 'lunch',
          ordersCount: 145,
          revenue: 21800,
          isVegetarian: false,
          trend: 'up',
          universityName: 'University A',
        },
        {
          id: '2',
          name: 'Paneer Tikka Masala',
          category: 'lunch',
          ordersCount: 98,
          revenue: 14700,
          isVegetarian: true,
          trend: 'up',
          universityName: 'University B',
        },
        {
          id: '3',
          name: 'Chicken Biryani',
          category: 'dinner',
          ordersCount: 87,
          revenue: 17400,
          isVegetarian: false,
          trend: 'stable',
          universityName: 'University C',
        },
        {
          id: '4',
          name: 'Masala Dosa',
          category: 'breakfast',
          ordersCount: 76,
          revenue: 7600,
          isVegetarian: true,
          trend: 'down',
          universityName: 'University A',
        },
      ];
      setPopularItems(mockPopularItems);
    } catch (error) {
      console.error('Failed to fetch popular items:', error);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Progressive loading strategy
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      // Load critical stats first
      void fetchStats();

      // Load secondary data after a short delay
      setTimeout(() => {
        void fetchRecentOrders();
      }, 100);

      // Load tertiary data after stats are likely loaded
      setTimeout(() => {
        void fetchPopularItems();
      }, 300);
    }
  }, [user?.role, fetchStats, fetchRecentOrders, fetchPopularItems]);

  const handleRefresh = useCallback(async () => {
    setLoadingStats(true);
    setLoadingOrders(true);
    setLoadingItems(true);

    // Refresh all data in parallel
    await Promise.all([fetchStats(), fetchRecentOrders(), fetchPopularItems()]);
  }, [fetchStats, fetchRecentOrders, fetchPopularItems]);

  // Super Admin specific stats with trends
  const superAdminStats = useMemo(
    () => [
      {
        title: 'Total Universities',
        value: stats.totalUniversities,
        icon: Building,
        color: 'purple',
        trend: '+3%',
        description: 'Active universities in system',
      },
      {
        title: 'All Students',
        value: stats.totalUsers,
        icon: Users,
        color: 'blue',
        trend: '+12%',
        description: 'Students across all universities',
      },
      {
        title: 'System Revenue',
        value: `₹${stats.todaysRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: 'green',
        trend: '+15%',
        description: 'Revenue from all universities',
      },
      {
        title: 'Active Managers',
        value: stats.activeManagers,
        icon: Crown,
        color: 'orange',
        trend: '+2%',
        description: 'University managers online',
      },
    ],
    [stats]
  );

  // Status helpers
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'SERVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'PENDING':
        return Clock;
      case 'APPROVED':
        return CheckCircle;
      case 'PREPARING':
        return Activity;
      case 'READY':
        return Award;
      case 'SERVED':
        return Target;
      case 'CANCELLED':
        return AlertTriangle;
      default:
        return Clock;
    }
  }, []);

  // Redirect non-admin users
  if (!user || user.role !== 'ADMIN') {
    return <DashboardSkeleton />;
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Enhanced Super Admin Header */}
      <div className='bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center space-x-2 mb-2'>
              <Crown className='w-6 h-6' />
              <h1 className='text-2xl font-bold'>Super Admin Dashboard</h1>
            </div>
            <p className='text-purple-100'>
              System-wide oversight • {stats.totalUniversities} Universities •{' '}
              {stats.totalUsers} Students
            </p>
          </div>

          <div className='flex items-center space-x-3'>
            {/* Date Range Selector */}
            <select
              value={selectedDateRange}
              onChange={e => setSelectedDateRange(e.target.value)}
              className='bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50'
            >
              <option value='today'>Today</option>
              <option value='week'>This Week</option>
              <option value='month'>This Month</option>
              <option value='quarter'>This Quarter</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loadingStats}
              className='p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors'
            >
              <RefreshCw
                className={`w-5 h-5 ${loadingStats ? 'animate-spin' : ''}`}
              />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className='relative p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors'
            >
              <Bell className='w-5 h-5' />
              {stats.pendingOrders > 0 && (
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
                  <span className='text-xs font-bold text-white'>
                    {stats.pendingOrders}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className='p-6 space-y-6'>
        {/* Super Admin Stats Grid */}
        <Suspense fallback={<DashboardSkeleton />}>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {superAdminStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className='bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow'
                >
                  {loadingStats ? (
                    <div className='animate-pulse'>
                      <div className='w-8 h-8 bg-gray-200 rounded-lg mb-4'></div>
                      <div className='h-4 bg-gray-200 rounded w-24 mb-2'></div>
                      <div className='h-8 bg-gray-200 rounded w-16 mb-2'></div>
                      <div className='h-3 bg-gray-200 rounded w-20'></div>
                    </div>
                  ) : (
                    <>
                      <div className='flex items-center justify-between mb-4'>
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-600`}
                        >
                          <Icon className='w-6 h-6 text-white' />
                        </div>
                        <div className='flex items-center space-x-1 text-sm'>
                          <TrendingUp className='w-3 h-3 text-green-600' />
                          <span className='text-green-600 font-medium'>
                            {stat.trend}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className='text-neutral-600 text-sm font-medium mb-1'>
                          {stat.title}
                        </p>
                        <p className='text-2xl font-bold text-neutral-900'>
                          {stat.value}
                        </p>
                        <p className='text-xs text-neutral-500 mt-1'>
                          {stat.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Suspense>

        {/* Super Admin Quick Actions */}
        <section>
          <h2 className='text-lg font-semibold text-neutral-800 mb-4'>
            Super Admin Controls
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <button
              onClick={() => router.push('/admin/universities')}
              className='card-interactive bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200'
            >
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center'>
                  <Building className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h4 className='font-bold text-purple-900 text-lg'>
                    Universities
                  </h4>
                  <p className='text-sm text-purple-700'>
                    Manage all universities
                  </p>
                  <p className='text-xs text-purple-600 mt-1'>
                    🏛️ {stats.totalUniversities} active
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/users')}
              className='card-interactive bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200'
            >
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center'>
                  <UserPlus className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h4 className='font-bold text-blue-900 text-lg'>All Users</h4>
                  <p className='text-sm text-blue-700'>
                    Cross-university management
                  </p>
                  <p className='text-xs text-blue-600 mt-1'>
                    👥 {stats.totalUsers} students
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/analytics')}
              className='card-interactive bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200'
            >
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center'>
                  <BarChart3 className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h4 className='font-bold text-green-900 text-lg'>
                    System Analytics
                  </h4>
                  <p className='text-sm text-green-700'>
                    Global insights & reports
                  </p>
                  <p className='text-xs text-green-600 mt-1'>
                    📊 Real-time data
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Standard Admin Actions */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <button
              onClick={() => router.push('/admin/orders')}
              className='bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <Eye className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <h4 className='font-semibold text-blue-900'>All Orders</h4>
                  <p className='text-xs text-blue-700'>
                    {stats.activeOrders} active
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/menu')}
              className='bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <UtensilsCrossed className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <h4 className='font-semibold text-purple-900'>All Menus</h4>
                  <p className='text-xs text-purple-700'>
                    {stats.menuItems} items
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/settings')}
              className='bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                  <Settings className='w-5 h-5 text-gray-600' />
                </div>
                <div>
                  <h4 className='font-semibold text-gray-900'>
                    System Settings
                  </h4>
                  <p className='text-xs text-gray-700'>Global config</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/profile')}
              className='bg-white rounded-xl border border-neutral-200 p-4 text-left hover:shadow-md transition-all duration-200'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center'>
                  <Users className='w-5 h-5 text-indigo-600' />
                </div>
                <div>
                  <h4 className='font-semibold text-indigo-900'>Profile</h4>
                  <p className='text-xs text-indigo-700'>Account settings</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Cross-University Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Recent Orders Across All Universities */}
          <Suspense
            fallback={
              <div className='h-64 bg-white rounded-xl animate-pulse' />
            }
          >
            <section className='bg-white rounded-xl shadow-sm border border-neutral-200'>
              <div className='p-6 border-b border-neutral-100'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold text-neutral-900'>
                    Recent Orders (All Universities)
                  </h3>
                  <button
                    onClick={() => router.push('/admin/orders')}
                    className='text-sm text-purple-600 hover:text-purple-700 font-medium'
                  >
                    View All
                  </button>
                </div>
                <p className='text-sm text-neutral-600 mt-1'>
                  Latest orders from all universities
                </p>
              </div>

              <div className='divide-y divide-neutral-100'>
                {loadingOrders ? (
                  <div className='p-6'>
                    <div className='animate-pulse space-y-3'>
                      {[1, 2, 3].map(i => (
                        <div key={i} className='flex items-center space-x-3'>
                          <div className='w-4 h-4 bg-gray-200 rounded'></div>
                          <div className='flex-1 space-y-2'>
                            <div className='h-4 bg-gray-200 rounded w-32'></div>
                            <div className='h-3 bg-gray-200 rounded w-24'></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map(order => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <div
                        key={order.id}
                        className='p-4 hover:bg-neutral-50 transition-colors cursor-pointer'
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <div className='flex items-center space-x-4'>
                          <div className='flex-shrink-0'>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(order.status)}`}
                            >
                              <StatusIcon className='w-5 h-5' />
                            </div>
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between mb-1'>
                              <h4 className='font-medium text-neutral-800 truncate'>
                                {order.orderNumber}
                              </h4>
                              <span className='text-sm font-semibold text-primary-600'>
                                ₹{order.total}
                              </span>
                            </div>

                            <div className='flex items-center justify-between text-sm text-neutral-600'>
                              <span>
                                {order.studentName} • {order.items} items
                              </span>
                              <span className='text-xs text-purple-600'>
                                {order.universityName}
                              </span>
                            </div>

                            <p className='text-xs text-neutral-500 mt-1'>
                              {format(
                                new Date(order.orderDate),
                                'MMM d, h:mm a'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className='p-8 text-center'>
                    <ShoppingCart className='w-12 h-12 text-neutral-400 mx-auto mb-3' />
                    <p className='text-neutral-600'>No recent orders</p>
                  </div>
                )}
              </div>
            </section>
          </Suspense>

          {/* Popular Items Across All Universities */}
          <Suspense
            fallback={
              <div className='h-64 bg-white rounded-xl animate-pulse' />
            }
          >
            <section className='bg-white rounded-xl shadow-sm border border-neutral-200'>
              <div className='p-6 border-b border-neutral-100'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold text-neutral-900'>
                    Popular Items (System-wide)
                  </h3>
                  <button
                    onClick={() => router.push('/admin/analytics')}
                    className='text-sm text-purple-600 hover:text-purple-700 font-medium'
                  >
                    View Analytics
                  </button>
                </div>
                <p className='text-sm text-neutral-600 mt-1'>
                  Top performing items across all universities
                </p>
              </div>

              <div className='divide-y divide-neutral-100'>
                {loadingItems ? (
                  <div className='p-6'>
                    <div className='animate-pulse space-y-3'>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                          <div className='flex-1 space-y-2'>
                            <div className='h-4 bg-gray-200 rounded w-32'></div>
                            <div className='h-3 bg-gray-200 rounded w-24'></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : popularItems.length > 0 ? (
                  popularItems.map((item, index) => (
                    <div key={item.id} className='p-4'>
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-500 text-white'
                              : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center space-x-2 mb-1'>
                            <h4 className='font-medium text-neutral-800 truncate'>
                              {item.name}
                            </h4>
                            {item.isVegetarian && (
                              <div className='w-3 h-3 bg-green-100 border border-green-500 rounded-sm'></div>
                            )}
                          </div>

                          <div className='flex items-center justify-between text-sm text-neutral-600'>
                            <span>
                              {item.ordersCount} orders • ₹
                              {item.revenue.toLocaleString()}
                            </span>
                            <span className='text-xs text-purple-600'>
                              {item.universityName}
                            </span>
                          </div>
                        </div>

                        <div className='flex items-center space-x-1 text-green-600'>
                          <TrendingUp className='w-4 h-4' />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='p-8 text-center'>
                    <Utensils className='w-12 h-12 text-neutral-400 mx-auto mb-3' />
                    <p className='text-neutral-600'>No popular items data</p>
                  </div>
                )}
              </div>
            </section>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
