import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, ArrowRight, Coffee } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/SkeletonLoaders';

interface TodaysSpecial {
  id: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  offerPrice: number;
  availableUntil: string;
  category: string;
}

interface TodaysSpecialsProps {
  specials: TodaysSpecial[];
  loading: boolean;
}

const TodaysSpecials: React.FC<TodaysSpecialsProps> = ({
  specials,
  loading,
}) => {
  const router = useRouter();

  const handleSearchClick = (query?: string) => {
    if (query) {
      localStorage.setItem('searchQuery', query);
    }
    router.push('/student/menu');
  };

  return (
    <div className='bg-white rounded-xl p-4 shadow-sm'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-2'>
          <Star className='w-5 h-5 text-yellow-600' />
          <h2 className='text-lg font-semibold text-gray-900'>
            Today's Specials
          </h2>
        </div>
        <button
          onClick={() => handleSearchClick('specials')}
          className='text-blue-600 text-sm font-medium flex items-center space-x-1'
        >
          <span>View All</span>
          <ArrowRight className='w-4 h-4' />
        </button>
      </div>

      {loading ? (
        <div className='space-y-3'>
          {Array.from({ length: 2 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : specials.length > 0 ? (
        <div className='space-y-3'>
          {specials.slice(0, 2).map(special => (
            <div
              key={special.id}
              onClick={() => handleSearchClick(special.name)}
              className='flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg cursor-pointer hover:from-yellow-100 hover:to-orange-100 transition-colors border border-yellow-200'
            >
              <div className='w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center'>
                <Star className='w-6 h-6 text-yellow-700' />
              </div>
              <div className='flex-1'>
                <h3 className='font-medium text-gray-900'>{special.name}</h3>
                <p className='text-sm text-gray-600 mt-1'>
                  {special.description}
                </p>
                <div className='flex items-center space-x-2 mt-2'>
                  <span className='text-sm text-gray-500 line-through'>
                    ₹{special.originalPrice}
                  </span>
                  <span className='text-sm font-semibold text-green-600'>
                    ₹{special.offerPrice}
                  </span>
                  <span className='text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full'>
                    {Math.round(
                      ((special.originalPrice - special.offerPrice) /
                        special.originalPrice) *
                        100
                    )}
                    % OFF
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-6 text-gray-500'>
          <Coffee className='w-12 h-12 mx-auto mb-2 text-gray-300' />
          <p>No special offers available today</p>
        </div>
      )}
    </div>
  );
};

export default TodaysSpecials;
