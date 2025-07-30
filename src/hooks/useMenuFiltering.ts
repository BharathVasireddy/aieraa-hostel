import { useMemo } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  offerPrice?: number;
  category: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  rating?: number;
  tags?: string[];
  isBestseller?: boolean;
  isSpecialOffer?: boolean;
}

interface FilterOptions {
  dietary: string[];
  priceRange: { min: number; max: number } | null;
  rating: number | null;
  preparationTime: number | null;
  categories: string[];
  tags: string[];
}

interface UseMenuFilteringOptions {
  items: MenuItem[];
  searchQuery: string;
  selectedCategory: string;
  filters: FilterOptions;
  showVegOnly?: boolean;
}

export const useMenuFiltering = ({
  items,
  searchQuery,
  selectedCategory,
  filters,
  showVegOnly = false,
}: UseMenuFilteringOptions) => {
  // Extract unique categories with counts
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    categoryMap.set('all', items.length);

    items.forEach(item => {
      const count = categoryMap.get(item.category) || 0;
      categoryMap.set(item.category, count + 1);
    });

    return Array.from(categoryMap.entries()).map(([key, count]) => ({
      key,
      label: key === 'all' ? 'All Items' : key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
      count,
    }));
  }, [items]);

  // Filter items based on all criteria
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Vegetarian filter
    if (showVegOnly) {
      filtered = filtered.filter(item => item.isVegetarian);
    }

    // Dietary filters
    if (filters.dietary.length > 0) {
      filtered = filtered.filter(item => {
        if (filters.dietary.includes('vegetarian') && !item.isVegetarian) {
          return false;
        }
        if (filters.dietary.includes('non-vegetarian') && item.isVegetarian) {
          return false;
        }
        // Add more dietary filters as needed
        return true;
      });
    }

    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(item => {
        const price = item.offerPrice || item.price;
        return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
      });
    }

    // Rating filter
    if (filters.rating) {
      filtered = filtered.filter(item => 
        item.rating && item.rating >= filters.rating!
      );
    }

    // Category filters (from advanced filters)
    if (filters.categories.length > 0) {
      filtered = filtered.filter(item =>
        filters.categories.includes(item.category.toUpperCase())
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery, showVegOnly, filters]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();

    filteredItems.forEach(item => {
      const category = item.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => {
        // Sort by availability first
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        // Then by bestseller status
        if (a.isBestseller !== b.isBestseller) {
          return a.isBestseller ? -1 : 1;
        }
        // Then by rating
        if (a.rating && b.rating) {
          return b.rating - a.rating;
        }
        return 0;
      }),
    }));
  }, [filteredItems]);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.dietary.length > 0 ||
    filters.priceRange !== null ||
    filters.rating !== null ||
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    showVegOnly ||
    searchQuery !== '';

  // Get suggestions for search
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {return [];}

    const suggestions = new Set<string>();
    const query = searchQuery.toLowerCase();

    items.forEach(item => {
      if (item.name.toLowerCase().includes(query)) {
        suggestions.add(item.name);
      }
      item.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }, [items, searchQuery]);

  return {
    categories,
    filteredItems,
    groupedItems,
    hasActiveFilters,
    searchSuggestions,
    totalItemsCount: items.length,
    filteredItemsCount: filteredItems.length,
  };
}; 