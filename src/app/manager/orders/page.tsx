'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/UserProvider';
import { useSearchParams } from 'next/navigation';
import AnimatedDataTable, { Column } from '@/components/ui/AnimatedDataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  ShoppingCart,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Package,
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
    category: string;
  };
}

interface Order {
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
  };
  orderItems: OrderItem[];
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total: number;
    pending: number;
    approved: number;
    preparing: number;
    ready: number;
    served: number;
    cancelled: number;
  };
}

export default function ManagerOrdersPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams?.get('status')?.toUpperCase() || 'ALL'
  );
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    cancelled: 0,
  });

  const fetchOrders = useCallback(
    async (status = 'ALL') => {
      if (!user?.university?.id) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: '50',
        });

        if (status !== 'ALL') {
          params.append('status', status);
        }

        const response = await fetch(`/api/manager/orders?${params}`);

        if (response.ok) {
          const data: OrdersResponse = await response.json();
          setOrders(data.orders || []);
          setSummary(
            data.summary || {
              total: 0,
              pending: 0,
              approved: 0,
              preparing: 0,
              ready: 0,
              served: 0,
              cancelled: 0,
            }
          );
        }
      } catch (error) {
        // Failed to fetch orders
      } finally {
        setLoading(false);
      }
    },
    [user?.university?.id]
  );

  useEffect(() => {
    void fetchOrders(selectedStatus);
  }, [fetchOrders, selectedStatus]);

  // Watch for URL parameter changes
  useEffect(() => {
    const statusFromUrl = searchParams?.get('status')?.toUpperCase() || 'ALL';
    if (statusFromUrl !== selectedStatus) {
      setSelectedStatus(statusFromUrl);
      void fetchOrders(statusFromUrl);
    }
  }, [searchParams, selectedStatus, fetchOrders]);

  const updateOrderStatus = async (
    orderId: string,
    status: 'APPROVED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
  ) => {
    try {
      setUpdating(orderId);

      const response = await fetch(`/api/manager/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh orders list
        await fetchOrders(selectedStatus);
      }
    } catch (error) {
      // Failed to update order status
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      // Format date directly with timezone consideration
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
      return 'Invalid Date';
    }
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      
      return date.toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const columns: Column<Order>[] = [
    {
      id: 'orderNumber',
      header: 'Order',
      accessor: 'orderNumber',
      width: '15%',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className='font-semibold text-gray-900'>#{value}</p>
          <p className='text-xs text-gray-500'>{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      id: 'student',
      header: 'Student',
      accessor: 'user',
      width: '20%',
      render: (value, row) => (
        <div>
          <p className='font-medium text-gray-900'>{value.name}</p>
          <p className='text-xs text-gray-600'>{value.email}</p>
          {value.studentId && (
            <p className='text-xs text-gray-500'>ID: {value.studentId}</p>
          )}
        </div>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      accessor: 'orderItems',
      width: '25%',
      render: value => (
        <div>
          <p className='text-sm text-gray-900'>
            {value.length} item{value.length > 1 ? 's' : ''}
          </p>
          {value.slice(0, 2).map((item: any, index: number) => (
            <p key={index} className='text-xs text-gray-600 truncate'>
              {item.quantity}x {item.menuItem.name}
            </p>
          ))}
          {value.length > 2 && (
            <p className='text-xs text-gray-500'>+{value.length - 2} more</p>
          )}
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'totalAmount',
      width: '12%',
      sortable: true,
      render: value => (
        <div className='text-sm font-semibold text-gray-900'>
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      id: 'orderDate',
      header: 'Meal Date',
      accessor: 'orderDate',
      width: '12%',
      sortable: true,
      render: value => (
        <div className='text-sm text-gray-600'>{formatDateOnly(value)}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      width: '10%',
      sortable: true,
      render: value => <StatusBadge status={value} size='sm' />,
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: 'id',
      width: '16%',
      render: (value, row) => (
        <div className='flex items-center space-x-1'>
          <Link href={`/manager/orders/${row.orderNumber}`}>
            <button
              className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
              title='View Details'
            >
              <Eye className='w-3.5 h-3.5' />
            </button>
          </Link>

          {row.status === 'PENDING' && (
            <button
              onClick={() => updateOrderStatus(value, 'APPROVED')}
              disabled={updating === value}
              className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50'
              title='Approve Order'
            >
              {updating === value ? (
                <RefreshCw className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <CheckCircle className='w-3.5 h-3.5' />
              )}
            </button>
          )}

          {row.status === 'APPROVED' && (
            <button
              onClick={() => updateOrderStatus(value, 'PREPARING')}
              disabled={updating === value}
              className='p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50'
              title='Start Preparing'
            >
              {updating === value ? (
                <RefreshCw className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <Clock className='w-3.5 h-3.5' />
              )}
            </button>
          )}

          {row.status === 'PREPARING' && (
            <button
              onClick={() => updateOrderStatus(value, 'READY')}
              disabled={updating === value}
              className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50'
              title='Mark Ready'
            >
              {updating === value ? (
                <RefreshCw className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <Package className='w-3.5 h-3.5' />
              )}
            </button>
          )}

          {row.status === 'READY' && (
            <button
              onClick={() => updateOrderStatus(value, 'SERVED')}
              disabled={updating === value}
              className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50'
              title='Mark Served'
            >
              {updating === value ? (
                <RefreshCw className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <CheckCircle className='w-3.5 h-3.5' />
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Order Management</h1>
          <p className='text-gray-600'>
            Manage and track all orders for{' '}
            {user?.university?.name || 'your university'}
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => fetchOrders(selectedStatus)}
            className='flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4'>
        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <ShoppingCart className='w-8 h-8 text-blue-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Total</p>
              <p className='text-2xl font-bold text-blue-600'>
                {summary.total}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <Clock className='w-8 h-8 text-orange-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Pending</p>
              <p className='text-2xl font-bold text-orange-600'>
                {summary.pending}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <CheckCircle className='w-8 h-8 text-green-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Approved</p>
              <p className='text-2xl font-bold text-green-600'>
                {summary.approved}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <AlertCircle className='w-8 h-8 text-yellow-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Preparing</p>
              <p className='text-2xl font-bold text-yellow-600'>
                {summary.preparing}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <Package className='w-8 h-8 text-blue-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Ready</p>
              <p className='text-2xl font-bold text-blue-600'>
                {summary.ready}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <CheckCircle className='w-8 h-8 text-purple-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Served</p>
              <p className='text-2xl font-bold text-purple-600'>
                {summary.served}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <AlertCircle className='w-8 h-8 text-red-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Cancelled</p>
              <p className='text-2xl font-bold text-red-600'>
                {summary.cancelled}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className='bg-white rounded-lg border border-gray-200 p-4'>
        <div className='flex items-center space-x-4'>
          <span className='text-sm font-medium text-gray-700'>
            Filter by status:
          </span>
          {[
            'ALL',
            'PENDING',
            'APPROVED',
            'PREPARING',
            'READY',
            'SERVED',
            'CANCELLED',
          ].map(status => (
            <button
              key={status}
              onClick={async () => {
                setSelectedStatus(status);
                await fetchOrders(status);
              }}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <AnimatedDataTable
        data={orders}
        columns={columns}
        loading={loading}
        searchable={true}
        pagination={true}
        pageSize={20}
        paginationLabel='orders'
        enableAnimations={true}
        enableKeyboardNavigation={true}
        animationDelay={0.03}
        staggerDelay={0.08}
        showGradients={true}
        emptyState={{
          title: 'No orders found',
          description: 'No orders match the current filter criteria.',
          icon: ShoppingCart,
        }}
        onRowClick={(order) => {
          // Navigate to order details
          window.location.href = `/manager/orders/${order.orderNumber}`;
        }}
      />
    </div>
  );
}
