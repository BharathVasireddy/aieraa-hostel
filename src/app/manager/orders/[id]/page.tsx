'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Package,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    category: string;
    imageUrl?: string;
  };
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'PREPARING'
    | 'READY'
    | 'SERVED'
    | 'CANCELLED';
  createdAt: string;
  deliveryDate: string;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
    studentId?: string;
    phone?: string;
    roomNumber?: string;
  };
  orderItems: OrderItem[];
  university: {
    name: string;
    code: string;
  };
}

export default function ManagerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderId = params?.id as string;

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/manager/orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    status: 'APPROVED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
  ) => {
    if (!order) return;

    try {
      setUpdating(true);

      const response = await fetch(`/api/manager/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const data = await response.json();
      setOrder(prev => (prev ? { ...prev, status: data.order.status } : null));
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const vietnamDate = new Date(
      date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
    );

    const day = vietnamDate.getDate().toString().padStart(2, '0');
    const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
    const year = vietnamDate.getFullYear();
    const hours = vietnamDate.getHours().toString().padStart(2, '0');
    const minutes = vietnamDate.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-300 rounded w-1/3 mb-4'></div>
          <div className='h-64 bg-gray-300 rounded mb-6'></div>
          <div className='h-32 bg-gray-300 rounded'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Error Loading Order
        </h2>
        <p className='text-gray-600 mb-4'>{error}</p>
        <button
          onClick={() => router.push('/manager/orders')}
          className='inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          <span>Back to Orders</span>
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className='text-center py-12'>
        <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Order Not Found
        </h2>
        <p className='text-gray-600 mb-4'>
          The order you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Link
          href='/manager/orders'
          className='inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          <span>Back to Orders</span>
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link
            href='/manager/orders'
            className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>Back to Orders</span>
          </Link>
          <div className='h-6 w-px bg-gray-300'></div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Order #{order.orderNumber}
            </h1>
            <p className='text-gray-600'>
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} size='md' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Order Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Order Items */}
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Order Items
            </h2>
            <div className='space-y-4'>
              {order.orderItems.map(item => (
                <div
                  key={item.id}
                  className='flex items-center space-x-4 p-4 bg-gray-50 rounded-lg'
                >
                  <div className='w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center'>
                    {item.menuItem.imageUrl ? (
                      <img
                        src={item.menuItem.imageUrl}
                        alt={item.menuItem.name}
                        className='w-full h-full object-cover rounded-lg'
                      />
                    ) : (
                      <Package className='w-8 h-8 text-gray-400' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-900'>
                      {item.menuItem.name}
                    </h3>
                    <p className='text-sm text-gray-600'>
                      {item.menuItem.description}
                    </p>
                    <div className='flex items-center space-x-2 mt-1'>
                      <span className='text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded'>
                        {item.menuItem.category}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-gray-900'>
                      Qty: {item.quantity}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {formatCurrency(item.price)} each
                    </p>
                    <p className='font-semibold text-green-600'>
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className='border-t border-gray-200 mt-4 pt-4'>
              <div className='flex items-center justify-between'>
                <span className='text-lg font-semibold text-gray-900'>
                  Total Amount:
                </span>
                <span className='text-xl font-bold text-green-600'>
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Special Instructions
              </h2>
              <div className='flex items-start space-x-3'>
                <MessageSquare className='w-5 h-5 text-gray-400 mt-0.5' />
                <p className='text-gray-700'>{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Student Information */}
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Student Information
            </h2>
            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <User className='w-5 h-5 text-gray-400' />
                <div>
                  <p className='font-medium text-gray-900'>{order.user.name}</p>
                  <p className='text-sm text-gray-600'>{order.user.email}</p>
                </div>
              </div>
              {order.user.studentId && (
                <div className='flex items-center space-x-3'>
                  <Package className='w-5 h-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Student ID</p>
                    <p className='font-medium text-gray-900'>
                      {order.user.studentId}
                    </p>
                  </div>
                </div>
              )}
              {order.user.roomNumber && (
                <div className='flex items-center space-x-3'>
                  <Package className='w-5 h-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Room Number</p>
                    <p className='font-medium text-gray-900'>
                      {order.user.roomNumber}
                    </p>
                  </div>
                </div>
              )}
              {order.user.phone && (
                <div className='flex items-center space-x-3'>
                  <Package className='w-5 h-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Phone</p>
                    <p className='font-medium text-gray-900'>
                      {order.user.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Delivery Information
            </h2>
            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <Calendar className='w-5 h-5 text-gray-400' />
                <div>
                  <p className='text-sm text-gray-600'>Delivery Date</p>
                  <p className='font-medium text-gray-900'>
                    {formatDate(order.deliveryDate)}
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-3'>
                <DollarSign className='w-5 h-5 text-gray-400' />
                <div>
                  <p className='text-sm text-gray-600'>Total Amount</p>
                  <p className='font-medium text-green-600'>
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Order Actions
            </h2>
            <div className='space-y-3'>
              {order.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => updateOrderStatus('APPROVED')}
                    disabled={updating}
                    className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50'
                  >
                    {updating ? (
                      <RefreshCw className='w-4 h-4 animate-spin' />
                    ) : (
                      <CheckCircle className='w-4 h-4' />
                    )}
                    <span>Approve Order</span>
                  </button>
                  <button
                    onClick={() => updateOrderStatus('CANCELLED')}
                    disabled={updating}
                    className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50'
                  >
                    <XCircle className='w-4 h-4' />
                    <span>Cancel Order</span>
                  </button>
                </>
              )}

              {order.status === 'APPROVED' && (
                <>
                  <button
                    onClick={() => updateOrderStatus('PREPARING')}
                    disabled={updating}
                    className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50'
                  >
                    {updating ? (
                      <RefreshCw className='w-4 h-4 animate-spin' />
                    ) : (
                      <Clock className='w-4 h-4' />
                    )}
                    <span>Start Preparing</span>
                  </button>
                  <button
                    onClick={() => updateOrderStatus('CANCELLED')}
                    disabled={updating}
                    className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50'
                  >
                    <XCircle className='w-4 h-4' />
                    <span>Cancel Order</span>
                  </button>
                </>
              )}

              {order.status === 'PREPARING' && (
                <>
                  <button
                    onClick={() => updateOrderStatus('READY')}
                    disabled={updating}
                    className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
                  >
                    {updating ? (
                      <RefreshCw className='w-4 h-4 animate-spin' />
                    ) : (
                      <Package className='w-4 h-4' />
                    )}
                    <span>Mark Ready</span>
                  </button>
                  <button
                    onClick={() => updateOrderStatus('CANCELLED')}
                    disabled={updating}
                    className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50'
                  >
                    <XCircle className='w-4 h-4' />
                    <span>Cancel Order</span>
                  </button>
                </>
              )}

              {order.status === 'READY' && (
                <button
                  onClick={() => updateOrderStatus('SERVED')}
                  disabled={updating}
                  className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50'
                >
                  {updating ? (
                    <RefreshCw className='w-4 h-4 animate-spin' />
                  ) : (
                    <CheckCircle className='w-4 h-4' />
                  )}
                  <span>Mark Served</span>
                </button>
              )}

              {(order.status === 'SERVED' || order.status === 'CANCELLED') && (
                <div className='text-center py-4'>
                  <p className='text-gray-600'>
                    Order is {order.status.toLowerCase()}
                  </p>
                  <p className='text-sm text-gray-500'>
                    No further actions available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
