import React, { useState } from 'react';
import { 
  Filter, 
  Leaf, 
  Flame, 
  Clock, 
  Star, 
  IndianRupee,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  dietary: string[];
  priceRange: { min: number; max: number } | null;
  rating: number | null;
  preparationTime: number | null;
  categories: string[];
  tags: string[];
}

interface MenuFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableCategories?: string[];
  availableTags?: string[];
  className?: string;
}

export const MenuFilters: React.FC<MenuFiltersProps> = ({
  filters,
  onFiltersChange,
  availableCategories = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'BEVERAGES'],
  availableTags = ['Bestseller', 'New', 'Healthy', 'Spicy', 'Sweet'],
  className,
}) => {
  const [showFullFilters, setShowFullFilters] = useState(false);

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: <Leaf className="w-4 h-4" /> },
    { id: 'vegan', label: 'Vegan', icon: <Leaf className="w-4 h-4" /> },
    { id: 'non-vegetarian', label: 'Non-Veg', icon: <Flame className="w-4 h-4" /> },
  ];

  const priceRanges = [
    { id: 'budget', label: 'Under ₹50', min: 0, max: 50 },
    { id: 'moderate', label: '₹50-100', min: 50, max: 100 },
    { id: 'premium', label: 'Above ₹100', min: 100, max: 9999 },
  ];

  const ratingOptions = [4, 3.5, 3];

  const toggleDietary = (diet: string) => {
    const newDietary = filters.dietary.includes(diet)
      ? filters.dietary.filter(d => d !== diet)
      : [...filters.dietary, diet];
    
    onFiltersChange({ ...filters, dietary: newDietary });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({ ...filters, tags: newTags });
  };

  const setPriceRange = (range: { min: number; max: number } | null) => {
    onFiltersChange({ ...filters, priceRange: range });
  };

  const setRating = (rating: number | null) => {
    onFiltersChange({ ...filters, rating });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dietary: [],
      priceRange: null,
      rating: null,
      preparationTime: null,
      categories: [],
      tags: [],
    });
  };

  const activeFiltersCount = 
    filters.dietary.length +
    (filters.priceRange ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    filters.categories.length +
    filters.tags.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Filters Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFullFilters(!showFullFilters)}
          className={cn(
            "flex-shrink-0",
            showFullFilters && "bg-primary-50 text-primary-700"
          )}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Dietary Quick Filters */}
        {dietaryOptions.map(option => (
          <Button
            key={option.id}
            variant="ghost"
            size="sm"
            onClick={() => toggleDietary(option.id)}
            className={cn(
              "flex-shrink-0",
              filters.dietary.includes(option.id) && "bg-primary-50 text-primary-700"
            )}
          >
            {option.icon}
            <span className="ml-2">{option.label}</span>
            {filters.dietary.includes(option.id) && (
              <Check className="w-3 h-3 ml-1" />
            )}
          </Button>
        ))}

        {/* Rating Quick Filter */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRating(filters.rating === 4 ? null : 4)}
          className={cn(
            "flex-shrink-0",
            filters.rating && "bg-primary-50 text-primary-700"
          )}
        >
          <Star className="w-4 h-4 mr-1" />
          4+ Rating
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="flex-shrink-0 text-error-600 hover:text-error-700 hover:bg-error-50"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFullFilters && (
        <div className="card p-6 space-y-6 animate-slide-up">
          {/* Categories */}
          <div>
            <h3 className="text-heading-4 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-all duration-200",
                    filters.categories.includes(category)
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  {category}
                  {filters.categories.includes(category) && (
                    <Check className="w-3 h-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-heading-4 mb-3">Price Range</h3>
            <div className="grid grid-cols-3 gap-2">
              {priceRanges.map(range => (
                <button
                  key={range.id}
                  onClick={() => 
                    setPriceRange(
                      filters.priceRange?.min === range.min ? null : range
                    )
                  }
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all duration-200",
                    filters.priceRange?.min === range.min
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <IndianRupee className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">{range.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-heading-4 mb-3">Minimum Rating</h3>
            <div className="flex space-x-2">
              {ratingOptions.map(rating => (
                <button
                  key={rating}
                  onClick={() => 
                    setRating(filters.rating === rating ? null : rating)
                  }
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all duration-200 flex items-center",
                    filters.rating === rating
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  {rating}+
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-heading-4 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-all duration-200",
                    filters.tags.includes(tag)
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  {tag}
                  {filters.tags.includes(tag) && (
                    <Check className="w-3 h-3 ml-1 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-neutral-200">
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              Clear All Filters
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowFullFilters(false)}
            >
              Apply Filters ({activeFiltersCount})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 