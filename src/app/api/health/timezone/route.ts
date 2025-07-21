import { NextResponse } from 'next/server';
import {
  getVietnamTime,
  getCurrentUtc,
  toVietnamTime,
  vietnamTimeToUtc,
  formatVietnamTime,
  formatVietnamDate,
  isVietnamBusinessHours,
  VIETNAM_TIMEZONE,
} from '@/lib/timezone';
import { validateServerTimezone } from '@/lib/db-timezone';

export async function GET() {
  try {
    // Validate timezone functions
    const isValid = validateServerTimezone();

    // Get current times
    const vietnamTime = getVietnamTime();
    const utcTime = getCurrentUtc();

    // Test conversions
    const testDate = new Date('2024-01-15T15:00:00Z'); // 3 PM UTC
    const convertedToVietnam = toVietnamTime(testDate); // Should be 10 PM Vietnam
    const convertedBackToUtc = vietnamTimeToUtc(convertedToVietnam);

    // Calculate offsets
    const vietnamOffset = vietnamTime.getTimezoneOffset();
    const expectedOffset = -420; // Vietnam is UTC+7 = -420 minutes

    // Business logic checks
    const isBusinessHours = isVietnamBusinessHours();

    // Format checks
    const formattedTime = formatVietnamTime();
    const formattedDate = formatVietnamDate();

    const response = {
      status: isValid ? 'healthy' : 'error',
      timestamp: new Date().toISOString(),

      // Core timezone info
      timezone: VIETNAM_TIMEZONE,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      // Current times
      currentTimes: {
        vietnamTime: vietnamTime.toISOString(),
        utcTime: utcTime.toISOString(),
        formatted: {
          time: formattedTime,
          date: formattedDate,
        },
      },

      // Offset validation
      offsets: {
        vietnam: vietnamOffset,
        expected: expectedOffset,
        isCorrect: vietnamOffset === expectedOffset,
      },

      // Conversion tests
      conversionTests: {
        input: testDate.toISOString(),
        toVietnam: convertedToVietnam.toISOString(),
        backToUtc: convertedBackToUtc.toISOString(),
        roundTripSuccess:
          Math.abs(testDate.getTime() - convertedBackToUtc.getTime()) < 1000,
      },

      // Business logic
      businessLogic: {
        isBusinessHours,
        vietnamHour: vietnamTime.getHours(),
        businessHoursRange: '06:00 - 23:00',
      },

      // Environment check
      environment: {
        nodeEnv: process.env.NODE_ENV,
        tz: process.env.TZ,
        nodeTz: process.env.NODE_TZ,
      },

      // Validation results
      validation: {
        overall: isValid,
        offsetCorrect: vietnamOffset === expectedOffset,
        conversionsWorking:
          Math.abs(testDate.getTime() - convertedBackToUtc.getTime()) < 1000,
        formattingWorking:
          formattedTime.includes('M') && formattedDate.includes('2024'),
      },
    };

    // Determine overall health status
    const allChecksPass =
      isValid &&
      vietnamOffset === expectedOffset &&
      Math.abs(testDate.getTime() - convertedBackToUtc.getTime()) < 1000;

    return NextResponse.json(
      {
        ...response,
        healthy: allChecksPass,
      },
      {
        status: allChecksPass ? 200 : 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('❌ Timezone health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
