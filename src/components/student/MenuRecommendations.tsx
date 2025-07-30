import React from 'react';
import { Sparkles, TrendingUp, Clock, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface RecommendedItem {
  id: string;
  name: string;
  reason: string;
  matchScore: number;
  image?: string;
  price: number;
  category: string;
  isVegetarian: boolean;
}

interface MenuRecommendationsProps {
  recommendations: RecommendedItem[];
  onItemClick: (itemId: string) => void;
  loading?: boolean;
  className?: string;
}

export const MenuRecommendations: React.FC<MenuRecommendationsProps> = ({
  recommendations,
  onItemClick,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
            <div className="flex space-x-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-40 h-48 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const getReasonIcon = (reason: string) => {
    if (reason.includes('popular') || reason.includes('trending')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (reason.includes('order') || reason.includes('again')) {
      return <Clock className="w-4 h-4" />;
    }
    if (reason.includes('favorite') || reason.includes('love')) {
      return <Heart className="w-4 h-4" />;
    }
    return <Sparkles className="w-4 h-4" />;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="icon-container-primary">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-heading-3">Recommended for You</h2>
              <p className="text-body-sm text-neutral-600">
                Based on your taste preferences
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary-600">
            View All
          </Button>
        </div>

        {/* Recommendation Cards */}
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {recommendations.map(item => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className="flex-shrink-0 w-40 text-left group"
            >
              <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
                {/* Image */}
                <div className="relative mb-3">
                  <div className="w-full h-32 bg-neutral-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-4xl">
                          {item.category === 'BREAKFAST' ? '🥞' :
                           item.category === 'LUNCH' ? '🍛' :
                           item.category === 'DINNER' ? '🍽️' :
                           item.category === 'SNACKS' ? '🍟' : '🥤'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Match Score Badge */}
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {Math.round(item.matchScore)}% match
                  </div>

                  {/* Veg Indicator */}
                  {item.isVegetarian && (
                    <div className="absolute bottom-2 left-2 veg-indicator bg-white">
                      <div className="veg-indicator-dot"></div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h4 className="text-body font-medium mb-1 line-clamp-2 group-hover:text-primary-600">
                  {item.name}
                </h4>
                
                <div className="flex items-center space-x-1 text-caption text-neutral-600 mb-2">
                  {getReasonIcon(item.reason)}
                  <span className="line-clamp-1">{item.reason}</span>
                </div>

                <p className="text-body font-bold text-primary-600">
                  ₹{item.price}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}; 