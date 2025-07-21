import React from 'react';

interface WelcomeSectionProps {
  userName?: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => {
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
    </div>
  );
};

export default WelcomeSection;
