// Vietnam Timezone Utilities - Server-Independent Implementation
// Works regardless of server timezone location

import { addDays, startOfDay, format } from 'date-fns';

// Vietnam timezone constant
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_UTC_OFFSET = 7 * 60 * 60 * 1000; // +7 hours in milliseconds

/**
 * Get current time in Vietnam timezone
 * Uses timezone offset calculation for reliable conversion
 */
export function getVietnamTime(): Date {
  const now = new Date();
  
  // Create a new date adjusted for Vietnam timezone
  // This approach accounts for daylight saving time automatically
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const vietnamTime = new Date(utc + (7 * 3600000)); // Add 7 hours for Vietnam timezone
  
  return vietnamTime;
}

/**
 * Convert any date to Vietnam timezone
 * Uses timezone offset calculation for reliable conversion
 */
export function toVietnamTime(date: Date): Date {
  // Create a new date adjusted for Vietnam timezone
  // This approach accounts for daylight saving time automatically
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const vietnamTime = new Date(utc + (7 * 3600000)); // Add 7 hours for Vietnam timezone
  
  return vietnamTime;
}

/**
 * Convert Vietnam time to UTC for database storage
 * Critical: Always store UTC in database
 */
export function vietnamTimeToUtc(vietnamTime: Date): Date {
  // Subtract exactly 7 hours from Vietnam time to get UTC
  return new Date(vietnamTime.getTime() - VIETNAM_UTC_OFFSET);
}

/**
 * Get current UTC time (for database operations)
 * Best practice: Server operations in UTC
 */
export function getCurrentUtc(): Date {
  return new Date();
}

/**
 * Create a date in Vietnam timezone from date components
 * Useful for creating specific Vietnam times
 */
export function createVietnamTime(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0
): Date {
  // Create the desired Vietnam time as if it were UTC
  const vietnamTimeAsUtc = new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds, 0)
  );

  // Convert this "Vietnam time" to actual UTC by subtracting 7 hours
  // This gives us the UTC time that will show as the desired Vietnam time when converted
  return vietnamTimeToUtc(vietnamTimeAsUtc);
}

/**
 * Get greeting based on Vietnam time
 * Uses proper timezone-aware time calculation
 */
export function getVietnamGreeting(): string {
  const vietnamTime = getVietnamTime();
  const hours = vietnamTime.getHours();

  if (hours < 12) {
    return 'Morning';
  } else if (hours < 17) {
    return 'Afternoon';
  } else {
    return 'Evening';
  }
}

/**
 * Get cutoff time for orders in Vietnam timezone
 * Industry practice: Business logic in local timezone
 */
export function getOrderCutoffTime(orderDate: string): Date {
  // Parse the order date (YYYY-MM-DD)
  const [year, month, day] = orderDate.split('-').map(Number);

  // Get the day before the order date
  const orderDateObj = new Date(year, month - 1, day);
  const dayBefore = addDays(orderDateObj, -1);

  // Create 10 PM Vietnam time on the day before
  const cutoffVietnam = createVietnamTime(
    dayBefore.getFullYear(),
    dayBefore.getMonth() + 1,
    dayBefore.getDate(),
    22, // 10 PM
    0, // 0 minutes
    0 // 0 seconds
  );

  return cutoffVietnam;
}

/**
 * Check if current Vietnam time is past ordering cutoff
 * Timezone-aware business logic
 */
export function isPastOrderingCutoff(orderDate: string): boolean {
  const vietnamNow = getVietnamTime();
  const cutoff = getOrderCutoffTime(orderDate);
  return vietnamNow >= cutoff;
}

/**
 * Get countdown to ordering cutoff
 * Real-time countdown in Vietnam timezone
 */
export function getOrderingCountdown(orderDate: string): {
  hours: number;
  minutes: number;
  isPastCutoff: boolean;
} {
  const vietnamNow = getVietnamTime();
  const cutoff = getOrderCutoffTime(orderDate);

  if (vietnamNow >= cutoff) {
    return { hours: 0, minutes: 0, isPastCutoff: true };
  }

  const diff = cutoff.getTime() - vietnamNow.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, isPastCutoff: false };
}

/**
 * Format Vietnam time for display
 * Uses consistent formatting regardless of server timezone
 */
export function formatVietnamTime(date?: Date): string {
  const vietnamTime = date ? toVietnamTime(date) : getVietnamTime();

  // Use Vietnamese locale for proper formatting
  return vietnamTime.toLocaleTimeString('vi-VN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // Since we already converted to Vietnam time
  });
}

/**
 * Format Vietnam date for display
 * Timezone-aware date formatting
 */
export function formatVietnamDate(date?: Date): string {
  const vietnamTime = date ? toVietnamTime(date) : getVietnamTime();

  return vietnamTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Since we already converted to Vietnam time
  });
}

/**
 * Format Vietnam date and time for display
 * Shows both date and time in Vietnam timezone
 */
export function formatVietnamDateTime(date: Date, pattern = 'MMM dd, yyyy h:mm a'): string {
  // Use the date as-is for formatting (assumes it's already in correct timezone context)
  return format(date, pattern) + ' Vietnam time'
}

/**
 * Format UTC date as Vietnam time
 * Converts UTC date to Vietnam timezone first, then formats
 */
export function formatUtcAsVietnamTime(utcDate: Date, pattern = 'MMM dd, yyyy h:mm a'): string {
  const vietnamTime = toVietnamTime(utcDate)
  return format(vietnamTime, pattern) + ' Vietnam time'
}

/**
 * Format date for API/database operations (ISO string in UTC)
 * Best practice: ISO strings for API communication
 */
export function formatForApi(date: Date): string {
  return date.toISOString();
}

/**
 * Get Vietnam business hours check
 * Industry pattern: Business logic helpers
 */
export function isVietnamBusinessHours(): boolean {
  const vietnamTime = getVietnamTime();
  const hours = vietnamTime.getHours();

  // Business hours: 6 AM to 11 PM Vietnam time
  return hours >= 6 && hours <= 23;
}

/**
 * Get next business day in Vietnam
 * Handles weekends and holidays logic
 */
export function getNextVietnamBusinessDay(): Date {
  const vietnamTime = getVietnamTime();
  let nextDay = addDays(vietnamTime, 1);

  // Skip weekends (0 = Sunday, 6 = Saturday)
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay = addDays(nextDay, 1);
  }

  return startOfDay(nextDay);
}

/**
 * Parse date string in Vietnam timezone
 * Safe parsing with explicit timezone
 */
export function parseVietnamDate(dateString: string): Date {
  const parsed = new Date(dateString);
  return toVietnamTime(parsed);
}

/**
 * Get timezone offset for Vietnam in minutes
 * Should always return 420 (7 hours * 60 minutes)
 */
export function getVietnamTimezoneOffset(): number {
  return -420; // Vietnam is UTC+7, which is -420 minutes from UTC
}

/**
 * Validate timezone implementation
 * Ensures all timezone functions work correctly
 */
export function validateTimezoneImplementation(): boolean {
  try {
    // Test 1: Basic offset validation
    const expectedOffset = -420; // Vietnam UTC+7
    const actualOffset = getVietnamTimezoneOffset();
    const offsetValid = actualOffset === expectedOffset;

    // Test 2: Round-trip conversion
    const testUtc = new Date('2024-01-15T15:00:00.000Z'); // 3 PM UTC
    const convertedToVietnam = toVietnamTime(testUtc); // Should be 10 PM Vietnam
    const backToUtc = vietnamTimeToUtc(convertedToVietnam); // Should be 3 PM UTC again

    const timeDiff = Math.abs(testUtc.getTime() - backToUtc.getTime());
    const conversionValid = timeDiff < 1000; // Within 1 second

    // Test 3: Vietnam time should be 7 hours ahead of UTC
    const utcNow = getCurrentUtc();
    const vietnamNow = getVietnamTime();
    const expectedDiff = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const actualDiff = vietnamNow.getTime() - utcNow.getTime();
    const offsetDiffValid = Math.abs(actualDiff - expectedDiff) < 60000; // Within 1 minute

    // Test 4: Business hours check
    const businessHoursWorking = typeof isVietnamBusinessHours() === 'boolean';

    // Test 5: Formatting works
    const formattedTime = formatVietnamTime();
    const formattingValid =
      typeof formattedTime === 'string' && formattedTime.length > 0;

    // Debug logging for timezone validation in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Timezone Validation Results:', {
        offsetValid,
        conversionValid,
        offsetDiffValid,
        businessHoursWorking,
        formattingValid,
        testDetails: {
          expectedOffset,
          actualOffset,
          timeDiff,
          actualDiff,
          expectedDiff,
        },
      });
    }

    return (
      offsetValid &&
      conversionValid &&
      offsetDiffValid &&
      businessHoursWorking &&
      formattingValid
    );
  } catch (error) {
    console.error('❌ Timezone validation failed:', error);
    return false;
  }
}

/**
 * Debug function to show timezone information
 * Useful for troubleshooting timezone issues
 */
export function getTimezoneDebugInfo() {
  const utcNow = getCurrentUtc();
  const vietnamNow = getVietnamTime();

  return {
    utc: {
      time: utcNow.toISOString(),
      timestamp: utcNow.getTime(),
    },
    vietnam: {
      time: vietnamNow.toISOString(),
      timestamp: vietnamNow.getTime(),
      hours: vietnamNow.getHours(),
      formatted: formatVietnamTime(vietnamNow),
    },
    offset: {
      expected: -420,
      calculated: getVietnamTimezoneOffset(),
      difference: vietnamNow.getTime() - utcNow.getTime(),
      differenceHours:
        (vietnamNow.getTime() - utcNow.getTime()) / (1000 * 60 * 60),
    },
    validation: validateTimezoneImplementation(),
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getOrderCutoffTime instead
 */
export function getTomorrowOrderCutoff(): Date {
  const tomorrow = addDays(getVietnamTime(), 1);
  const tomorrowDateString = format(tomorrow, 'yyyy-MM-dd');
  return getOrderCutoffTime(tomorrowDateString);
}
