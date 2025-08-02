'use client';

import React from 'react';

interface TimeDisplayProps {
  utcTimestamp: string | Date;
  format?: 'full' | 'date' | 'time' | 'relative' | 'short';
  timezone?: string;
  className?: string;
}

/**
 * Industry Standard: Universal Time Display Component
 * 
 * Follows the "Store UTC, Display Local" pattern used by major companies:
 * - Takes UTC timestamp from database
 * - Displays in user's preferred timezone (defaults to Vietnam)
 * - Handles all formatting consistently across the application
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  utcTimestamp,
  format = 'full',
  timezone = 'Asia/Ho_Chi_Minh', // Default to Vietnam timezone
  className = ''
}) => {
  // Convert UTC timestamp to Date object
  const date = new Date(utcTimestamp);
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return <span className={className}>Invalid date</span>;
  }

  // Format options for different display types
  const getFormattedTime = () => {
    switch (format) {
      case 'full':
        return date.toLocaleString('vi-VN', {
          timeZone: timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
      case 'date':
        return date.toLocaleDateString('vi-VN', {
          timeZone: timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'time':
        return date.toLocaleTimeString('vi-VN', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit'
        });
        
      case 'short':
        return date.toLocaleDateString('vi-VN', {
          timeZone: timezone,
          month: 'short',
          day: 'numeric'
        });
        
      case 'relative':
        return getRelativeTime();
        
      default:
        return date.toLocaleString('vi-VN', { timeZone: timezone });
    }
  };

  // Calculate relative time (like &quot;2 hours ago", "in 3 days&quot;)
  const getRelativeTime = () => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffMinutes) < 1) {
      return 'vừa mới';
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 
        ? `trong ${diffMinutes} phút` 
        : `${Math.abs(diffMinutes)} phút trước`;
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 
        ? `trong ${diffHours} giờ` 
        : `${Math.abs(diffHours)} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { timeZone: timezone });
    }
  };

  return (
    <time 
      dateTime={date.toISOString()} 
      className={className}
      title={`UTC: ${date.toISOString()}`}
    >
      {getFormattedTime()}
    </time>
  );
};

// Specialized components for common use cases
export const OrderDateDisplay: React.FC<{ orderDate: string | Date; className?: string }> = ({
  orderDate,
  className
}) => (
  <TimeDisplay 
    utcTimestamp={orderDate} 
    format="date"
    className={className}
  />
);

export const TimestampDisplay: React.FC<{ timestamp: string | Date; className?: string }> = ({
  timestamp,
  className
}) => (
  <TimeDisplay 
    utcTimestamp={timestamp} 
    format="relative"
    className={className}
  />
);

export default TimeDisplay;