'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { useUser } from '@/components/UserProvider';
import StudentLayout from '@/components/StudentLayout';
import PromotionalSlider from '@/components/PromotionalSlider';

// Dashboard Components
import WelcomeSection from '@/components/student/WelcomeSection';

export default function StudentDashboard() {
  const { user } = useUser();

  // Get selected date from localStorage
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedOrderDate');
      if (saved) {return saved;}
    }
    const tomorrow = addDays(startOfToday(), 1);
    return format(tomorrow, 'yyyy-MM-dd');
  });

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
        </div>
      </div>
    </StudentLayout>
  );
}
