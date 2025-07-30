'use client'

import { ArrowRight, Clock, ShoppingCart, Utensils } from 'lucide-react'
import { useCallback, useMemo } from 'react'

interface CartItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
  isVegetarian?: boolean
}

interface FloatingCartProps {
  items: CartItem[]
  onCheckout: () => void
  onToggleCart?: () => void
  isExpanded?: boolean
  isOrderingClosed?: boolean
  closingTime?: string
  className?: string
}

const FloatingCart = ({
  items,
  onCheckout,
  onToggleCart,
  isExpanded = false,
  isOrderingClosed = false,
  closingTime,
  className = ''
}: FloatingCartProps) => {
  // Calculate cart summary
  const cartSummary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const vegCount = items.filter(item => item.isVegetarian).reduce((sum, item) => sum + item.quantity, 0)
    const nonVegCount = totalItems - vegCount
    
    return {
      totalItems,
      totalAmount,
      vegCount,
      nonVegCount,
      hasItems: totalItems > 0
    }
  }, [items])

  const handleCheckout = useCallback(() => {
    if (!isOrderingClosed && cartSummary.hasItems) {
      onCheckout()
    }
  }, [onCheckout, isOrderingClosed, cartSummary.hasItems])

  const handleToggleCart = useCallback(() => {
    if (onToggleCart) {
      onToggleCart()
    }
  }, [onToggleCart])

  if (!cartSummary.hasItems) {
    return null
  }

  const CompactView = () => (
    <div className={`floating-cart animate-scale-in ${className}`}>
      <div className="flex items-center justify-between">
        {/* Cart Icon and Summary */}
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer"
          onClick={() => void handleToggleCart()}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-primary-gradient rounded-xl flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-gentle-bounce">
              <span className="text-xs font-bold text-white">{cartSummary.totalItems}</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-neutral-800 text-sm">
                {cartSummary.totalItems} item{cartSummary.totalItems > 1 ? 's' : ''}
              </h3>
              {/* Veg/Non-veg indicators */}
              <div className="flex items-center space-x-1">
                {cartSummary.vegCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-food-veg rounded-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-food-veg rounded-full" />
                    </div>
                    <span className="text-xs text-neutral-600">{cartSummary.vegCount}</span>
                  </div>
                )}
                {cartSummary.nonVegCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-food-non-veg rounded-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-food-non-veg rounded-full" />
                    </div>
                    <span className="text-xs text-neutral-600">{cartSummary.nonVegCount}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-price font-bold text-primary-600">₹{cartSummary.totalAmount}</span>
              {isOrderingClosed && closingTime && (
                <div className="flex items-center space-x-1 text-red-600">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">Closed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={() => void handleCheckout()}
          disabled={isOrderingClosed}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-button font-semibold text-sm transition-all duration-350 shadow-button ${
            isOrderingClosed 
                          ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' 
            : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-card-hover animate-press'
          }`}
        >
          <span>{isOrderingClosed ? 'Closed' : 'Checkout'}</span>
          {!isOrderingClosed && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Ordering closed notice */}
      {isOrderingClosed && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">
              Ordering closed{closingTime ? ` until ${closingTime}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const ExpandedView = () => (
    <div className={`floating-cart animate-scale-in ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-800">Your Order</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-600">{cartSummary.totalItems} items</span>
          <button
            onClick={() => void handleToggleCart()}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-neutral-600 rotate-90" />
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-h-32 overflow-y-auto space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Veg/Non-veg indicator */}
              <div className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
                item.isVegetarian 
                  ? 'border-food-veg bg-food-veg-light' 
                  : 'border-food-non-veg bg-food-non-veg-light'
              }`}>
                <div className={`w-1 h-1 rounded-full ${
                  item.isVegetarian ? 'bg-food-veg' : 'bg-food-non-veg'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-neutral-800 line-clamp-1">
                  {item.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-neutral-600">Qty: {item.quantity}</span>
                  <span className="text-sm font-semibold text-neutral-800">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total and Checkout */}
      <div className="border-t border-neutral-200 pt-3">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-neutral-800">Total Amount</span>
          <span className="text-lg font-bold text-primary-600">₹{cartSummary.totalAmount}</span>
        </div>
        
        <button
          onClick={() => void handleCheckout()}
          disabled={isOrderingClosed}
          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-button font-semibold transition-all duration-350 ${
            isOrderingClosed 
                          ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            : 'bg-primary-gradient text-white hover:shadow-card-hover animate-press'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>{isOrderingClosed ? 'Ordering Closed' : 'Proceed to Checkout'}</span>
          {!isOrderingClosed && <ArrowRight className="w-4 h-4" />}
        </button>

        {/* Ordering closed notice */}
        {isOrderingClosed && closingTime && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">
                Ordering will resume at {closingTime}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return isExpanded ? <ExpandedView /> : <CompactView />
}

export default FloatingCart

// Preset configurations
export const CompactFloatingCart = (props: Omit<FloatingCartProps, 'isExpanded'>) => (
  <FloatingCart {...props} isExpanded={false} />
)

export const ExpandedFloatingCart = (props: Omit<FloatingCartProps, 'isExpanded'>) => (
  <FloatingCart {...props} isExpanded={true} />
)

// Empty cart state component
export const EmptyCartState = ({ onBrowseMenu }: { onBrowseMenu: () => void }) => (
  <div className="text-center py-8 px-4">
    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <ShoppingCart className="w-8 h-8 text-neutral-400" />
    </div>
    <h3 className="text-lg font-semibold text-neutral-800 mb-2">Your cart is empty</h3>
    <p className="text-neutral-600 mb-4">Add some delicious items to get started!</p>
    <button
      onClick={() => void onBrowseMenu()}
      className="btn-primary"
    >
      <Utensils className="w-4 h-4 mr-2" />
      Browse Menu
    </button>
  </div>
) 