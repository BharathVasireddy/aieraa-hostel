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