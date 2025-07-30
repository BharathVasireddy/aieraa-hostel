'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName = 'Student' }: HeaderProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(17, 0, 0, 0); // 5 PM
      
      if (now > deadline) {
        deadline.setDate(deadline.getDate() + 1);
      }
      
      const diff = deadline.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ hours, minutes });
      
      // Calculate progress (6 AM to 5 PM = 11 hours)
      const dayStart = new Date();
      dayStart.setHours(6, 0, 0, 0);
      const dayDuration = 11 * 60 * 60 * 1000;
      const elapsed = now.getTime() - dayStart.getTime();
      const progressPercent = Math.min(100, Math.max(0, (elapsed / dayDuration) * 100));
      setProgress(progressPercent);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">My Meals</h1>
          <button className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Countdown Only */}
        <div className="mt-4">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center mt-2 text-gray-600">
            {timeLeft.hours}h {timeLeft.minutes}m left to lock tomorrow's meals
          </p>
        </div>
      </div>
    </header>
  );
} 