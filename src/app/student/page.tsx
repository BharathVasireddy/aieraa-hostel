'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { useUser } from '@/components/UserProvider';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import StudentLayout from '@/components/StudentLayout';
import PromotionalSlider from '@/components/PromotionalSlider';

// Dashboard Components
import WelcomeSection from '@/components/student/WelcomeSection';
import OrderingCountdown from '@/components/student/OrderingCountdown';
import QuickActions from '@/components/student/QuickActions';
import PopularDishes from '@/components/student/PopularDishes';
import TodaysSpecials from '@/components/student/TodaysSpecials';

interface PopularDish {
  id: string;
  name: string;
  image: string;
  orderCount: number;
  rating: number;
  price: number;
  category: string;
}

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

export default function StudentDashboard() {
  const { user } = useUser();

  // Get selected date from localStorage
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedOrderDate');
      if (saved) return saved;
    }
    const tomorrow = addDays(startOfToday(), 1);
    return format(tomorrow, 'yyyy-MM-dd');
  });

  // Progressive loading for popular dishes
  const { data: popularDishes, loading: loadingDishes } = useProgressiveLoading<
    PopularDish[]
  >(
    async () => {
      const response = await fetch('/api/student/popular-dishes');
      const data = await response.json();
      return data.success ? data.dishes : [];
    },
    [],
    { immediate: true }
  );

  // Progressive loading for today's specials
  const { data: todaysSpecials, loading: loadingSpecials } =
    useProgressiveLoading<TodaysSpecial[]>(
      async () => {
        const response = await fetch('/api/student/todays-specials');
        const data = await response.json();
        return data.success ? data.specials : [];
      },
      [],
      { immediate: true }
    );

  // Listen to localStorage changes for selectedDate
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('selectedOrderDate');
      if (saved && saved !== selectedDate) {
        setSelectedDate(saved);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleDateChange = (e: CustomEvent) => {
      setSelectedDate(e.detail.date);
    };

    window.addEventListener('dateChanged', handleDateChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'dateChanged',
        handleDateChange as EventListener
      );
    };
  }, [selectedDate]);

  // Removed popularSearches logic since QuickSearch component was removed

  return (
    <StudentLayout>
      <div className='bg-gray-50 min-h-screen'>
        <div className='px-4 py-4 pb-24 space-y-6'>
          {/* Welcome Section - Shows immediately */}
          <WelcomeSection userName={user?.name} />

          {/* Promotional Slider - Shows immediately */}
          {user?.universityId && (
            <div className='-mx-4'>
              <PromotionalSlider universityId={user.universityId} />
            </div>
          )}

          {/* Ordering Countdown - Shows immediately */}
          <OrderingCountdown selectedDate={selectedDate} />

          {/* Quick Actions - Shows immediately */}
          <QuickActions />

          {/* Popular Dishes Section - Progressive Loading */}
          <PopularDishes dishes={popularDishes || []} loading={loadingDishes} />

          {/* Today's Specials Section - Progressive Loading */}
          <TodaysSpecials
            specials={todaysSpecials || []}
            loading={loadingSpecials}
          />
        </div>
      </div>
    </StudentLayout>
  );
}
