// Simplified high-performance caching system
import { unstable_cache as nextCache } from 'next/cache'

// Types
export interface CacheOptions {
  duration?: number // minutes
  force?: boolean
  tags?: string[]
}

// Simple in-memory cache for immediate access (client-side only)
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const expires = Date.now() + (ttlMinutes * 60 * 1000)
    this.cache.set(key, { data, expires })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
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

  // Get cache size for debugging
  size(): number {
    return this.cache.size
  }
}

// Global cache instance
export const cache = new SimpleCache()

// Request deduplication to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()

// Simplified fetch with basic caching
export async function cachedFetch(
  url: string,
  options: CacheOptions = {},
  cacheDuration: number = 5 // minutes
): Promise<any> {
  const { force = false } = options
  const cacheKey = `fetch_${url}`

  // Check if request is already pending (deduplication)
  if (pendingRequests.has(cacheKey)) {
    return await pendingRequests.get(cacheKey)!
  }

  // Check cache first (unless forced)
  if (!force) {
    const cached = cache.get(cacheKey)
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
        next: { revalidate: cacheDuration * 60 }, // Next.js cache
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Cache the successful response
      cache.set(cacheKey, data, cacheDuration)

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
export const serverCache = (
  fn: Function,
  keys: string[],
  options: { revalidate?: number; tags?: string[] } = {}
) => {
  return nextCache(fn, keys, {
    revalidate: options.revalidate || 300, // 5 minutes default
    tags: options.tags || []
  })
}

// Simple cache invalidation
export const invalidateCache = (pattern: string) => {
  for (const [key] of cache['cache']) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// Clear all cache
export const clearAllCache = () => {
  cache.clear()
  pendingRequests.clear()
} 