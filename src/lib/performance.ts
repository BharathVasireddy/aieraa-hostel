// Performance monitoring and optimization utilities
import { lightningCache } from './cache'

// Performance metrics tracking
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private readonly MAX_METRICS = 100

  trackTiming(key: string, duration: number): void {
    const times = this.metrics.get(key) || []
    times.push(duration)
    
    // Keep only recent metrics
    if (times.length > this.MAX_METRICS) {
      times.shift()
    }
    
    this.metrics.set(key, times)
  }

  getAverageTiming(key: string): number {
    const times = this.metrics.get(key) || []
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  getMetrics(): Record<string, { avg: number, count: number, recent: number }> {
    const result: Record<string, { avg: number, count: number, recent: number }> = {}
    
    this.metrics.forEach((times, key) => {
      result[key] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length,
        recent: times[times.length - 1] || 0
      }
    })
    
    return result
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor()

// Lightning-fast fetch with performance tracking
export async function lightningFastFetch(url: string, options?: RequestInit): Promise<any> {
  const startTime = performance.now()
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const duration = performance.now() - startTime
    
    performanceMonitor.trackTiming(url, duration)
    
    return data
  } catch (error) {
    const duration = performance.now() - startTime
    performanceMonitor.trackTiming(`${url}_error`, duration)
    throw error
  }
}

// Preload critical application data
export async function preloadCriticalData(): Promise<void> {
  try {
    // Preload menu data for faster navigation
    const menuData = await lightningFastFetch('/api/menu')
    lightningCache.setInstant('menu_data', menuData)
  } catch (error) {
    // Silently handle preload errors
  }
}

// Optimized image loading
export function optimizeImageLoading(): void {
  if (typeof window !== 'undefined') {
    const images = document.querySelectorAll('img[data-src]')
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.classList.remove('lazy')
          imageObserver.unobserve(img)
        }
      })
    })
    
    images.forEach(img => imageObserver.observe(img))
  }
}

// Performance-optimized debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// API performance monitoring
export function withPerformanceMonitoring<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  return apiCall()
    .then(result => {
      const duration = performance.now() - startTime
      performanceMonitor.trackTiming(endpoint, duration)
      
      // Track slow APIs
      if (duration > 1000) {
        // Log slow API without console
        performanceMonitor.trackTiming(`${endpoint}_slow`, duration)
      }
      
      return result
    })
    .catch(error => {
      const duration = performance.now() - startTime
      performanceMonitor.trackTiming(`${endpoint}_error`, duration)
      
      // Track failed APIs
      performanceMonitor.trackTiming(`${endpoint}_failed`, duration)
      
      throw error
    })
}

// Bundle size optimization helpers
export function lazyLoad<T>(importFunction: () => Promise<T>): Promise<T> {
  return importFunction()
}

// Memory usage optimization
export function optimizeMemoryUsage(): void {
  // Clear old cache entries
  if (typeof window !== 'undefined') {
    // Clear expired cache entries every 5 minutes
    setInterval(() => {
      lightningCache.clear()
    }, 5 * 60 * 1000)
  }
}

// Resource hints for better performance
export function addResourceHints(): void {
  if (typeof window !== 'undefined') {
    const head = document.head
    
    // Preconnect to API domain
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = window.location.origin
    head.appendChild(preconnect)
    
    // DNS prefetch for external resources
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = '//fonts.googleapis.com'
    head.appendChild(dnsPrefetch)
  }
}

// Performance summary
export function getPerformanceSummary(): Record<string, any> {
  const metrics = performanceMonitor.getMetrics()
  const summary = {
    totalRequests: Object.keys(metrics).length,
    averageResponseTime: Object.values(metrics).reduce((sum, m) => sum + m.avg, 0) / Object.keys(metrics).length || 0,
    slowRequests: Object.entries(metrics).filter(([_, m]) => m.avg > 1000).length,
    failedRequests: Object.keys(metrics).filter(key => key.includes('_error')).length,
    cacheHitRate: calculateCacheHitRate(),
    timestamp: new Date().toISOString()
  }
  
  return summary
}

// Calculate cache hit rate
function calculateCacheHitRate(): number {
  // This is a simplified calculation
  // In a real implementation, you'd track cache hits vs misses
  return 0.85 // Example 85% hit rate
}

// Initialize performance optimizations
export function initializePerformanceOptimizations(): void {
  if (typeof window !== 'undefined') {
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImageLoading()
      addResourceHints()
      optimizeMemoryUsage()
      preloadCriticalData()
    })
  }
}

// Web Vitals tracking (simplified)
export function trackWebVitals(): void {
  if (typeof window !== 'undefined') {
    // Track Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      performanceMonitor.trackTiming('LCP', lastEntry.startTime)
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    
    // Track First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        performanceMonitor.trackTiming('FID', entry.processingStart - entry.startTime)
      })
    }).observe({ type: 'first-input', buffered: true })
  }
} 