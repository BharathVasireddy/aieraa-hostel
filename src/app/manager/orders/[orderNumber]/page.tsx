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
import { ToastContainer, showToast } from '@/components/ui/Toast';

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
  orderDate: string;
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

  const orderNumber = params?.orderNumber as string;

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/by-number/${orderNumber}`);

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
    if (!order) {return;}

    try {
      setUpdating(true);

      const response = await fetch(`/api/manager/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const data = await response.json();
      setOrder(prev => (prev ? { ...prev, status: data.order.status } : null));
      
      // Show success toast
      const statusMessages = {
        'APPROVED': 'Order approved successfully!',
        'PREPARING': 'Order marked as preparing',
        'READY': 'Order marked as ready for pickup',
        'SERVED': 'Order marked as served',
        'CANCELLED': 'Order cancelled'
      };
      
      showToast({
        type: 'success',
        title: statusMessages[status] || 'Order updated successfully',
        message: `Order #${order.orderNumber} status changed to ${status.toLowerCase()}`
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
      showToast({
        type: 'error',
        title: 'Failed to update order',
        message: 'Please try again or contact support if the problem persists.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) {return 'N/A';}
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {return 'Invalid Date';}
      
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      
      return date.toLocaleDateString('en-GB', options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) {return 'N/A';}
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {return 'Invalid Date';}
      
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      
      return date.toLocaleString('en-GB', options).replace(',', '');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
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
    <div className='space-y-4 md:space-y-6'>
      <ToastContainer />
      
      {/* Shopify-style Header with Inline Actions */}
      <div className='bg-white rounded-lg border border-gray-200 p-4 md:p-6'>
        {/* Back Button and Status */}
        <div className='flex items-center justify-between mb-6'>
          <Link
            href='/manager/orders'
            className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            <span className='hidden sm:inline'>Back to Orders</span>
            <span className='sm:hidden'>Back</span>
          </Link>
          <StatusBadge status={order.status} size='md' />
        </div>
        
        {/* Order Info and Actions Row */}
        <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
          {/* Left side - Order Information */}
          <div className='flex-1'>
            <h1 className='text-xl md:text-2xl font-bold text-gray-900 mb-2'>
              Order #{order.orderNumber}
            </h1>
            <div className='text-sm md:text-base text-gray-600 space-y-1'>
              <p>Placed on {formatDateTime(order.createdAt)}</p>
              <p>Meal Date: {formatDateOnly(order.orderDate)}</p>
            </div>
          </div>
          
          {/* Right side - Action Buttons */}
          {(order.status !== 'SERVED' && order.status !== 'CANCELLED') && (
            <div className='flex-shrink-0'>
              <div className='flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row'>
                {order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus('APPROVED')}
                      disabled={updating}
                      className='flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium min-w-[120px]'
                    >
                      {updating ? (
                        <RefreshCw className='w-4 h-4 animate-spin' />
                      ) : (
                        <CheckCircle className='w-4 h-4' />
                      )}
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => updateOrderStatus('CANCELLED')}
                      disabled={updating}
                      className='flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium min-w-[120px]'
                    >
                      <XCircle className='w-4 h-4' />
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                {order.status === 'APPROVED' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus('PREPARING')}
                      disabled={updating}
                      className='flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm font-medium min-w-[140px]'
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
                      className='flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium min-w-[120px]'
                    >
                      <XCircle className='w-4 h-4' />
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                {order.status === 'PREPARING' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus('READY')}
                      disabled={updating}
                      className='flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium min-w-[120px]'
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
                      className='flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium min-w-[120px]'
                    >
                      <XCircle className='w-4 h-4' />
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                {order.status === 'READY' && (
                  <button
                    onClick={() => updateOrderStatus('SERVED')}
                    disabled={updating}
                    className='flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium min-w-[140px]'
                  >
                    {updating ? (
                      <RefreshCw className='w-4 h-4 animate-spin' />
                    ) : (
                      <CheckCircle className='w-4 h-4' />
                    )}
                    <span>Mark Served</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
        {/* Main Order Details */}
        <div className='lg:col-span-2 space-y-4 md:space-y-6'>
          {/* Order Items */}
          <div className='bg-white rounded-lg border border-gray-200 p-4 md:p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Order Items
            </h2>
            <div className='space-y-3 md:space-y-4'>
              {order.orderItems.map(item => (
                <div
                  key={item.id}
                  className='flex items-start space-x-3 md:space-x-4 p-3 md:p-4 bg-gray-50 rounded-lg'
                >
                  <div className='w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0'>
                    {item.menuItem.imageUrl ? (
                      <img
                        src={item.menuItem.imageUrl}
                        alt={item.menuItem.name}
                        className='w-full h-full object-cover rounded-lg'
                        onError={(e) => {
                          // If image fails to load, show placeholder
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Package className={`w-6 h-6 md:w-8 md:h-8 text-gray-400 ${item.menuItem.imageUrl ? 'hidden' : ''}`} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-gray-900 text-sm md:text-base'>
                      {item.menuItem.name}
                    </h3>
                    <p className='text-xs md:text-sm text-gray-600 mt-1 line-clamp-2'>
                      {item.menuItem.description}
                    </p>
                    <div className='flex items-center justify-between mt-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded'>
                          {item.menuItem.category}
                        </span>
                        <span className='text-xs text-gray-600'>
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs md:text-sm text-gray-600'>
                          {formatCurrency(item.price)} each
                        </p>
                        <p className='font-semibold text-green-600 text-sm md:text-base'>
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='border-t border-gray-200 mt-4 pt-4'>
              <div className='flex items-center justify-between'>
                <span className='text-base md:text-lg font-semibold text-gray-900'>
                  Total Amount:
                </span>
                <span className='text-lg md:text-xl font-bold text-green-600'>
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className='bg-white rounded-lg border border-gray-200 p-4 md:p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Special Instructions
              </h2>
              <div className='flex items-start space-x-3'>
                <MessageSquare className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                <p className='text-gray-700 text-sm md:text-base'>{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Stacks on mobile */}
        <div className='space-y-4 md:space-y-6'>
          {/* Student Information */}
          <div className='bg-white rounded-lg border border-gray-200 p-4 md:p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Student Information
            </h2>
            <div className='space-y-3'>
              <div className='flex items-start space-x-3'>
                <User className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                <div className='min-w-0'>
                  <p className='font-medium text-gray-900 text-sm md:text-base'>{order.user.name}</p>
                  <p className='text-xs md:text-sm text-gray-600 break-words'>{order.user.email}</p>
                </div>
              </div>
              
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3'>
                {order.user.studentId && (
                  <div className='flex items-center space-x-3'>
                    <Package className='w-4 h-4 text-gray-400 flex-shrink-0' />
                    <div className='min-w-0'>
                      <p className='text-xs text-gray-600'>Student ID</p>
                      <p className='font-medium text-gray-900 text-sm'>
                        {order.user.studentId}
                      </p>
                    </div>
                  </div>
                )}
                {order.user.roomNumber && (
                  <div className='flex items-center space-x-3'>
                    <Package className='w-4 h-4 text-gray-400 flex-shrink-0' />
                    <div className='min-w-0'>
                      <p className='text-xs text-gray-600'>Room Number</p>
                      <p className='font-medium text-gray-900 text-sm'>
                        {order.user.roomNumber}
                      </p>
                    </div>
                  </div>
                )}
                {order.user.phone && (
                  <div className='flex items-center space-x-3'>
                    <Package className='w-4 h-4 text-gray-400 flex-shrink-0' />
                    <div className='min-w-0'>
                      <p className='text-xs text-gray-600'>Phone</p>
                      <p className='font-medium text-gray-900 text-sm'>
                        {order.user.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className='bg-white rounded-lg border border-gray-200 p-4 md:p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Order Summary
            </h2>
            <div className='space-y-3'>
              <div className='flex items-center justify-between py-2 border-b border-gray-100'>
                <span className='text-sm text-gray-600'>Items</span>
                <span className='text-sm font-medium text-gray-900'>
                  {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className='flex items-center justify-between py-2 border-b border-gray-100'>
                <span className='text-sm text-gray-600'>Meal Date</span>
                <span className='text-sm font-medium text-gray-900'>
                  {formatDateOnly(order.orderDate)}
                </span>
              </div>
              <div className='flex items-center justify-between py-2'>
                <span className='text-sm text-gray-600'>Total Amount</span>
                <span className='text-base font-bold text-green-600'>
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 