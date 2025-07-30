import React from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowRight, ChefHat, Star, Zap } from 'lucide-react';

interface PopularDish {
  id: string;
  name: string;
  image?: string;
  orderCount: number;
  rating: number;
  price: number;
  category: string;
  isVegetarian?: boolean;
}

interface PopularDishesProps {
  dishes: PopularDish[];
  loading: boolean;
}

const PopularDishes: React.FC<PopularDishesProps> = ({ dishes, loading }) => {
  const router = useRouter();

  const handleSearchClick = (query?: string) => {
    if (query) {
      localStorage.setItem('searchQuery', query);
    }
    router.push('/student/menu');
  };

  const handleDishClick = (dish: PopularDish) => {
    localStorage.setItem('searchQuery', dish.name);
    router.push('/student/menu');
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-6 w-32"></div>
          <div className="skeleton h-8 w-20"></div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3">
              <div className="skeleton w-12 h-12 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4"></div>
                <div className="skeleton h-3 w-1/2"></div>
              </div>
              <div className="skeleton h-4 w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="icon-container-sm bg-warning-50">
            <TrendingUp className="w-4 h-4 text-warning-600" />
          </div>
          <div>
            <h2 className="text-heading-3">Popular Dishes</h2>
            <p className="text-caption">Most ordered this week</p>
          </div>
        </div>
        <button
          onClick={() => handleSearchClick()}
          className="btn-ghost btn-sm"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {dishes.length > 0 ? (
        <div className="space-y-3">
          {dishes.slice(0, 3).map((dish, index) => (
            <div
              key={dish.id}
              onClick={() => handleDishClick(dish)}
              className="card-interactive p-3 group"
            >
              <div className="flex items-center space-x-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-warning-100 text-warning-800' :
                    index === 1 ? 'bg-neutral-200 text-neutral-700' :
                    'bg-accent-orange/20 text-orange-700'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Image */}
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden">
                  {dish.image ? (
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-neutral-500" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-heading-4 truncate">{dish.name}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-warning-500 fill-current" />
                          <span className="text-caption font-medium">{dish.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-success-500" />
                          <span className="text-caption">{dish.orderCount} orders</span>
                        </div>
                        {dish.isVegetarian && (
                          <div className="veg-indicator">
                            <div className="veg-indicator-dot"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="price-display">₹{dish.price}</p>
                      <p className="text-caption">{dish.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="icon-container mx-auto mb-3">
            <ChefHat className="w-5 h-5 text-neutral-500" />
          </div>
          <p className="text-body-sm text-neutral-600 mb-3">No popular dishes yet</p>
          <button 
            onClick={() => handleSearchClick()}
            className="btn-primary btn-sm"
          >
            Explore Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default PopularDishes;
