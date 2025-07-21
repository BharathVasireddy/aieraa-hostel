import React from 'react';
import { format } from 'date-fns';
import { getVietnamTime } from '@/lib/timezone';

interface WelcomeSectionProps {
  userName?: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => {
  const currentTime = getVietnamTime();

  return (
    <div className='bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold'>
            Welcome back{userName ? `, ${userName.split(' ')[0]}!` : '!'}
          </h1>
          <p className='text-green-100 mt-1'>
            Ready to order some delicious food?
          </p>
        </div>
        <div className='text-right'>
          <p className='text-sm text-green-100'>Current Time</p>
          <p className='text-lg font-semibold'>
            {format(currentTime, 'HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
