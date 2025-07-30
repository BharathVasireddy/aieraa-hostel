import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  key: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
}

interface MenuCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export const MenuCategories: React.FC<MenuCategoriesProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected category when it changes
  useEffect(() => {
    if (selectedButtonRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = selectedButtonRef.current;
      
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const scrollLeft = container.scrollLeft;
      
      // Calculate if button is out of view
      if (buttonLeft < scrollLeft || buttonLeft + buttonWidth > scrollLeft + containerWidth) {
        // Scroll to center the button
        const scrollTo = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        container.scrollTo({
          left: scrollTo,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedCategory]);

  return (
    <div className={cn("relative", className)}>
      {/* Gradient fade for better scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      {/* Category Pills */}
      <div 
        ref={scrollContainerRef}
        className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2"
      >
        {categories.map(category => (
          <button
            key={category.key}
            ref={selectedCategory === category.key ? selectedButtonRef : null}
            onClick={() => onCategoryChange(category.key)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
              selectedCategory === category.key
                ? "bg-primary-600 border-primary-600 text-white shadow-md"
                : "bg-white border-neutral-200 text-neutral-700 hover:border-primary-300"
            )}
          >
            <div className="flex items-center space-x-2">
              {category.icon && (
                <span className={cn(
                  "w-4 h-4",
                  selectedCategory === category.key ? "text-white" : "text-neutral-500"
                )}>
                  {category.icon}
                </span>
              )}
              <span className="font-medium whitespace-nowrap">
                {category.label}
              </span>
              {category.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  selectedCategory === category.key
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-600"
                )}>
                  {category.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 