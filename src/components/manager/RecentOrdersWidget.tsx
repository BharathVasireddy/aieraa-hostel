'use client';

import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { format } from 'date-fns';

interface RecentOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemsCount: number;
}

interface RecentOrdersWidgetProps {
  orders: RecentOrder[];
  loading: boolean;
  universityId?: string;
}

interface OrderItemProps {
  order: RecentOrder;
  onClick: () => void;
}

const OrderItem = memo<OrderItemProps>(({ order, onClick }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className='w-4 h-4 text-orange-600' />;
      case 'APPROVED':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'PREPARING':
        return <Clock className='w-4 h-4 text-blue-600' />;
      case 'READY':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'SERVED':
        return <CheckCircle className='w-4 h-4 text-emerald-600' />;
      default:
        return <AlertCircle className='w-4 h-4 text-gray-600' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'SERVED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={() => void onClick()}
      className='p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3 flex-1'>
          {/* Status Icon */}
          <div className='flex-shrink-0'>{getStatusIcon(order.status)}</div>

          {/* Order Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2 mb-1'>
              <p className='font-medium text-gray-900 truncate'>
                {order.orderNumber}
              </p>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <div className='flex items-center space-x-4 text-sm text-gray-600'>
              <div className='flex items-center space-x-1'>
                <User className='w-3 h-3' />
                <span className='truncate'>{order.studentName}</span>
              </div>
              <span>{order.itemsCount} items</span>
              <span className='font-medium text-gray-900'>
                ₹{order.totalAmount}
              </span>
            </div>

            <p className='text-xs text-gray-500 mt-1'>
              {format(new Date(order.createdAt), 'MMM d, h:mm a')}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className='w-4 h-4 text-gray-400 flex-shrink-0 ml-2' />
      </div>
    </div>
  );
});

OrderItem.displayName = 'OrderItem';

const RecentOrdersWidget = memo<RecentOrdersWidgetProps>(
  ({ orders, loading, universityId }) => {
    const router = useRouter();

    const handleOrderClick = (orderId: string) => {
      router.push(`/manager/orders/${orderId}`);
    };

    const handleViewAll = () => {
      router.push('/manager/orders');
    };

    if (loading) {
      return (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          <div className='animate-pulse'>
            <div className='h-5 bg-gray-200 rounded w-32 mb-4'></div>
            <div className='space-y-3'>
              {[1, 2, 3].map(i => (
                <div key={i} className='flex items-center space-x-3'>
                  <div className='w-4 h-4 bg-gray-200 rounded'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-24'></div>
                    <div className='h-3 bg-gray-200 rounded w-32'></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
        {/* Header */}
        <div className='p-6 border-b border-gray-100'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold text-gray-900'>Recent Orders</h3>
            <button
              onClick={() => void handleViewAll()}
              className='text-sm text-green-600 hover:text-green-700 font-medium'
            >
              View All
            </button>
          </div>
          <p className='text-sm text-gray-600 mt-1'>
            Latest orders from your university
          </p>
        </div>

        {/* Orders List */}
        <div className='divide-y divide-gray-100'>
          {orders.length > 0 ? (
            orders.map(order => (
              <OrderItem
                key={order.id}
                order={order}
                onClick={() => handleOrderClick(order.id)}
              />
            ))
          ) : (
            <div className='p-8 text-center'>
              <Clock className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-600'>No recent orders</p>
              <p className='text-sm text-gray-500 mt-1'>
                Orders will appear here when students place them
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

RecentOrdersWidget.displayName = 'RecentOrdersWidget';

export default RecentOrdersWidget;
