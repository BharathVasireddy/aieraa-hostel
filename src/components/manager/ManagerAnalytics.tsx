'use client';

import { BarChart3, TrendingUp, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { memo } from 'react';

interface ManagerStats {
  todaysOrders: number;
  pendingApprovals: number;
  todaysRevenue: number;
  activeStudents: number;
  weeklyGrowth: number;
  monthlyRevenue: number;
}

interface ManagerAnalyticsProps {
  universityId?: string;
  stats: ManagerStats;
}

interface WeeklyData {
  day: string;
  orders: number;
  revenue: number;
}

const ManagerAnalytics = memo<ManagerAnalyticsProps>(
  ({ universityId, stats }) => {
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchWeeklyData = async () => {
        if (!universityId) return;

        try {
          // Simulate API call delay
          setTimeout(() => {
            // Mock weekly data
            const mockData: WeeklyData[] = [
              { day: 'Mon', orders: 12, revenue: 2400 },
              { day: 'Tue', orders: 19, revenue: 3800 },
              { day: 'Wed', orders: 15, revenue: 3000 },
              { day: 'Thu', orders: 22, revenue: 4400 },
              { day: 'Fri', orders: 18, revenue: 3600 },
              { day: 'Sat', orders: 8, revenue: 1600 },
              { day: 'Sun', orders: 5, revenue: 1000 },
            ];
            setWeeklyData(mockData);
            setLoading(false);
          }, 800); // Simulate network delay
        } catch (error) {
          console.error('Failed to fetch weekly data:', error);
          setLoading(false);
        }
      };

      fetchWeeklyData();
    }, [universityId]);

    const maxOrders = Math.max(...weeklyData.map(d => d.orders), 1);
    const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);

    if (loading) {
      return (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          <div className='animate-pulse'>
            <div className='h-5 bg-gray-200 rounded w-32 mb-4'></div>
            <div className='h-48 bg-gray-200 rounded'></div>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
        {/* Header */}
        <div className='p-6 border-b border-gray-100'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <BarChart3 className='w-5 h-5 text-green-600' />
              <h3 className='font-semibold text-gray-900'>Weekly Analytics</h3>
            </div>
            <div className='flex items-center space-x-2 text-sm text-green-600'>
              <TrendingUp className='w-4 h-4' />
              <span className='font-medium'>
                +{stats.weeklyGrowth}% this week
              </span>
            </div>
          </div>
          <p className='text-sm text-gray-600 mt-1'>
            Orders and revenue trends for your university
          </p>
        </div>

        {/* Analytics Content */}
        <div className='p-6'>
          {/* Summary Cards */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>
                {weeklyData.reduce((sum, d) => sum + d.orders, 0)}
              </p>
              <p className='text-sm text-gray-600'>Weekly Orders</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>
                ₹
                {weeklyData
                  .reduce((sum, d) => sum + d.revenue, 0)
                  .toLocaleString()}
              </p>
              <p className='text-sm text-gray-600'>Weekly Revenue</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>
                {Math.round(
                  weeklyData.reduce((sum, d) => sum + d.revenue, 0) /
                    weeklyData.reduce((sum, d) => sum + d.orders, 0) || 0
                )}
              </p>
              <p className='text-sm text-gray-600'>Avg Order Value</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>
                {stats.activeStudents}
              </p>
              <p className='text-sm text-gray-600'>Active Students</p>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className='space-y-4'>
            <h4 className='font-medium text-gray-900'>
              Daily Orders This Week
            </h4>
            <div className='space-y-3'>
              {weeklyData.map(day => (
                <div key={day.day} className='flex items-center space-x-3'>
                  <div className='w-8 text-sm text-gray-600 font-medium'>
                    {day.day}
                  </div>
                  <div className='flex-1 bg-gray-200 rounded-full h-6 relative'>
                    <div
                      className='bg-green-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2'
                      style={{ width: `${(day.orders / maxOrders) * 100}%` }}
                    >
                      <span className='text-white text-xs font-medium'>
                        {day.orders}
                      </span>
                    </div>
                  </div>
                  <div className='w-16 text-sm text-gray-600 text-right'>
                    ₹{day.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className='mt-6 pt-6 border-t border-gray-100'>
            <h4 className='font-medium text-gray-900 mb-3'>Quick Insights</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-blue-50 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Calendar className='w-4 h-4 text-blue-600' />
                  <span className='text-sm font-medium text-blue-900'>
                    Peak Day
                  </span>
                </div>
                <p className='text-blue-700'>
                  {weeklyData.reduce(
                    (max, day) => (day.orders > max.orders ? day : max),
                    weeklyData[0]
                  )?.day || 'N/A'}{' '}
                  with {Math.max(...weeklyData.map(d => d.orders))} orders
                </p>
              </div>

              <div className='bg-green-50 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Clock className='w-4 h-4 text-green-600' />
                  <span className='text-sm font-medium text-green-900'>
                    Avg Processing
                  </span>
                </div>
                <p className='text-green-700'>
                  Orders processed within 15 minutes during peak hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ManagerAnalytics.displayName = 'ManagerAnalytics';

export default ManagerAnalytics;
