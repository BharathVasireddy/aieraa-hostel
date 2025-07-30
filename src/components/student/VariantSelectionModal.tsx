import React, { useState, useEffect } from 'react';
import { X, Check, Info } from 'lucide-react';
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
  description?: string;
  image?: string;
  isVegetarian?: boolean;
  variants?: MenuVariant[];
}

interface VariantSelectionModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MenuItem, variantId: string) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  item,
  isOpen,
  onClose,
  onSelect,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  // Update selected variant when item changes
  useEffect(() => {
    if (item?.variants) {
      const defaultVariant = item.variants.find(v => v.isDefault)?.id || item.variants[0]?.id || '';
      setSelectedVariantId(defaultVariant);
    }
  }, [item]);

  if (!isOpen || !item?.variants || item.variants.length === 0) {
    return null;
  }

  const handleSelect = () => {
    if (selectedVariantId) {
      onSelect(item, selectedVariantId);
      onClose();
    }
  };

  const selectedVariant = item.variants.find(v => v.id === selectedVariantId);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] animate-fade-in"
        onClick={() => void onClose()}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md md:max-w-lg animate-slide-up md:animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-100">
          <div className="flex-1">
            <h3 className="text-heading-3 mb-1">Choose Size</h3>
            <p className="text-body-sm text-neutral-600">
              Select your preferred size for {item.name}
            </p>
          </div>
          <button
            onClick={() => void onClose()}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        
        {/* Item Info */}
        {(item.image || item.description) && (
          <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-100">
            <div className="flex items-center space-x-4">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="text-heading-4 flex items-center space-x-2">
                  {item.name}
                  {item.isVegetarian && (
                    <div className="veg-indicator">
                      <div className="veg-indicator-dot"></div>
                    </div>
                  )}
                </h4>
                {item.description && (
                  <p className="text-caption text-neutral-600 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Variants List */}
        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
          {item.variants.map(variant => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariantId(variant.id)}
              disabled={variant.isAvailable === false}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all duration-200",
                "hover:border-primary-400 active:scale-[0.98]",
                selectedVariantId === variant.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 bg-white hover:bg-neutral-50",
                variant.isAvailable === false && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-heading-4">{variant.name}</span>
                    {variant.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  {variant.description && (
                    <p className="text-caption text-neutral-600 mt-1">
                      {variant.description}
                    </p>
                  )}
                  {variant.isAvailable === false && (
                    <p className="text-caption text-error-600 mt-1">
                      Currently unavailable
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="price-display">₹{variant.price}</span>
                  {selectedVariantId === variant.id && (
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-caption text-neutral-600">Selected</p>
              <p className="text-heading-4">{selectedVariant?.name}</p>
            </div>
            <p className="price-display text-xl">₹{selectedVariant?.price}</p>
          </div>
          
          <Button
            onClick={() => void handleSelect()}
            disabled={!selectedVariantId || selectedVariant?.isAvailable === false}
            size="lg"
            className="w-full"
          >
            Add to Cart
          </Button>
        </div>
        </div>
      </div>
    </>
  );
}; 