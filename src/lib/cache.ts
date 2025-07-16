// Lightning-fast caching system for optimal performance
import { unstable_cache as nextCache } from 'next/cache'

// Types
export interface LightningCacheOptions {
  duration?: number // minutes
  force?: boolean
  tags?: string[]
}

export interface InstantCacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

// In-memory instant cache for immediate access
class InstantCache {
  private cache = new Map<string, InstantCacheItem<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Instant cache for immediate access (no TTL check)
  setInstant<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL
    })
  }

  getInstant<T>(key: string): T | null {
    const item = this.cache.get(key)
    return item ? item.data : null
  }

  deleteInstant(key: string): void {
    this.cache.delete(key)
  }
}

// Global instant cache instance
export const lightningCache = new InstantCache()

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>()

// Lightning fetch with comprehensive caching
export async function lightningFetch(
  url: string,
  options: LightningCacheOptions = {},
  cacheDuration: number = 5 // minutes
): Promise<any> {
  const { force = false, tags = [] } = options
  const cacheKey = `lightning_${url}_${JSON.stringify(options)}`

  // Check if request is already pending (deduplication)
  if (pendingRequests.has(cacheKey)) {
    return await pendingRequests.get(cacheKey)!
  }

  // Check instant cache first
  if (!force) {
    const cached = lightningCache.get(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        ...options,
      })

      // Handle specific error cases
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`)
        } else if (response.status === 404) {
          throw new Error('Resource not found')
        } else if (response.status === 403) {
          throw new Error('Access forbidden')
        } else {
          throw new Error(`HTTP error: ${response.status}`)
        }
      }

      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Cache the successful response
      lightningCache.set(cacheKey, data, cacheDuration)

      return data
    } catch (error) {
      throw error
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey)
    }
  })()

  // Store the promise to prevent duplicate requests
  pendingRequests.set(cacheKey, requestPromise)

  return requestPromise
}

// Next.js cache wrapper for server-side caching
export const nextLightningCache = (
  fn: Function,
  keys: string[],
  options: { revalidate?: number; tags?: string[] } = {}
) => {
  return nextCache(fn, keys, {
    revalidate: options.revalidate || 300, // 5 minutes default
    tags: options.tags || []
  })
}

// Preload critical data
export const preloadCriticalData = async (urls: string[]) => {
  const promises = urls.map(url => lightningFetch(url, {}, 30)) // 30 min cache
  await Promise.allSettled(promises)
}

// Cache invalidation
export const invalidateCache = (pattern: string) => {
  // Clear matching instant cache entries
  for (const [key] of lightningCache['cache']) {
    if (key.includes(pattern)) {
      lightningCache.delete(key)
    }
  }
}

// Performance optimized cache warming
export const warmCache = async (endpoints: string[]) => {
  const promises = endpoints.map(endpoint => 
    lightningFetch(endpoint, {}, 60) // 1 hour cache
  )
  await Promise.allSettled(promises)
} 