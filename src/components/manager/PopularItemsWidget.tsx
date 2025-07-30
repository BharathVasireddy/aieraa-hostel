'use client';

import { Utensils, TrendingUp, ArrowRight, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

interface PopularItem {
  id: string;
  name: string;
  category: string;
  ordersCount: number;
  revenue: number;
  isVegetarian: boolean;
}

interface PopularItemsWidgetProps {
  items: PopularItem[];
  loading: boolean;
  universityId?: string;
}

interface PopularItemCardProps {
  item: PopularItem;
  rank: number;
  onClick: () => void;
}

const PopularItemCard = memo<PopularItemCardProps>(
  ({ item, rank, onClick }) => {
    const getCategoryColor = (category: string) => {
      switch (category.toLowerCase()) {
        case 'breakfast':
          return 'bg-yellow-100 text-yellow-800';
        case 'lunch':
          return 'bg-orange-100 text-orange-800';
        case 'dinner':
          return 'bg-purple-100 text-purple-800';
        case 'snacks':
          return 'bg-green-100 text-green-800';
        case 'beverages':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getRankColor = (rank: number) => {
      switch (rank) {
        case 1:
          return 'bg-yellow-500 text-white'; // Gold
        case 2:
          return 'bg-gray-400 text-white'; // Silver
        case 3:
          return 'bg-amber-600 text-white'; // Bronze
        default:
          return 'bg-gray-200 text-gray-700';
      }
    };

    return (
      <div
        onClick={() => void onClick()}
        className='p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0'
      >
        <div className='flex items-center space-x-3'>
          {/* Rank Badge */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(rank)}`}
          >
            {rank}
          </div>

          {/* Item Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2 mb-1'>
              <h4 className='font-medium text-gray-900 truncate'>
                {item.name}
              </h4>
              {item.isVegetarian && (
                <div className='w-4 h-4 bg-green-100 border border-green-500 rounded-sm flex items-center justify-center'>
                  <Leaf className='w-2 h-2 text-green-600' />
                </div>
              )}
            </div>

            <div className='flex items-center space-x-3 text-sm text-gray-600'>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}
              >
                {item.category}
              </span>
              <span>{item.ordersCount} orders</span>
              <span className='font-medium text-gray-900'>
                ₹{item.revenue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Trending Icon */}
          <div className='flex items-center space-x-1 text-green-600'>
            <TrendingUp className='w-4 h-4' />
            <ArrowRight className='w-4 h-4 text-gray-400' />
          </div>
        </div>
      </div>
    );
  }
);

PopularItemCard.displayName = 'PopularItemCard';

const PopularItemsWidget = memo<PopularItemsWidgetProps>(
  ({ items, loading, universityId }) => {
    const router = useRouter();

    const handleItemClick = (itemId: string) => {
      router.push(`/manager/menu/${itemId}`);
    };

    const handleViewMenu = () => {
      router.push('/manager/menu');
    };

    if (loading) {
      return (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          <div className='animate-pulse'>
            <div className='h-5 bg-gray-200 rounded w-32 mb-4'></div>
            <div className='space-y-3'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-32'></div>
                    <div className='h-3 bg-gray-200 rounded w-24'></div>
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
            <h3 className='font-semibold text-gray-900'>Popular Items</h3>
            <button
              onClick={() => void handleViewMenu()}
              className='text-sm text-green-600 hover:text-green-700 font-medium'
            >
              View Menu
            </button>
          </div>
          <p className='text-sm text-gray-600 mt-1'>
            Top performing menu items this week
          </p>
        </div>

        {/* Items List */}
        <div className='divide-y divide-gray-100'>
          {items.length > 0 ? (
            items.map((item, index) => (
              <PopularItemCard
                key={item.id}
                item={item}
                rank={index + 1}
                onClick={() => handleItemClick(item.id)}
              />
            ))
          ) : (
            <div className='p-8 text-center'>
              <Utensils className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-600'>No popular items yet</p>
              <p className='text-sm text-gray-500 mt-1'>
                Popular items will appear as students place orders
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {items.length > 0 && (
          <div className='p-4 bg-gray-50 border-t border-gray-100'>
            <div className='grid grid-cols-2 gap-4 text-center'>
              <div>
                <p className='text-lg font-bold text-gray-900'>
                  {items.reduce((sum, item) => sum + item.ordersCount, 0)}
                </p>
                <p className='text-xs text-gray-600'>Total Orders</p>
              </div>
              <div>
                <p className='text-lg font-bold text-gray-900'>
                  ₹
                  {items
                    .reduce((sum, item) => sum + item.revenue, 0)
                    .toLocaleString()}
                </p>
                <p className='text-xs text-gray-600'>Total Revenue</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PopularItemsWidget.displayName = 'PopularItemsWidget';

export default PopularItemsWidget;
