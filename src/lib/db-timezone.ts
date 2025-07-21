// Database Timezone Utilities - Industry Best Practices
// Always store UTC in database, convert for business logic

import { prisma } from './prisma';
import {
  getCurrentUtc,
  vietnamTimeToUtc,
  toVietnamTime,
  VIETNAM_TIMEZONE,
} from './timezone';

/**
 * Create timestamps for database operations
 * Industry standard: Store UTC, display in local timezone
 */
export function createDbTimestamp(): Date {
  return getCurrentUtc();
}

/**
 * Convert user input time to UTC for database storage
 * Example: User selects "2024-01-15 10:00 AM" Vietnam time -> Store as UTC
 */
export function userTimeToDbTime(vietnamTime: Date): Date {
  return vietnamTimeToUtc(vietnamTime);
}

/**
 * Convert database UTC time to Vietnam time for display
 * Example: Database has "2024-01-15 03:00:00 UTC" -> Display as "10:00 AM Vietnam"
 */
export function dbTimeToUserTime(utcTime: Date): Date {
  return toVietnamTime(utcTime);
}

/**
 * Query orders for a specific Vietnam date
 * Handles timezone conversion for date range queries
 */
export async function getOrdersByVietnamDate(
  vietnamDate: string,
  universityId: string
) {
  // Convert Vietnam date to UTC date range
  const startOfDayVietnam = new Date(`${vietnamDate}T00:00:00`);
  const endOfDayVietnam = new Date(`${vietnamDate}T23:59:59`);

  const startOfDayUtc = vietnamTimeToUtc(startOfDayVietnam);
  const endOfDayUtc = vietnamTimeToUtc(endOfDayVietnam);

  return await prisma.order.findMany({
    where: {
      universityId,
      orderDate: {
        gte: startOfDayUtc,
        lte: endOfDayUtc,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get orders created in the last N hours (Vietnam time)
 * Example: Orders created in last 24 hours Vietnam time
 */
export async function getRecentOrdersVietnamTime(
  universityId: string,
  hoursBack: number = 24
) {
  const vietnamNow = getCurrentUtc(); // Get current UTC
  const hoursBackUtc = new Date(
    vietnamNow.getTime() - hoursBack * 60 * 60 * 1000
  );

  return await prisma.order.findMany({
    where: {
      universityId,
      createdAt: {
        gte: hoursBackUtc,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Create order with proper timezone handling
 * Business logic uses Vietnam time, database stores UTC
 */
export async function createOrderWithTimezone(orderData: {
  userId: string;
  universityId: string;
  orderDateVietnam: string; // "2024-01-15" in Vietnam timezone
  totalAmount: number;
  orderNumber?: string; // Optional, will be auto-generated if not provided
  // ... other order fields
}) {
  // Convert Vietnam order date to UTC for storage
  const vietnamOrderDate = new Date(`${orderData.orderDateVietnam}T12:00:00`); // Noon Vietnam time
  const utcOrderDate = vietnamTimeToUtc(vietnamOrderDate);

  // Generate order number if not provided
  const orderNumber =
    orderData.orderNumber ||
    `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return await prisma.order.create({
    data: {
      orderNumber,
      userId: orderData.userId,
      universityId: orderData.universityId,
      orderDate: utcOrderDate, // Store as UTC
      totalAmount: orderData.totalAmount,
      subtotalAmount: orderData.totalAmount, // Required field
      createdAt: getCurrentUtc(), // Always UTC
      updatedAt: getCurrentUtc(), // Always UTC
    },
  });
}

/**
 * Analytics queries with timezone awareness
 * Gets daily order counts in Vietnam timezone
 */
export async function getDailyOrderStatsVietnam(
  universityId: string,
  startDateVietnam: string,
  endDateVietnam: string
) {
  // Convert Vietnam date range to UTC
  const startUtc = vietnamTimeToUtc(new Date(`${startDateVietnam}T00:00:00`));
  const endUtc = vietnamTimeToUtc(new Date(`${endDateVietnam}T23:59:59`));

  return await prisma.order.groupBy({
    by: ['orderDate'],
    where: {
      universityId,
      orderDate: {
        gte: startUtc,
        lte: endUtc,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
    orderBy: {
      orderDate: 'asc',
    },
  });
}

/**
 * Business hours validation for Vietnam timezone
 * Example: Check if order is placed during business hours
 */
export function isOrderPlacedDuringBusinessHours(createdAt: Date): boolean {
  const vietnamTime = toVietnamTime(createdAt);
  const hours = vietnamTime.getHours();

  // Business hours: 6 AM to 11 PM Vietnam time
  return hours >= 6 && hours <= 23;
}

/**
 * Format database timestamp for user display
 * Always show times in Vietnam timezone to users
 */
export function formatDbTimeForUser(utcTime: Date): {
  date: string;
  time: string;
  full: string;
} {
  const vietnamTime = toVietnamTime(utcTime);

  return {
    date: vietnamTime.toLocaleDateString('en-US', {
      timeZone: VIETNAM_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: vietnamTime.toLocaleTimeString('en-US', {
      timeZone: VIETNAM_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    full: vietnamTime.toLocaleString('en-US', {
      timeZone: VIETNAM_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

/**
 * Server-side timezone validation
 * Ensures all server operations use consistent timezone handling
 */
export function validateServerTimezone(): boolean {
  try {
    const vietnamTime = toVietnamTime(new Date());
    const utcTime = getCurrentUtc();

    // Validate that our timezone functions work correctly
    const converted = vietnamTimeToUtc(vietnamTime);
    const timeDiff = Math.abs(converted.getTime() - utcTime.getTime());

    // Should be within 1 minute difference (relaxed for server environments)
    return timeDiff < 60000;
  } catch (error) {
    console.error('❌ Timezone validation failed:', error);
    return false;
  }
}

// Export for health checks
export { VIETNAM_TIMEZONE };
