import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Filter as FilterIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  type: 'recent' | 'trending' | 'dish' | 'category';
  text: string;
  icon?: React.ReactNode;
  metadata?: string;
}

interface MenuSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  trendingSearches?: string[];
  className?: string;
  placeholder?: string;
}

export const MenuSearch: React.FC<MenuSearchProps> = ({
  value,
  onChange,
  onSearch,
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  className,
  placeholder = "Search for dishes, cuisines...",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate suggestions based on input
  const displaySuggestions: SearchSuggestion[] = React.useMemo(() => {
    if (!value) {
      // Show recent and trending when no input
      const suggestions: SearchSuggestion[] = [];
      
      if (recentSearches.length > 0) {
        suggestions.push(
          ...recentSearches.slice(0, 3).map(search => ({
            type: 'recent' as const,
            text: search,
            icon: <Clock className="w-4 h-4 text-neutral-500" />,
          }))
        );
      }
      
      if (trendingSearches.length > 0) {
        suggestions.push(
          ...trendingSearches.slice(0, 3).map(search => ({
            type: 'trending' as const,
            text: search,
            icon: <TrendingUp className="w-4 h-4 text-warning-500" />,
            metadata: 'Trending',
          }))
        );
      }
      
      return suggestions;
    }
    
    // Filter suggestions based on input
    return suggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(value.toLowerCase())
    );
  }, [value, suggestions, recentSearches, trendingSearches]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-5 h-5 text-neutral-400" />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={cn(
              "pl-12 pr-12 h-12 text-base",
              "transition-all duration-200",
              isFocused && "ring-2 ring-primary-500"
            )}
          />
          
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && displaySuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden z-50">
          <div className="max-h-80 overflow-y-auto">
            {displaySuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-neutral-50 transition-colors text-left"
              >
                {suggestion.icon && (
                  <div className="flex-shrink-0">
                    {suggestion.icon}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-neutral-900 truncate">
                    {suggestion.text}
                  </p>
                  {suggestion.metadata && (
                    <p className="text-caption text-neutral-500">
                      {suggestion.metadata}
                    </p>
                  )}
                </div>
                
                {suggestion.type === 'trending' && (
                  <div className="flex-shrink-0">
                    <span className="text-xs bg-warning-100 text-warning-700 px-2 py-1 rounded-full">
                      Trending
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {value && (
            <div className="border-t border-neutral-100 p-3">
              <button
                type="button"
                onClick={() => {
                  onSearch(value);
                  setShowSuggestions(false);
                }}
                className="w-full text-left text-body-sm text-primary-600 hover:text-primary-700"
              >
                Search for "{value}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 