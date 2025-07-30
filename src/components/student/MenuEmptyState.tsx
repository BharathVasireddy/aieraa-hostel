import React from 'react';
import { Search, Coffee, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MenuEmptyStateProps {
  searchQuery?: string;
  hasActiveFilters?: boolean;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onChangeDate?: () => void;
}

export const MenuEmptyState: React.FC<MenuEmptyStateProps> = ({
  searchQuery,
  hasActiveFilters,
  onClearSearch,
  onClearFilters,
  onChangeDate,
}) => {
  const getEmptyStateConfig = () => {
    if (searchQuery) {
      return {
        icon: Search,
        title: 'No dishes found',
        description: `We couldn't find any dishes matching "${searchQuery}"`,
        action: onClearSearch ? (
          <Button variant="primary" onClick={() => void onClearSearch()}>
            Clear Search
          </Button>
        ) : null,
      };
    }
    
    if (hasActiveFilters) {
      return {
        icon: Filter,
        title: 'No dishes match your filters',
        description: 'Try adjusting your filters to see more options',
        action: onClearFilters ? (
          <Button variant="primary" onClick={() => void onClearFilters()}>
            Clear All Filters
          </Button>
        ) : null,
      };
    }
    
    return {
      icon: Coffee,
      title: 'No dishes available',
      description: 'There are no dishes available for the selected date',
      action: onChangeDate ? (
        <Button variant="primary" onClick={() => void onChangeDate()}>
          <Calendar className="w-4 h-4 mr-2" />
          Change Date
        </Button>
      ) : null,
    };
  };

  const config = getEmptyStateConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="icon-container mb-4 w-16 h-16">
        <Icon className="w-8 h-8 text-neutral-400" />
      </div>
      
      <h3 className="text-heading-3 mb-2 text-center">
        {config.title}
      </h3>
      
      <p className="text-body text-neutral-600 text-center mb-6 max-w-sm">
        {config.description}
      </p>
      
      {config.action}
      
      {/* Suggestions */}
      <div className="mt-8 text-center">
        <p className="text-caption text-neutral-500 mb-3">
          Try these suggestions:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button className="text-sm bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full hover:bg-neutral-200 transition-colors">
            Breakfast
          </button>
          <button className="text-sm bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full hover:bg-neutral-200 transition-colors">
            Today's Special
          </button>
          <button className="text-sm bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full hover:bg-neutral-200 transition-colors">
            Bestsellers
          </button>
        </div>
      </div>
    </div>
  );
}; 