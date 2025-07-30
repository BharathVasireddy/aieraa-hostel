import React, { useState } from 'react';
import { Star, Package, Gift, Plus, Minus, Info, Clock, Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface MenuVariant {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  description?: string;
  isAvailable?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  offerPrice?: number;
  image?: string;
  category: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  rating?: number;
  orderCount?: number;
  calories?: number;
  preparationTime?: number;
  variants?: MenuVariant[];
  isBestseller?: boolean;
  isSpecialOffer?: boolean;
  tags?: string[];
}

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem, variantId?: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number, variantId?: string) => void;
  onShowVariants?: (item: MenuItem) => void;
  isLoading?: boolean;
  className?: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  quantity,
  onAdd,
  onUpdateQuantity,
  onShowVariants,
  isLoading = false,
  className,
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);

  const discountPercentage = item.offerPrice 
    ? Math.round(((item.price - item.offerPrice) / item.price) * 100)
    : 0;

  const hasVariants = item.variants && item.variants.length > 1;
  const currentPrice = item.offerPrice || item.price;

  const handleAddClick = () => {
    if (hasVariants && onShowVariants) {
      onShowVariants(item);
    } else {
      onAdd(item);
    }
  };

  const handleQuantityIncrease = async () => {
    if (!item.isAvailable || isUpdatingQuantity) return;

    setIsUpdatingQuantity(true);
    try {
      await onUpdateQuantity(item.id, quantity + 1);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  const handleQuantityDecrease = async () => {
    if (!item.isAvailable || quantity <= 0 || isUpdatingQuantity) return;

    setIsUpdatingQuantity(true);
    try {
      await onUpdateQuantity(item.id, quantity - 1);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  return (
    <Card 
      variant="interactive" 
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
        !item.isAvailable && "opacity-60",
        className
      )}
    >
      {/* Badges Row */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
        {item.isVegetarian && (
          <div className="veg-indicator shadow-sm">
            <div className="veg-indicator-dot"></div>
          </div>
        )}
        {item.isBestseller && (
          <div className="flex items-center space-x-1 bg-warning-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            <span>Bestseller</span>
          </div>
        )}
        {item.isSpecialOffer && (
          <div className="flex items-center space-x-1 bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
            <Gift className="w-3 h-3" />
            <span>Offer</span>
          </div>
        )}
      </div>

      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-error-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xs font-bold shadow-lg">
          {discountPercentage}%<br/>OFF
        </div>
      )}

      <div className="flex p-4 gap-4">
        {/* Image Section */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            "w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-neutral-100",
            !item.isAvailable && "grayscale"
          )}>
            {item.image && !imageError ? (
              <>
                {isImageLoading && (
                  <div className="w-full h-full bg-neutral-200 animate-pulse" />
                )}
                <img
                  src={item.image}
                  alt={item.name}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-200 group-hover:scale-105",
                    isImageLoading && "opacity-0"
                  )}
                  loading="lazy"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setIsImageLoading(false);
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-neutral-400" />
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h3 className={cn(
                  "text-heading-4 truncate leading-tight",
                  !item.isAvailable && "text-neutral-500"
                )}>
                  {item.name}
                </h3>
                {hasVariants && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 text-neutral-500 hover:text-primary-600"
                    onClick={() => onShowVariants && onShowVariants(item)}
                    disabled={!item.isAvailable}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {item.description && (
                <p className="text-body-sm text-neutral-600 line-clamp-2 mb-2">
                  {item.description}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex items-center gap-3 text-caption text-neutral-500 mb-2">
                {item.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning-500 fill-current" />
                    <span className="font-medium text-neutral-700">{item.rating}</span>
                    {item.orderCount && (
                      <span>({item.orderCount}+)</span>
                    )}
                  </div>
                )}
                {item.preparationTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.preparationTime} mins</span>
                  </div>
                )}
                {item.calories && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>{item.calories} cal</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between gap-4">
            {/* Price */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {item.offerPrice ? (
                  <>
                    <span className="price-display-offer text-lg font-bold">₹{item.offerPrice}</span>
                    <span className="price-display-original text-sm">₹{item.price}</span>
                  </>
                ) : (
                  <span className="price-display text-lg font-bold">₹{item.price}</span>
                )}
              </div>
              {hasVariants && (
                <span className="text-xs text-neutral-500">+ variants</span>
              )}
            </div>

            {/* Add to Cart Controls */}
            <div className="flex items-center">
              {quantity > 0 ? (
                <div className="quantity-controls shadow-sm">
                  <button
                    onClick={handleQuantityDecrease}
                    disabled={isLoading || !item.isAvailable}
                    className={cn(
                      "quantity-btn hover:bg-neutral-100 active:scale-95",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className={cn(
                    "quantity-display font-bold px-3 py-1 transition-all duration-200",
                    isUpdatingQuantity && "text-primary-600 scale-105"
                  )}>
                    {quantity}
                  </span>
                  <button
                    onClick={handleQuantityIncrease}
                    disabled={isLoading || !item.isAvailable}
                    className={cn(
                      "quantity-btn bg-primary-600 text-white hover:bg-primary-700 active:scale-95",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  onClick={handleAddClick}
                  disabled={isLoading || !item.isAvailable}
                  loading={isLoading}
                  size="sm"
                  className="min-w-[80px] shadow-sm font-semibold active:scale-95"
                >
                  {hasVariants ? 'Select Quantity' : 'ADD'}
                </Button>
              )}
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-neutral-500">+{item.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Not Available Overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
              <span className="text-sm font-medium text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                Currently Unavailable
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}; 