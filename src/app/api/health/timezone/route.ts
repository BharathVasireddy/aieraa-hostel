import { NextResponse } from 'next/server';
import {
  getVietnamTime,
  getCurrentUtc,
  toVietnamTime,
  vietnamTimeToUtc,
  formatVietnamTime,
  formatVietnamDate,
  isVietnamBusinessHours,
  getVietnamTimezoneOffset,
  validateTimezoneImplementation,
  getTimezoneDebugInfo,
  VIETNAM_TIMEZONE,
} from '@/lib/timezone';
import { validateServerTimezone } from '@/lib/db-timezone';

export async function GET() {
  try {
    // Get comprehensive debug information
    const debugInfo = getTimezoneDebugInfo();

    // Validate all timezone functions
    const isValid = validateTimezoneImplementation();
    const serverValidation = validateServerTimezone();

    // Get current times
    const vietnamTime = getVietnamTime();
    const utcTime = getCurrentUtc();

    // Test specific conversions
    const testDate = new Date('2024-01-15T15:00:00Z'); // 3 PM UTC
    const convertedToVietnam = toVietnamTime(testDate); // Should be 10 PM Vietnam
    const convertedBackToUtc = vietnamTimeToUtc(convertedToVietnam);

    // Calculate offsets and differences
    const vietnamOffset = getVietnamTimezoneOffset();
    const expectedOffset = -420; // Vietnam is UTC+7 = -420 minutes
    const timeDifference = vietnamTime.getTime() - utcTime.getTime();
    const expectedTimeDifference = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

    // Business logic checks
    const isBusinessHours = isVietnamBusinessHours();

    // Format checks
    const formattedTime = formatVietnamTime();
    const formattedDate = formatVietnamDate();

    // Round-trip conversion test
    const roundTripDiff = Math.abs(
      testDate.getTime() - convertedBackToUtc.getTime()
    );
    const roundTripSuccess = roundTripDiff < 1000; // Within 1 second

    const response = {
      status: isValid && serverValidation ? 'healthy' : 'error',
      timestamp: new Date().toISOString(),

      // Core timezone info
      timezone: VIETNAM_TIMEZONE,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      // Current times with proper calculation
      currentTimes: {
        vietnamTime: vietnamTime.toISOString(),
        utcTime: utcTime.toISOString(),
        vietnamTimestamp: vietnamTime.getTime(),
        utcTimestamp: utcTime.getTime(),
        timeDifference: timeDifference,
        timeDifferenceHours: timeDifference / (1000 * 60 * 60),
        formatted: {
          time: formattedTime,
          date: formattedDate,
        },
      },

      // Offset validation (corrected)
      offsets: {
        vietnam: vietnamOffset,
        expected: expectedOffset,
        isCorrect: vietnamOffset === expectedOffset,
        calculatedDifference: timeDifference,
        expectedDifference: expectedTimeDifference,
        offsetMatches:
          Math.abs(timeDifference - expectedTimeDifference) < 60000, // Within 1 minute
      },

      // Conversion tests (fixed)
      conversionTests: {
        input: testDate.toISOString(),
        toVietnam: convertedToVietnam.toISOString(),
        backToUtc: convertedBackToUtc.toISOString(),
        roundTripDiff: roundTripDiff,
        roundTripSuccess: roundTripSuccess,
        vietnamHour: convertedToVietnam.getHours(),
        expectedVietnamHour: 22, // 3 PM UTC + 7 hours = 10 PM Vietnam
      },

      // Business logic
      businessLogic: {
        isBusinessHours,
        vietnamHour: vietnamTime.getHours(),
        businessHoursRange: '06:00 - 23:00',
        currentVietnamTime: vietnamTime.toLocaleString('en-US', {
          timeZone: 'UTC',
        }),
      },

      // Environment check
      environment: {
        nodeEnv: process.env.NODE_ENV,
        tz: process.env.TZ,
        nodeTz: process.env.NODE_TZ || 'not set',
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },

      // Validation results (comprehensive)
      validation: {
        overall: isValid,
        serverValidation: serverValidation,
        offsetCorrect: vietnamOffset === expectedOffset,
        conversionsWorking: roundTripSuccess,
        formattingWorking: formattedTime.length > 0 && formattedDate.length > 0,
        timeDifferenceCorrect:
          Math.abs(timeDifference - expectedTimeDifference) < 60000,
        businessHoursWorking: typeof isBusinessHours === 'boolean',
      },

      // Debug information
      debug: debugInfo,

      // Specific issue analysis
      issues: [] as string[],
    };

    // Analyze specific issues
    if (vietnamOffset !== expectedOffset) {
      response.issues.push(
        `Timezone offset incorrect: got ${vietnamOffset}, expected ${expectedOffset}`
      );
    }

    if (!roundTripSuccess) {
      response.issues.push(
        `Round-trip conversion failed: difference of ${roundTripDiff}ms`
      );
    }

    if (Math.abs(timeDifference - expectedTimeDifference) >= 60000) {
      response.issues.push(
        `Time difference incorrect: got ${timeDifference}ms, expected ${expectedTimeDifference}ms`
      );
    }

    if (convertedToVietnam.getHours() !== 22) {
      response.issues.push(
        `Conversion test failed: 3 PM UTC should be 10 PM Vietnam, got ${convertedToVietnam.getHours()}`
      );
    }

    // Determine overall health status
    const allChecksPass =
      isValid &&
      serverValidation &&
      vietnamOffset === expectedOffset &&
      roundTripSuccess &&
      Math.abs(timeDifference - expectedTimeDifference) < 60000;

    return NextResponse.json(
      {
        ...response,
        healthy: allChecksPass,
        summary: allChecksPass
          ? '✅ All timezone functions working correctly'
          : `❌ Issues found: ${response.issues.join(', ')}`,
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
        issues: ['Health check endpoint crashed'],
        summary: '❌ Timezone health check crashed',
      },
      { status: 500 }
    );
  }
}
