'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  ChevronUp,
  IndianRupee,
} from 'lucide-react';
import { useCart } from './CartProvider';
import Image from 'next/image';

interface FloatingCartButtonProps {
  className?: string;
}

export default function FloatingCartButton({
  className = '',
}: FloatingCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    items,
    getTotalItems,
    getTotalPrice,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Pages where floating cart should be hidden
  const hiddenPages = [
    '/student/checkout',
    '/student/order-success',
    '/student/orders/', // This covers all order detail pages
  ];

  // Don't show if cart is empty or on hidden pages
  if (totalItems === 0 || hiddenPages.some(page => pathname.startsWith(page))) {
    return null;
  }

  const handleCheckout = () => {
    router.push('/student/checkout');
    setIsExpanded(false);
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuantityChange = async (
    itemId: string,
    newQuantity: number,
    variantId?: string
  ) => {
    await updateQuantity(itemId, newQuantity, variantId);
  };

  const handleRemoveItem = async (itemId: string, variantId?: string) => {
    await removeItem(itemId, variantId);
  };

  return (
    <div className={`fixed bottom-24 left-4 right-4 z-40 ${className}`}>
      {/* Expanded Cart View */}
      {isExpanded && (
        <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 mb-3 max-h-80 overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-100'>
            <h3 className='text-lg font-bold text-gray-900'>Your Cart</h3>
            <button
              onClick={() => void handleToggleExpanded()}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <X className='w-5 h-5 text-gray-500' />
            </button>
          </div>

          {/* Cart Items */}
          <div className='max-h-48 overflow-y-auto'>
            {items.map(item => (
              <div
                key={`${item.id}-${item.variantId || ''}`}
                className='p-4 border-b border-gray-50 last:border-0'
              >
                <div className='flex items-start space-x-3'>
                  {/* Item Image */}
                  <div className='w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0'>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={48}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <ShoppingCart className='w-5 h-5 text-gray-400' />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 min-w-0'>
                        <h4 className='text-sm font-medium text-gray-900 truncate'>
                          {item.name}
                        </h4>
                        {item.variantName && (
                          <p className='text-xs text-gray-500'>
                            {item.variantName}
                          </p>
                        )}
                        <div className='flex items-center space-x-2 mt-1'>
                          {item.isVegetarian && (
                            <div className='w-3 h-3 border border-green-500 rounded-sm flex items-center justify-center'>
                              <div className='w-1 h-1 bg-green-500 rounded-full'></div>
                            </div>
                          )}
                          <span className='text-sm font-semibold text-gray-900 flex items-center'>
                            <IndianRupee className='w-3 h-3' />
                            {item.price.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className='flex items-center space-x-2 ml-3'>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.quantity - 1,
                              item.variantId
                            )
                          }
                          disabled={isLoading}
                          className='w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50'
                        >
                          <Minus className='w-3 h-3' />
                        </button>
                        <span className='text-sm font-medium min-w-[1.5rem] text-center'>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.quantity + 1,
                              item.variantId
                            )
                          }
                          disabled={isLoading}
                          className='w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50'
                        >
                          <Plus className='w-3 h-3' />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className='p-4 bg-gray-50 border-t border-gray-100'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-lg font-bold text-gray-900'>Total</span>
              <span className='text-xl font-bold text-gray-900 flex items-center'>
                <IndianRupee className='w-5 h-5' />
                {totalPrice.toFixed(0)}
              </span>
            </div>
            <button
              onClick={() => void handleCheckout()}
              disabled={isLoading}
              className='w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Loading...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}

      {/* Compact Cart Button */}
      <button
        onClick={isExpanded ? handleCheckout : handleToggleExpanded}
        className='w-full bg-green-600 text-white rounded-2xl shadow-2xl hover:bg-green-700 transition-all duration-300 hover:shadow-xl'
      >
        <div className='flex items-center justify-between p-4'>
          {/* Left Side - Cart Info */}
          <div className='flex items-center space-x-3'>
            <div className='relative'>
              <div className='w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center'>
                <ShoppingCart className='w-5 h-5 text-white' />
              </div>
              <div className='absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center'>
                <span className='text-xs font-bold text-gray-900'>
                  {totalItems}
                </span>
              </div>
            </div>

            <div className='text-left'>
              <p className='text-sm font-medium text-white'>
                {totalItems} item{totalItems > 1 ? 's' : ''}
              </p>
              <p className='text-xs text-green-100'>
                {isExpanded ? 'Tap to checkout' : 'Tap to view'}
              </p>
            </div>
          </div>

          {/* Right Side - Price and Action */}
          <div className='flex items-center space-x-3'>
            <div className='text-right'>
              <div className='flex items-center text-xl font-bold text-white'>
                <IndianRupee className='w-5 h-5' />
                <span>{totalPrice.toFixed(0)}</span>
              </div>
            </div>

            <div className='w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center'>
              {isExpanded ? (
                <ShoppingCart className='w-4 h-4 text-white' />
              ) : (
                <ChevronUp className='w-4 h-4 text-white' />
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
