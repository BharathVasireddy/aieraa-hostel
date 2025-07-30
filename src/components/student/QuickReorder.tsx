import React from 'react';
import { Clock, Calendar, ShoppingCart, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';

interface PreviousOrder {
  id: string;
  orderNumber: string;
  date: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    variantId?: string;
    variantName?: string;
  }>;
  totalAmount: number;
  itemCount: number;
}

interface QuickReorderProps {
  previousOrders: PreviousOrder[];
  onReorder: (order: PreviousOrder) => void;
  onViewOrder: (orderNumber: string) => void;
  loading?: boolean;
  className?: string;
}

export const QuickReorder: React.FC<QuickReorderProps> = ({
  previousOrders,
  onReorder,
  onViewOrder,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (previousOrders.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <div className="icon-container mx-auto mb-3">
            <Clock className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-heading-4 mb-2">No Previous Orders</h3>
          <p className="text-body-sm text-neutral-600">
            Start ordering to see your history here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="icon-container-sm bg-info-50">
              <Clock className="w-4 h-4 text-info-600" />
            </div>
            <h2 className="text-heading-3">Quick Reorder</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewOrder('all')}
            className="text-primary-600"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {previousOrders.slice(0, 3).map(order => (
            <div
              key={order.id}
              className="card-interactive p-4 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-heading-4">Order #{order.orderNumber}</h4>
                    <span className="text-caption bg-neutral-100 px-2 py-0.5 rounded-full">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-caption text-neutral-600">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(order.date)}</span>
                  </div>
                </div>
                <p className="text-heading-4 text-primary-600">₹{order.totalAmount}</p>
              </div>

              {/* Item Preview */}
              <div className="mb-3">
                <p className="text-body-sm text-neutral-700 line-clamp-2">
                  {order.items.map((item, idx) => (
                    <span key={item.id}>
                      {item.name}
                      {item.variantName && ` (${item.variantName})`}
                      {` x${item.quantity}`}
                      {idx < order.items.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => onReorder(order)}
                  size="sm"
                  className="flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Reorder
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewOrder(order.orderNumber)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Helpful Tip */}
        <div className="mt-4 p-3 bg-info-50 rounded-lg">
          <p className="text-caption text-info-700">
            💡 Tip: You can modify items before checkout when reordering
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 