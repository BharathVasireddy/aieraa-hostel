import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChefHat, CheckCircle, ArrowRight, Calendar, Package } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED';
  deliveryDate: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  totalAmount: number;
}

interface OrderStatusWidgetProps {
  currentOrder?: Order;
  upcomingOrders?: Order[];
  loading?: boolean;
}

const OrderStatusWidget: React.FC<OrderStatusWidgetProps> = ({ 
  currentOrder, 
  upcomingOrders = [],
  loading = false 
}) => {
  const router = useRouter();

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Order Placed',
          icon: Clock,
          className: 'status-pending',
          bgColor: 'bg-warning-50'
        };
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          icon: CheckCircle,
          className: 'status-confirmed',
          bgColor: 'bg-info-50'
        };
      case 'PREPARING':
        return {
          label: 'Preparing',
          icon: ChefHat,
          className: 'status-ready',
          bgColor: 'bg-primary-50'
        };
      case 'READY':
        return {
          label: 'Ready for Pickup',
          icon: Package,
          className: 'status-ready',
          bgColor: 'bg-success-50'
        };
      case 'SERVED':
        return {
          label: 'Served',
          icon: CheckCircle,
          className: 'status-served',
          bgColor: 'bg-success-50'
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          className: 'status-pending',
          bgColor: 'bg-neutral-50'
        };
    }
  };

  const handleOrderClick = (orderNumber: string) => {
    router.push(`/student/orders/${orderNumber}`);
  };

  const handleViewAllOrders = () => {
    router.push('/student/orders');
  };

  // Safe date formatting function
  const formatDate = (dateString: string | undefined | null, formatString: string): string => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, formatString);
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-20 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-heading-3 mb-1">Order Status</h2>
          <p className="text-body-sm">Track your meals</p>
        </div>
        <button
          onClick={handleViewAllOrders}
          className="btn-ghost btn-sm"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {currentOrder ? (
        <div 
          className="card-interactive p-4 mb-4 cursor-pointer"
          onClick={() => handleOrderClick(currentOrder.orderNumber)}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-heading-4 mb-1">#{currentOrder.orderNumber}</h3>
              <p className="text-caption">
                {formatDate(currentOrder.deliveryDate, 'MMM d, yyyy')}
              </p>
            </div>
            
            <div className="text-right">
              <div className={getStatusConfig(currentOrder.status).className}>
                {getStatusConfig(currentOrder.status).label}
              </div>
              <p className="text-body-sm font-medium mt-1">₹{currentOrder.totalAmount}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`icon-container-sm ${getStatusConfig(currentOrder.status).bgColor}`}>
              {React.createElement(getStatusConfig(currentOrder.status).icon, {
                className: `w-4 h-4 ${getStatusConfig(currentOrder.status).className.includes('success') ? 'text-success-600' : 
                  getStatusConfig(currentOrder.status).className.includes('warning') ? 'text-warning-600' :
                  getStatusConfig(currentOrder.status).className.includes('info') ? 'text-info-600' : 'text-primary-600'}`
              })}
            </div>
            <div className="flex-1">
              <p className="text-body-sm">
                {currentOrder.items.length} item{currentOrder.items.length > 1 ? 's' : ''}
                {currentOrder.items.length <= 2 && (
                  <span className="text-neutral-500"> • {currentOrder.items.map(item => item.name).join(', ')}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="icon-container mx-auto mb-3">
            <Package className="w-5 h-5 text-neutral-500" />
          </div>
          <p className="text-body-sm text-neutral-600 mb-3">No active orders</p>
          <button 
            onClick={() => router.push('/student/menu')}
            className="btn-primary btn-sm"
          >
            Order Now
          </button>
        </div>
      )}

      {upcomingOrders.length > 0 && (
        <div>
          <h3 className="text-body font-medium mb-3">Upcoming Orders</h3>
          <div className="space-y-2">
            {upcomingOrders.slice(0, 2).map((order) => (
              <div 
                key={order.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => handleOrderClick(order.orderNumber)}
              >
                <div className="flex items-center space-x-3">
                  <div className="icon-container-sm">
                    <Calendar className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">#{order.orderNumber}</p>
                    <p className="text-caption">
                      {formatDate(order.deliveryDate, 'MMM d')}
                    </p>
                  </div>
                </div>
                <p className="text-body-sm font-medium">₹{order.totalAmount}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusWidget; 