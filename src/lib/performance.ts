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