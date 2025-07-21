import React from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { getOrderingCountdown } from '@/lib/timezone';

interface WelcomeSectionProps {
  userName?: string;
  selectedDate?: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName, selectedDate }) => {
  // Get selected date or default to tomorrow
  const orderDate = selectedDate || format(addDays(startOfToday(), 1), 'yyyy-MM-dd');
  const countdown = getOrderingCountdown(orderDate);

  return (
    <div className='rounded-xl p-6 text-center'>
      <h1 className='text-xl font-bold text-gray-900'>
        Welcome back
        {userName ? (
          <span>
            , <span className='text-green-600'>{userName.split(' ')[0]}</span>!
          </span>
        ) : (
          '!'
        )}
      </h1>
      <p className='text-gray-600 mt-1'>Ready to order some delicious food?</p>
      
      {/* Simplified Order Deadline */}
      <div className='mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200'>
        <p className='text-sm text-gray-700'>
          <span className='font-medium'>Order Deadline:</span> 10:00 PM for next day delivery
        </p>
        {!countdown.isPastCutoff ? (
          <p className='text-sm text-orange-600 font-medium mt-1'>
            {countdown.hours}h {countdown.minutes}m remaining to order
          </p>
        ) : (
          <p className='text-sm text-red-600 font-medium mt-1'>
            Ordering closed for today
          </p>
        )}
      </div>
    </div>
  );
};

export default WelcomeSection;
