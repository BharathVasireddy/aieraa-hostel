'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useUser } from '@/components/UserProvider';
import StatsCardGrid from '@/components/manager/StatsCardGrid';
import QuickActionsManager from '@/components/manager/QuickActionsManager';
import PendingApprovalsWidget from '@/components/manager/PendingApprovalsWidget';
import RecentOrdersWidget from '@/components/manager/RecentOrdersWidget';
import PopularItemsWidget from '@/components/manager/PopularItemsWidget';
import ManagerAnalytics from '@/components/manager/ManagerAnalytics';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoaders';

interface ManagerStats {
  todaysOrders: number;
  pendingApprovals: number;
  todaysRevenue: number;
  activeStudents: number;
  weeklyGrowth: number;
  monthlyRevenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemsCount: number;
}

interface PopularItem {
  id: string;
  name: string;
  category: string;
  ordersCount: number;
  revenue: number;
  isVegetarian: boolean;
}

export default function ManagerDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<ManagerStats>({
    todaysOrders: 0,
    pendingApprovals: 0,
    todaysRevenue: 0,
    activeStudents: 0,
    weeklyGrowth: 0,
    monthlyRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);

  // Progressive loading - fetch critical stats first
  const fetchStats = useCallback(async () => {
    if (!user?.universityId) {return;}

    try {
      const response = await fetch(
        `/api/manager/analytics/stats?universityId=${user.universityId}`,
        {
          headers: {
            'Cache-Control': 'max-age=60', // 1 minute cache for stats
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats({
          todaysOrders: data.todaysOrders || 0,
          pendingApprovals: data.pendingApprovals || 0,
          todaysRevenue: data.todaysRevenue || 0,
          activeStudents: data.activeStudents || 0,
          weeklyGrowth: data.weeklyGrowth || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user?.universityId]);

  // Fetch recent orders (less critical, can load after stats)
  const fetchRecentOrders = useCallback(async () => {
    if (!user?.universityId) {return;}

    try {
      const response = await fetch(
        `/api/manager/orders/recent?universityId=${user.universityId}&limit=5`
      );

      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.universityId]);

  // Fetch popular items (least critical, load last)
  const fetchPopularItems = useCallback(async () => {
    if (!user?.universityId) {return;}

    try {
      const response = await fetch(
        `/api/manager/analytics/popular-items?universityId=${user.universityId}&limit=4`
      );

      if (response.ok) {
        const data = await response.json();
        setPopularItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch popular items:', error);
    } finally {
      setLoadingItems(false);
    }
  }, [user?.universityId]);

  // Progressive loading strategy
  useEffect(() => {
    if (user?.universityId) {
      // Load critical stats first
      fetchStats();

      // Load secondary data after a short delay
      setTimeout(() => {
        fetchRecentOrders();
      }, 100);

      // Load tertiary data after stats are likely loaded
      setTimeout(() => {
        fetchPopularItems();
      }, 300);
    }
  }, [user?.universityId, fetchStats, fetchRecentOrders, fetchPopularItems]);

  const handleRefresh = useCallback(async () => {
    setLoadingStats(true);
    setLoadingOrders(true);
    setLoadingItems(true);

    // Refresh all data
    await Promise.all([fetchStats(), fetchRecentOrders(), fetchPopularItems()]);
  }, [fetchStats, fetchRecentOrders, fetchPopularItems]);

  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='px-4 py-6 space-y-6'>
        {/* Welcome Section */}
        <div className='bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white'>
          <h1 className='text-2xl font-bold mb-2'>
            Welcome back, {user.name}!
          </h1>
          <p className='text-green-100'>
            Managing {user.university?.name || 'University'} •{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Critical Stats - Load First */}
        <Suspense fallback={<DashboardSkeleton />}>
          <StatsCardGrid
            stats={stats}
            loading={loadingStats}
            onRefresh={handleRefresh}
          />
        </Suspense>

        {/* Quick Actions */}
        <QuickActionsManager
          pendingApprovals={stats.pendingApprovals}
          universityId={user.universityId}
        />

        {/* Pending Approvals Widget */}
        <PendingApprovalsWidget />

        {/* Secondary Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Recent Orders Widget */}
          <Suspense
            fallback={
              <div className='h-64 bg-white rounded-xl animate-pulse' />
            }
          >
            <RecentOrdersWidget
              orders={recentOrders}
              loading={loadingOrders}
              universityId={user.universityId}
            />
          </Suspense>

          {/* Popular Items Widget */}
          <Suspense
            fallback={
              <div className='h-64 bg-white rounded-xl animate-pulse' />
            }
          >
            <PopularItemsWidget
              items={popularItems}
              loading={loadingItems}
              universityId={user.universityId}
            />
          </Suspense>
        </div>

        {/* Analytics Section (Lazy Loaded) */}
        <Suspense
          fallback={<div className='h-96 bg-white rounded-xl animate-pulse' />}
        >
          <ManagerAnalytics universityId={user.universityId} stats={stats} />
        </Suspense>
      </div>
    </div>
  );
}
