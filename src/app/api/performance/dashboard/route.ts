import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPerformanceDashboard } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins and managers to access performance data
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get performance insights
    const performanceData = getPerformanceDashboard();

    // Get real-time connection stats
    const connectionStats = { totalConnections: 0, connectionsByRole: {} };

    // Get system metrics
    const systemMetrics = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    // API health check
    const apiHealth = {
      status: 'healthy',
      database: 'connected', // You could add actual DB health check here
      realtime: connectionStats.totalConnections > 0 ? 'active' : 'idle',
      lastCheck: new Date().toISOString(),
    };

    const dashboard = {
      performance: performanceData,
      realtime: {
        connections: connectionStats,
        isActive: connectionStats.totalConnections > 0,
      },
      system: systemMetrics,
      health: apiHealth,
      summary: {
        status:
          performanceData.stats.averageResponseTime < 200
            ? 'excellent'
            : performanceData.stats.averageResponseTime < 500
              ? 'good'
              : 'needs_attention',
        score: calculatePerformanceScore(performanceData.stats),
        criticalIssues: performanceData.insights.filter((insight: string) =>
          insight.includes('⚠️')
        ).length,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to generate performance dashboard' },
      { status: 500 }
    );
  }
}

function calculatePerformanceScore(stats: any): number {
  let score = 100;

  // Response time penalty
  if (stats.averageResponseTime > 100) {
    score -= Math.min(30, (stats.averageResponseTime - 100) / 10);
  }

  // Success rate penalty
  if (stats.successRate < 100) {
    score -= (100 - stats.successRate) * 2;
  }

  // Slow queries penalty
  if (stats.slowQueries > 0) {
    score -= Math.min(20, stats.slowQueries * 2);
  }

  return Math.max(0, Math.round(score));
}
