'use client';

import { useEffect, useRef } from 'react';

interface DateRibbonProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  getDayStatus: (date: Date) => 'complete' | 'partial' | null;
}

export default function DateRibbon({ selectedDate, onDateSelect, getDayStatus }: DateRibbonProps) {
  const ribbonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to show tomorrow (selected day) in center
    if (ribbonRef.current) {
      const selectedChip = ribbonRef.current.querySelector('.day-chip.selected');
      if (selectedChip) {
        selectedChip.scrollIntoView({ inline: 'center', behavior: 'smooth' });
      }
    }
  }, [selectedDate]);

  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    // Generate 7 days: 3 past, today, 3 future (tomorrow will be at index 4)
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const isToday = i === 0;
      const isPast = i < 0;
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const dayName = date.toLocaleDateString('en', { weekday: 'short' });
      const dayNumber = date.getDate();
      const status = getDayStatus(date);

      days.push({
        date,
        isToday,
        isPast,
        isSelected,
        dayName,
        dayNumber,
        status,
        index: i
      });
    }
    
    return days;
  };

  const handleDaySelect = (date: Date, isPast: boolean) => {
    if (isPast) {return;} // Prevent selecting past dates
    onDateSelect(date);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div 
        ref={ribbonRef} 
        className="flex gap-1.5 px-5 py-4 overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {generateDays().map((day, index) => (
          <button
            key={index}
            onClick={() => handleDaySelect(day.date, day.isPast)}
            disabled={day.isPast}
            className={`
              flex-shrink-0 w-[calc((100vw-60px)/7)] min-w-[45px] max-w-[60px] h-[60px] 
              rounded-xl flex flex-col items-center justify-center
              relative transition-all duration-200 day-chip
              ${day.isPast ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60' : ''}
              ${day.isToday && !day.isSelected ? 'bg-gray-100 text-gray-700 border-2 border-gray-300' : ''}
              ${!day.isPast && !day.isToday && !day.isSelected ? 'bg-gray-50 text-gray-700 border border-gray-200' : ''}
              ${day.isSelected ? 'bg-blue-500 text-white scale-105 shadow-lg selected' : ''}
            `}
            style={{ scrollSnapAlign: 'center' }}
          >
            <span className="text-[9px] font-semibold uppercase tracking-wider mb-0.5">
              {day.dayName}
            </span>
            <span className="text-[15px] font-bold">{day.dayNumber}</span>
            
            {day.status && (
              <div className={`
                absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold
                flex items-center justify-center
                ${day.status === 'complete' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}
              `}>
                {day.status === 'complete' ? '✓' : '!'}
              </div>
            )}
          </button>
        ))}
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 