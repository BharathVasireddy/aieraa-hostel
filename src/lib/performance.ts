import React from 'react'

// Lightning Performance Optimization System
export class LightningPerformance {
  private static instance: LightningPerformance
  private cache = new Map<string, any>()
  private requestCache = new Map<string, Promise<any>>()
  
  static getInstance(): LightningPerformance {
    if (!LightningPerformance.instance) {
      LightningPerformance.instance = new LightningPerformance()
    }
    return LightningPerformance.instance
  }

  // Instant cache for immediate responses
  setInstant(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  getInstant(key: string): any | null {
    const item = this.cache.get(key)
    return item ? item.data : null
  }

  // Deduplicated fetch - prevents multiple identical requests
  async lightningFetch(url: string, options?: RequestInit): Promise<any> {
    const cacheKey = `${url}_${JSON.stringify(options || {})}`
    
    // Return instant cache if available
    const cached = this.getInstant(cacheKey)
    if (cached) {
      console.log(`⚡ INSTANT: ${url}`)
      return cached
    }

    // Check if request is already in flight
    if (this.requestCache.has(cacheKey)) {
      console.log(`🔄 DEDUPED: ${url}`)
      return this.requestCache.get(cacheKey)
    }

    // Make new request
    const requestPromise = fetch(url, options)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(data => {
        // Cache for 5 minutes
        this.setInstant(cacheKey, data)
        setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000)
        this.requestCache.delete(cacheKey)
        return data
      })
      .catch(error => {
        this.requestCache.delete(cacheKey)
        throw error
      })

    this.requestCache.set(cacheKey, requestPromise)
    return requestPromise
  }

  // Preload critical data
  async preloadMenuData(): Promise<void> {
    try {
      // Get tomorrow's date (most common order date)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      
      // Preload menu for tomorrow
      await this.lightningFetch(`/api/student/menu?date=${dateStr}`)
      console.log('🚀 Preloaded menu data')
    } catch (error) {
      console.log('Failed to preload menu data:', error)
    }
  }
}

// Optimized component rendering
export function useOptimizedState<T>(initialValue: T): [T, (value: T) => void] {
  const [state, setState] = React.useState(initialValue)
  
  const optimizedSetState = React.useCallback((value: T) => {
    setState(prevState => {
      // Only update if value actually changed
      if (JSON.stringify(prevState) === JSON.stringify(value)) {
        return prevState
      }
      return value
    })
  }, [])
  
  return [state, optimizedSetState]
}

// Export singleton instance
export const lightning = LightningPerformance.getInstance()

// Auto-preload on module load
if (typeof window !== 'undefined') {
  // Preload after a short delay to not block initial render
  setTimeout(() => {
    lightning.preloadMenuData()
  }, 1000)
} 

// Real-time performance monitoring for lightning-fast APIs

interface PerformanceMetric {
  endpoint: string
  duration: number
  timestamp: number
  userId?: string
  success: boolean
  error?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private slowQueryThreshold = 100 // 100ms threshold
  private maxMetricsSize = 1000

  track<T>(endpoint: string, userId?: string) {
    return async (handler: () => Promise<T>): Promise<T> => {
      const start = performance.now()
      const timestamp = Date.now()

      try {
        const result = await handler()
        const duration = performance.now() - start

        this.recordMetric({
          endpoint,
          duration,
          timestamp,
          userId,
          success: true
        })

        // Log slow queries immediately
        if (duration > this.slowQueryThreshold) {
          console.warn(`🐌 Slow API: ${endpoint} took ${duration.toFixed(2)}ms`, {
            userId,
            timestamp: new Date(timestamp).toISOString()
          })
        }

        return result
      } catch (error) {
        const duration = performance.now() - start
        
        this.recordMetric({
          endpoint,
          duration,
          timestamp,
          userId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })

        console.error(`❌ Failed API: ${endpoint} after ${duration.toFixed(2)}ms`, {
          error: error instanceof Error ? error.message : String(error),
          userId,
          timestamp: new Date(timestamp).toISOString()
        })

        throw error
      }
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Keep metrics array bounded
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize / 2)
    }
  }

  getStats(timeWindowMs: number = 60000) {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < timeWindowMs
    )

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        slowQueries: 0,
        topSlowEndpoints: []
      }
    }

    const successfulRequests = recentMetrics.filter(m => m.success)
    const slowQueries = recentMetrics.filter(m => m.duration > this.slowQueryThreshold)
    
    // Group by endpoint for slow query analysis
    const endpointStats = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = { total: 0, totalTime: 0, slow: 0 }
      }
      acc[metric.endpoint].total++
      acc[metric.endpoint].totalTime += metric.duration
      if (metric.duration > this.slowQueryThreshold) {
        acc[metric.endpoint].slow++
      }
      return acc
    }, {} as Record<string, { total: number; totalTime: number; slow: number }>)

    const topSlowEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.total,
        slowQueryCount: stats.slow,
        totalRequests: stats.total
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5)

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
      successRate: (successfulRequests.length / recentMetrics.length) * 100,
      slowQueries: slowQueries.length,
      topSlowEndpoints
    }
  }

  // Get real-time performance insights
  getRealTimeInsights() {
    const stats = this.getStats()
    const insights: string[] = []

    if (stats.averageResponseTime > 200) {
      insights.push(`⚠️ High average response time: ${stats.averageResponseTime.toFixed(2)}ms`)
    }

    if (stats.successRate < 95) {
      insights.push(`⚠️ Low success rate: ${stats.successRate.toFixed(1)}%`)
    }

    if (stats.slowQueries > 0) {
      insights.push(`⚠️ ${stats.slowQueries} slow queries in last minute`)
    }

    if (stats.averageResponseTime < 50) {
      insights.push(`⚡ Excellent performance: ${stats.averageResponseTime.toFixed(2)}ms avg`)
    }

    return {
      stats,
      insights,
      timestamp: Date.now()
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Convenience wrapper for API routes
export function withPerformanceTracking<T extends any[], R>(
  endpoint: string,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return performanceMonitor.track(endpoint)(async () => {
      return handler(...args)
    })
  }
}

// Database query performance tracking
export function trackDatabaseQuery<T>(queryName: string, userId?: string) {
  return performanceMonitor.track(`db:${queryName}`, userId)
}

// API endpoint performance tracking
export function trackAPIEndpoint<T>(endpoint: string, userId?: string) {
  return performanceMonitor.track(`api:${endpoint}`, userId)
}

// Real-time performance dashboard endpoint helper
export function getPerformanceDashboard() {
  const insights = performanceMonitor.getRealTimeInsights()
  
  return {
    ...insights,
    recommendations: generatePerformanceRecommendations(insights.stats)
  }
}

function generatePerformanceRecommendations(stats: any) {
  const recommendations: string[] = []

  if (stats.averageResponseTime > 150) {
    recommendations.push("Consider adding database indexes or optimizing queries")
  }

  if (stats.slowQueries > 5) {
    recommendations.push("Review slow query patterns and add request deduplication")
  }

  if (stats.successRate < 98) {
    recommendations.push("Investigate error patterns and add retry mechanisms")
  }

  if (stats.topSlowEndpoints.length > 0) {
    const slowest = stats.topSlowEndpoints[0]
    recommendations.push(`Focus optimization on ${slowest.endpoint} (${slowest.averageTime.toFixed(2)}ms avg)`)
  }

  return recommendations
}

// Automatic performance logging every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const insights = performanceMonitor.getRealTimeInsights()
    if (insights.stats.totalRequests > 0) {
      console.log('📊 Performance Summary:', {
        requests: insights.stats.totalRequests,
        avgTime: `${insights.stats.averageResponseTime.toFixed(2)}ms`,
        successRate: `${insights.stats.successRate.toFixed(1)}%`,
        slowQueries: insights.stats.slowQueries
      })
    }
  }, 30000)
} 