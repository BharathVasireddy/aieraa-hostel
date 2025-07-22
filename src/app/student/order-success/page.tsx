'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Home,
  Package,
  Receipt,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/components/UserProvider';

interface OrderDetails {
  id: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    menuItem: {
      id: string;
      name: string;
    };
  }[];
  user: {
    id: string;
    name: string;
    university: {
      name: string;
    };
  };
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId || !orderNumber) {
      setError('Order information not found');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (response.ok && data && data.id) {
          setOrder(data);
        } else {
          setError(data.error || 'Failed to fetch order details');
        }
      } catch (error) {
        console.error(error);
        setError('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, orderNumber]);

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center px-4'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Package className='w-8 h-8 text-gray-600' />
          </div>
          <h2 className='text-xl font-bold text-gray-900 mb-2'>
            Order Not Found
          </h2>
          <p className='text-gray-600 mb-6'>
            {error || 'The requested order could not be found.'}
          </p>
          <button
            onClick={() => router.push('/student')}
            className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (order.status) {
      case 'PENDING':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          icon: Clock,
          title: 'Order Received',
          message: 'Your order has been placed successfully'
        };
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: CheckCircle,
          title: 'Order Confirmed',
          message: 'Your order has been placed successfully'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10'>
        <div className='flex items-center justify-between'>
          <button
            onClick={() => router.push('/student')}
            className='flex items-center text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ArrowLeft className='w-5 h-5 mr-2' />
            <span className='font-medium'>Back</span>
          </button>
          <h1 className='text-lg font-bold text-gray-900'>
            Order Confirmation
          </h1>
          <div className='w-20'></div>
        </div>
      </div>

      <div className='px-4 py-8'>
        {/* Success Status */}
        <div className='text-center mb-8'>
          <div className={`w-20 h-20 ${statusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={`w-10 h-10 ${statusConfig.color}`} />
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            {statusConfig.title}
          </h2>
          <p className='text-gray-600 mb-4'>
            {statusConfig.message}
          </p>
          <div className='text-xl font-bold text-green-600'>
            #{order.orderNumber}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6'>
          <div className='flex items-center space-x-3 mb-4'>
            <Receipt className='w-5 h-5 text-gray-600' />
            <h3 className='text-lg font-semibold text-gray-900'>Order Summary</h3>
          </div>
          
          <div className='space-y-3'>
            {order.orderItems.map(item => (
              <div key={item.id} className='flex justify-between items-center py-2'>
                <div>
                  <span className='font-medium text-gray-900'>{item.menuItem.name}</span>
                  <span className='text-gray-500 ml-2'>× {item.quantity}</span>
                </div>
                <span className='font-medium text-gray-900'>
                  ₹{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            
            <div className='border-t border-gray-200 pt-3 mt-4'>
              <div className='flex justify-between items-center'>
                <span className='text-lg font-semibold text-gray-900'>Total</span>
                <span className='text-xl font-bold text-green-600'>
                  ₹{order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8'>
          <div className='flex items-start space-x-3'>
            <MapPin className='w-5 h-5 text-blue-600 mt-0.5' />
            <div>
              <h4 className='font-semibold text-blue-800 mb-1'>Delivery Information</h4>
              <p className='text-blue-700 text-sm'>
                {order.user.university.name} • {format(new Date(order.orderDate), 'MMM dd, yyyy')}
              </p>
              <p className='text-blue-700 text-sm'>
                Payment: {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='space-y-3'>
          <button
            onClick={() => router.push('/student/orders')}
            className='w-full py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors'
          >
            Track Your Order
          </button>

          <button
            onClick={() => router.push('/student/menu')}
            className='w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
          >
            Order More Food
          </button>

          <button
            onClick={() => router.push('/student')}
            className='w-full flex items-center justify-center space-x-2 py-3 text-gray-600 hover:text-gray-900 transition-colors'
          >
            <Home className='w-4 h-4' />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  const router = useRouter();
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-white flex items-center justify-center'>
          <div className='w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin'></div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
