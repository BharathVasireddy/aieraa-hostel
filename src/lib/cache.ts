// Simple in-memory cache for improved performance
// In production, use Redis or similar external cache

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    const now = Date.now()
    const isExpired = (now - item.timestamp) > item.ttl

    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    
    for (const [key, item] of Array.from(this.cache.entries())) {
      const isExpired = (now - item.timestamp) > item.ttl
      if (isExpired) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache key generators
export const CacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  menuItems: (universityId: string, date: string) => `menu:${universityId}:${date}`,
  orderStats: (universityId: string) => `stats:orders:${universityId}`,
  universitiesDropdown: () => 'universities:dropdown',
  userSession: (userId: string) => `session:${userId}`
}

// Utility functions for common caching patterns
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 300000
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Store in cache
  cache.set(key, data, ttlMs)
  
  return data
}

// Clean up expired entries every 10 minutes
setInterval(() => {
  cache.cleanup()
}, 600000)

// Client-side cache for reducing API calls
class ClientCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMinutes: number = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    const isExpired = Date.now() - item.timestamp > item.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const clientCache = new ClientCache()

// Cached fetch function
export async function cachedFetch(url: string, options?: RequestInit, cacheMinutes: number = 5): Promise<any> {
  const cacheKey = `fetch_${url}_${JSON.stringify(options || {})}`
  
  // Try to get from cache first
  const cachedData = clientCache.get(cacheKey)
  if (cachedData) {
    console.log(`📦 Cache hit for: ${url}`)
    return cachedData
  }

  // If not in cache, fetch from API
  console.log(`🌐 Fetching from API: ${url}`)
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Store in cache
  clientCache.set(cacheKey, data, cacheMinutes)
  
  return data
} 