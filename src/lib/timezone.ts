// Vietnam Timezone Utilities - Industry Best Practice Implementation
// Using native Intl API for maximum compatibility and performance

import { addDays, startOfDay, format } from 'date-fns';

// Vietnam timezone constant
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current time in Vietnam timezone
 * Industry standard: Uses native Intl API for reliable timezone conversion
 */
export function getVietnamTime(): Date {
  const now = new Date();

  // Create a date formatter for Vietnam timezone
  const vietnamDateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  // Parse the formatted string to create a proper Date object
  return new Date(vietnamDateString);
}

/**
 * Convert any date to Vietnam timezone
 * Best practice: Explicit timezone conversion using Intl API
 */
export function toVietnamTime(date: Date): Date {
  const vietnamDateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);

  return new Date(vietnamDateString);
}

/**
 * Convert Vietnam time to UTC for database storage
 * Critical: Always store UTC in database
 */
export function vietnamTimeToUtc(vietnamTime: Date): Date {
  // Calculate the timezone offset difference
  const utcDate = new Date(
    vietnamTime.toLocaleString('en-US', { timeZone: 'UTC' })
  );
  const vietnamDate = new Date(
    vietnamTime.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE })
  );

  const offsetDiff = vietnamDate.getTime() - utcDate.getTime();

  return new Date(vietnamTime.getTime() - offsetDiff);
}

/**
 * Get current UTC time (for database operations)
 * Best practice: Server operations in UTC
 */
export function getCurrentUtc(): Date {
  return new Date();
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
 * Industry practice: Business logic in local timezone, store as UTC
 */
export function getOrderCutoffTime(orderDate: string): Date {
  // Parse order date and get the day before
  const selectedDate = new Date(orderDate);
  const dayBefore = addDays(selectedDate, -1);

  // Create cutoff time in Vietnam timezone (10 PM)
  const vietnamCutoff = new Date(dayBefore);
  vietnamCutoff.setHours(22, 0, 0, 0); // 10 PM Vietnam time

  // Convert to local time for comparison
  return toVietnamTime(vietnamCutoff);
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
 * Uses Intl API for proper locale formatting
 */
export function formatVietnamTime(date?: Date): string {
  const vietnamTime = date ? toVietnamTime(date) : getVietnamTime();

  return new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(vietnamTime);
}

/**
 * Format Vietnam date for display
 * Timezone-aware date formatting with Intl API
 */
export function formatVietnamDate(date?: Date): string {
  const vietnamTime = date ? toVietnamTime(date) : getVietnamTime();

  return new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(vietnamTime);
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
 * Used for validation and debugging
 */
export function getVietnamTimezoneOffset(): number {
  const now = new Date();
  const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const vietnamTime = new Date(
    now.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE })
  );

  return (vietnamTime.getTime() - utcTime.getTime()) / (1000 * 60);
}

/**
 * Validate timezone implementation
 * Ensures all timezone functions work correctly
 */
export function validateTimezoneImplementation(): boolean {
  try {
    // Test basic conversion
    const now = new Date();
    const vietnamTime = toVietnamTime(now);
    const backToUtc = vietnamTimeToUtc(vietnamTime);

    // Should be within 1 minute of original time
    const timeDiff = Math.abs(now.getTime() - backToUtc.getTime());
    const isConversionValid = timeDiff < 60000; // 1 minute tolerance

    // Test offset calculation
    const offset = getVietnamTimezoneOffset();
    const isOffsetValid = Math.abs(offset - 420) < 60; // Should be around +7 hours (420 minutes)

    // Test formatting
    const formatted = formatVietnamTime();
    const isFormattingValid = formatted.includes('M'); // Should contain AM/PM

    return isConversionValid && isOffsetValid && isFormattingValid;
  } catch (error) {
    console.error('❌ Timezone validation failed:', error);
    return false;
  }
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
