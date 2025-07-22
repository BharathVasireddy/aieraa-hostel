import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getOrderingCountdown } from '@/lib/timezone';

interface OrderingCountdownProps {
  selectedDate: string;
}

const OrderingCountdown: React.FC<OrderingCountdownProps> = ({
  selectedDate,
}) => {
  const [cutoffHours, setCutoffHours] = useState<number | null>(null); // Start with null to prevent jerk

  // Fetch cutoff time from API
  useEffect(() => {
    const fetchCutoffTime = async () => {
      try {
        const response = await fetch('/api/student/cutoff-info');
        if (response.ok) {
          const data = await response.json();
          if (data.success && typeof data.cutoffHours === 'number') {
            setCutoffHours(data.cutoffHours);
          }
        } else {
          console.warn('OrderingCountdown cutoff API error:', response.status, 'Using default 22 hours');
          setCutoffHours(22); // Fallback
        }
      } catch (error) {
        console.error('Failed to fetch cutoff time:', error);
        setCutoffHours(22); // Fallback to default 22 (10 PM) if API fails
      }
    };
    
    fetchCutoffTime();
  }, []);

  const countdown = cutoffHours !== null ? getOrderingCountdown(selectedDate, cutoffHours) : null;

  // Format time helper
  const formatTime = (hours: number) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:00 ${period}`;
  };

  return (
    <div className='bg-white rounded-xl p-4 shadow-sm border border-orange-200'>
      <div className='flex items-center space-x-3'>
        <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
          <Clock className='w-6 h-6 text-orange-600' />
        </div>
        <div className='flex-1'>
          <h3 className='font-semibold text-gray-900'>Order Deadline</h3>
          {cutoffHours !== null ? (
            <>
              <p className='text-sm text-gray-600'>
                Orders close at {formatTime(cutoffHours)} for next day delivery
              </p>
              <div className='mt-2'>
                {countdown && !countdown.isPastCutoff ? (
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm font-medium text-orange-600'>
                      {countdown.hours}h {countdown.minutes}m remaining
                    </span>
                    <span className='text-xs text-gray-500'>to order</span>
                  </div>
                ) : countdown ? (
                  <span className='text-sm font-medium text-red-600'>
                    Ordering closed for today
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            /* Loading State */
            <>
              <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse'></div>
              <div className='h-4 bg-gray-200 rounded w-1/2 mt-2 animate-pulse'></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderingCountdown;
