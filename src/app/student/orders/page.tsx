'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  Eye,
  Package,
  RefreshCw,
  ChevronRight,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import StudentLayout from '@/components/StudentLayout';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  orderItems: OrderItem[];
}

type FilterStatus = 'active' | 'completed';

export default function StudentOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('active');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders', { cache: 'no-store' });

      if (!response.ok) {throw new Error('Failed to fetch orders');}

      const data = await response.json();
      const processedOrders = (data.orders || data || []).sort(
        (a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(processedOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          text: 'Pending',
        };
      case 'APPROVED':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          text: 'Approved',
        };
      case 'PREPARING':
        return {
          icon: Package,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          text: 'Preparing',
        };
      case 'READY':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          text: 'Ready',
        };
      case 'SERVED':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          text: 'Completed',
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          text: status,
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') {
      return ['PENDING', 'APPROVED', 'PREPARING', 'READY'].includes(
        order.status
      );
    }
    return ['SERVED', 'CANCELLED'].includes(order.status);
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const formatOrderDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd');
    } catch {
      return 'N/A';
    }
  };

  return (
    <StudentLayout showDatePicker={false}>
      <div className='bg-white min-h-screen'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Package className='w-6 h-6 text-gray-700' />
              <h1 className='text-xl font-bold text-gray-900'>My Orders</h1>
            </div>
            <button
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className='flex mt-4 bg-gray-100 rounded-lg p-1'>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Order History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='px-4 py-4'>
          {loading ? (
            <div className='space-y-3'>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className='bg-white border border-gray-200 rounded-lg p-4 animate-pulse'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-gray-200 rounded'></div>
                      <div>
                        <div className='h-4 bg-gray-200 rounded w-20 mb-2'></div>
                        <div className='h-3 bg-gray-200 rounded w-16'></div>
                      </div>
                    </div>
                    <div className='h-6 bg-gray-200 rounded w-16'></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className='text-center py-16'>
              <Package className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                {filter === 'active' ? 'No active orders' : 'No order history'}
              </h3>
              <p className='text-gray-500 mb-6'>
                {filter === 'active'
                  ? 'Place your first order to get started!'
                  : 'Your completed orders will appear here'}
              </p>
              {filter === 'active' && (
                <button
                  onClick={() => router.push('/student/menu')}
                  className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
                >
                  Browse Menu
                </button>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredOrders.map(order => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <button
                    key={order.id}
                    onClick={() =>
                      router.push(`/student/orders/${order.orderNumber}`)
                    }
                    className='w-full bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-left group'
                  >
                    {/* Top Section - Order Number & Amount */}
                    <div className='bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-100'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='text-xl font-bold text-gray-900 mb-1'>
                            #{order.orderNumber}
                          </h3>
                          <div className='flex items-center space-x-3 text-sm text-gray-600'>
                            <span>{order.orderItems.length} items</span>
                            <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                            <div className='flex items-center space-x-1'>
                              <Calendar className='w-3 h-3' />
                              <span>{formatOrderDate(order.orderDate)}</span>
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='flex items-center text-2xl font-bold text-gray-900 mb-1'>
                            <IndianRupee className='w-6 h-6' />
                            <span>{order.totalAmount.toFixed(0)}</span>
                          </div>
                          <div className='text-xs text-gray-500'>
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Section - Items */}
                    <div className='p-5'>
                      {order.orderItems.length > 0 && (
                        <div className='mb-4'>
                          {order.orderItems.length <= 3 ? (
                            /* Show all items if 3 or fewer */
                            <div className='grid gap-2'>
                              {order.orderItems.map(item => (
                                <div
                                  key={item.id}
                                  className='bg-gray-50 rounded-xl p-3 flex items-center justify-between'
                                >
                                  <div className='flex items-center space-x-3'>
                                    <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200'>
                                      <span className='text-sm font-bold text-gray-700'>
                                        {item.quantity}
                                      </span>
                                    </div>
                                    <span className='font-medium text-gray-900'>
                                      {item.menuItem.name}
                                    </span>
                                  </div>
                                  <span className='font-bold text-gray-900 flex items-center'>
                                    <IndianRupee className='w-4 h-4' />
                                    {(item.price * item.quantity).toFixed(0)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Show first 2 items + summary for 4+ items */
                            <div className='grid gap-2'>
                              {order.orderItems.slice(0, 2).map(item => (
                                <div
                                  key={item.id}
                                  className='bg-gray-50 rounded-xl p-3 flex items-center justify-between'
                                >
                                  <div className='flex items-center space-x-3'>
                                    <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200'>
                                      <span className='text-sm font-bold text-gray-700'>
                                        {item.quantity}
                                      </span>
                                    </div>
                                    <span className='font-medium text-gray-900'>
                                      {item.menuItem.name}
                                    </span>
                                  </div>
                                  <span className='font-bold text-gray-900 flex items-center'>
                                    <IndianRupee className='w-4 h-4' />
                                    {(item.price * item.quantity).toFixed(0)}
                                  </span>
                                </div>
                              ))}
                              <div className='bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between'>
                                <span className='font-medium text-blue-700'>
                                  View {order.orderItems.length - 2} more items
                                </span>
                                <ChevronRight className='w-4 h-4 text-blue-500' />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Section */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <div
                            className={`w-10 h-10 ${statusInfo.bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
                          >
                            <StatusIcon
                              className={`w-5 h-5 ${statusInfo.color}`}
                            />
                          </div>
                          <div>
                            <span
                              className={`px-3 py-1 ${statusInfo.bg} ${statusInfo.color} text-sm font-semibold rounded-full`}
                            >
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className='w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200' />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
