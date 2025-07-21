'use client'

import { useEffect } from 'react'

interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export default function PWAPerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    const measurePerformance = () => {
      // Wait for page load
      if (document.readyState !== 'complete') {
        window.addEventListener('load', measurePerformance)
        return
      }

      const metrics: Partial<PerformanceMetrics> = {}

      // Measure Core Web Vitals
      measureCoreWebVitals(metrics)

      // Send metrics to server after a delay
      setTimeout(() => {
        sendMetricsToServer(metrics)
      }, 3000)
    }

    measurePerformance()

    // Monitor for updates
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        handlePerformanceEntry(entry)
      }
    })

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })

    return () => {
      observer.disconnect()
    }
  }, [])

  const measureCoreWebVitals = (metrics: Partial<PerformanceMetrics>) => {
    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime
    }

    // Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
    }

    // Largest Contentful Paint
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
    if (lcpEntries.length > 0) {
      const lastLCP = lcpEntries[lcpEntries.length - 1] as any
      metrics.lcp = lastLCP.startTime
    }
  }

  const handlePerformanceEntry = (entry: PerformanceEntry) => {
    // Log significant performance issues only
    if (entry.entryType === 'largest-contentful-paint') {
      const lcp = entry.startTime
      if (lcp > 4000) { // LCP > 4s is poor
        console.warn(`Poor LCP detected: ${lcp}ms`)
      }
    }

    if (entry.entryType === 'first-input') {
      const fid = (entry as any).processingStart - entry.startTime
      if (fid > 300) { // FID > 300ms is poor
        console.warn(`Poor FID detected: ${fid}ms`)
      }
    }

    if (entry.entryType === 'layout-shift') {
      const cls = (entry as any).value
      if (cls > 0.25) { // CLS > 0.25 is poor
        console.warn(`Poor CLS detected: ${cls}`)
      }
    }
  }

  const sendMetricsToServer = async (metrics: Partial<PerformanceMetrics>) => {
    try {
      // Only send if we have meaningful data
      if (Object.keys(metrics).length === 0) return

      const payload = {
        metrics,
        timestamp: Date.now(),
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      }

      // Send to performance API (implement server endpoint)
      await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Fail silently in production
      })
    } catch (error) {
      // Fail silently
    }
  }

  // This component doesn't render anything
  return null
}

// Hook for monitoring performance in components
export function usePerformanceMonitoring() {
  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`)
      }
    }
  })
}

// Preload critical resources
export function preloadCriticalResources() {
  useEffect(() => {
    // Preload fonts
    const linkFont = document.createElement('link')
    linkFont.rel = 'preload'
    linkFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    linkFont.as = 'style'
    document.head.appendChild(linkFont)

    // Preload critical images
    const criticalImages = [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ]

    criticalImages.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = src
      link.as = 'image'
      document.head.appendChild(link)
    })

    // DNS prefetch for external domains
    const prefetchDomains = [
      'res.cloudinary.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ]

    prefetchDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = `//${domain}`
      document.head.appendChild(link)
    })
  }, [])
} 