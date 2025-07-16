// Lightning-fast cache system for instant app performance
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class LightningCache {
  private cache = new Map<string, CacheItem<any>>()
  private memoryCache = new Map<string, any>() // Instant memory cache
  private requestCache = new Map<string, Promise<any>>() // Prevent duplicate requests

  // Instant memory cache for frequently accessed data
  setInstant<T>(key: string, data: T): void {
    this.memoryCache.set(key, data)
  }

  getInstant<T>(key: string): T | null {
    return this.memoryCache.get(key) || null
  }

  deleteInstant(key: string): void {
    this.memoryCache.delete(key)
  }

  // Regular cache with TTL
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    // Store in both instant and regular cache
    this.memoryCache.set(key, data)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  get<T>(key: string): T | null {
    // Try instant cache first
    const instant = this.memoryCache.get(key)
    if (instant) return instant

    // Fall back to regular cache
    const item = this.cache.get(key)
    if (!item) return null

    const isExpired = (Date.now() - item.timestamp) > item.ttl
    if (isExpired) {
      this.cache.delete(key)
      this.memoryCache.delete(key)
      return null
    }

    // Store in instant cache for next time
    this.memoryCache.set(key, item.data)
    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
    this.memoryCache.delete(key)
    this.requestCache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.memoryCache.clear()
    this.requestCache.clear()
  }

  // Deduplicated fetch - prevents multiple identical requests
  async deduplicatedFetch(url: string, options?: RequestInit): Promise<any> {
    const cacheKey = `${url}_${JSON.stringify(options || {})}`
    
    // Check if request is already in flight
    if (this.requestCache.has(cacheKey)) {
      console.log(`🔄 DEDUPED: ${url}`)
      return this.requestCache.get(cacheKey)
    }

    // Make new request
    const requestPromise = fetch(url, options)
      .then(async response => {
        // Handle different response types gracefully
        if (response.status >= 500) {
          console.error(`🚨 Server Error (${response.status}): ${url}`)
          this.requestCache.delete(cacheKey)
          // Don't throw for server errors - return error object instead
          return { 
            error: true, 
            status: response.status, 
            message: `Server error: ${response.status}` 
          }
        }
        
        if (response.status === 404) {
          console.warn(`⚠️ Not Found (404): ${url}`)
          this.requestCache.delete(cacheKey)
          return { error: true, status: 404, message: 'Resource not found' }
        }
        
        if (response.status === 403) {
          console.warn(`🚫 Forbidden (403): ${url}`)
          this.requestCache.delete(cacheKey)
          return { error: true, status: 403, message: 'Access forbidden' }
        }
        
        if (!response.ok) {
          console.error(`❌ HTTP Error (${response.status}): ${url}`)
          this.requestCache.delete(cacheKey)
          // Try to get error message from response
          try {
            const errorData = await response.json()
            return { 
              error: true, 
              status: response.status, 
              message: errorData.error || `HTTP ${response.status}` 
            }
          } catch {
            return { 
              error: true, 
              status: response.status, 
              message: `HTTP ${response.status}` 
            }
          }
        }
        
        return response.json()
      })
      .then(data => {
        this.requestCache.delete(cacheKey)
        return data
      })
      .catch(error => {
        this.requestCache.delete(cacheKey)
        console.error(`🔥 Network Error: ${url}`, error)
        // Return error object instead of throwing
        return { 
          error: true, 
          status: 0, 
          message: error.message || 'Network error' 
        }
      })

    // Cache the promise
    this.requestCache.set(cacheKey, requestPromise)
    return requestPromise
  }
}

export const lightningCache = new LightningCache()

// Lightning-fast fetch with instant cache fallback
export async function lightningFetch(url: string, options?: RequestInit, cacheMinutes: number = 30): Promise<any> {
  const cacheKey = `${url}_${JSON.stringify(options || {})}`
  
  // INSTANT: Check memory cache first
  const instantData = lightningCache.getInstant(cacheKey)
  if (instantData) {
    console.log(`⚡ INSTANT cache hit: ${url}`)
    return instantData
  }

  // FAST: Check regular cache
  const cachedData = lightningCache.get(cacheKey)
  if (cachedData) {
    console.log(`🚀 Fast cache hit: ${url}`)
    return cachedData
  }

  // NETWORK: Fetch from API with deduplication
  console.log(`🌐 Network fetch: ${url}`)
  const data = await lightningCache.deduplicatedFetch(url, options)
  
  // Store in lightning cache
  lightningCache.set(cacheKey, data, cacheMinutes)
  
  return data
}

// Pre-populate cache with static data
export function preloadStaticData() {
  // Cache categories
  const categories = [
    { key: 'all', label: 'All Items', emoji: '🍽️' },
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { key: 'lunch', label: 'Lunch', emoji: '🌞' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
    { key: 'beverages', label: 'Beverages', emoji: '☕' },
    { key: 'snacks', label: 'Snacks', emoji: '🍿' }
  ]
  lightningCache.setInstant('categories', categories)
  
  // Cache common data
  lightningCache.setInstant('app_config', {
    taxRate: 0.1,
    deliveryFee: 0,
    minOrderAmount: 50
  })
}

// Initialize static cache
preloadStaticData()

// Legacy cache exports for compatibility
export const cache = {
  set: lightningCache.set.bind(lightningCache),
  get: lightningCache.get.bind(lightningCache),
  delete: lightningCache.delete.bind(lightningCache),
  clear: lightningCache.clear.bind(lightningCache)
}

export const clientCache = lightningCache
export const cachedFetch = lightningFetch 