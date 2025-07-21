import React from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, ArrowRight, ChefHat, Star } from 'lucide-react'
import { CardSkeleton } from '@/components/ui/SkeletonLoaders'

interface PopularDish {
  id: string
  name: string
  image: string
  orderCount: number
  rating: number
  price: number
  category: string
}

interface PopularDishesProps {
  dishes: PopularDish[]
  loading: boolean
}

const PopularDishes: React.FC<PopularDishesProps> = ({ dishes, loading }) => {
  const router = useRouter()

  const handleSearchClick = (query?: string) => {
    if (query) {
      localStorage.setItem('searchQuery', query)
    }
    router.push('/student/menu')
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Popular Dishes</h2>
        </div>
        <button
          onClick={() => handleSearchClick()}
          className="text-blue-600 text-sm font-medium flex items-center space-x-1"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {dishes.slice(0, 3).map((dish) => (
            <div
              key={dish.id}
              onClick={() => handleSearchClick(dish.name)}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{dish.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{dish.rating}</span>
                  </div>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{dish.orderCount} orders</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₹{dish.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PopularDishes 