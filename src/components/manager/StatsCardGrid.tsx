'use client';

import {
  ShoppingCart,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { memo } from 'react';

interface ManagerStats {
  todaysOrders: number;
  pendingApprovals: number;
  todaysRevenue: number;
  activeStudents: number;
  weeklyGrowth: number;
  monthlyRevenue: number;
}

interface StatsCardGridProps {
  stats: ManagerStats;
  loading: boolean;
  onRefresh: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: string;
  loading: boolean;
}

const StatCard = memo<StatCardProps>(
  ({ title, value, icon: Icon, color, change, loading }) => {
    if (loading) {
      return (
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
          <div className='animate-pulse'>
            <div className='w-8 h-8 bg-gray-200 rounded-lg mb-4'></div>
            <div className='h-4 bg-gray-200 rounded w-24 mb-2'></div>
            <div className='h-8 bg-gray-200 rounded w-16 mb-2'></div>
            <div className='h-3 bg-gray-200 rounded w-20'></div>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow'>
        <div className='flex items-center justify-between mb-4'>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
          >
            <Icon className='w-6 h-6 text-white' />
          </div>
          {change && (
            <div className='flex items-center space-x-1 text-sm'>
              <TrendingUp className='w-3 h-3 text-green-600' />
              <span className='text-green-600 font-medium'>{change}</span>
            </div>
          )}
        </div>

        <div>
          <p className='text-gray-600 text-sm font-medium mb-1'>{title}</p>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

const StatsCardGrid = memo<StatsCardGridProps>(
  ({ stats, loading, onRefresh }) => {
    const statCards = [
      {
        title: "Today's Orders",
        value: stats.todaysOrders,
        icon: ShoppingCart,
        color: 'bg-blue-600',
        change: stats.weeklyGrowth > 0 ? `+${stats.weeklyGrowth}%` : undefined,
      },
      {
        title: 'Pending Approvals',
        value: stats.pendingApprovals,
        icon: Clock,
        color: 'bg-orange-600',
      },
      {
        title: "Today's Revenue",
        value: `₹${stats.todaysRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: 'bg-green-600',
        change: stats.weeklyGrowth > 0 ? `+${stats.weeklyGrowth}%` : undefined,
      },
      {
        title: 'Active Students',
        value: stats.activeStudents,
        icon: Users,
        color: 'bg-purple-600',
      },
    ];

    return (
      <div className='space-y-4'>
        {/* Header with Refresh */}
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>Key Metrics</h2>
          <button
            onClick={onRefresh}
            className='p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              change={card.change}
              loading={loading}
            />
          ))}
        </div>

        {/* Additional Revenue Card */}
        {!loading && (
          <div className='bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-green-100 text-sm font-medium mb-1'>
                  Monthly Revenue
                </p>
                <p className='text-3xl font-bold'>
                  ₹{stats.monthlyRevenue.toLocaleString()}
                </p>
                {stats.weeklyGrowth > 0 && (
                  <p className='text-green-100 text-sm mt-2'>
                    ↗ Growing {stats.weeklyGrowth}% this week
                  </p>
                )}
              </div>
              <div className='w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center'>
                <DollarSign className='w-8 h-8 text-white' />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

StatsCardGrid.displayName = 'StatsCardGrid';

export default StatsCardGrid;
