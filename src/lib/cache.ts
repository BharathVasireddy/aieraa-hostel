// CACHING DISABLED - All cache operations are now no-ops
import { unstable_cache as nextCache } from 'next/cache'

// Types
export interface CacheOptions {
  duration?: number // minutes (ignored)
  force?: boolean
  tags?: string[]
}

// Disabled cache class - all operations are no-ops
class DisabledCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    // Cache disabled - no-op
  }

  get<T>(key: string): T | null {
    // Cache disabled - always return null
    return null
  }

  delete(key: string): void {
    // Cache disabled - no-op
  }

  clear(): void {
    // Cache disabled - no-op
  }

  // Get cache size for debugging
  size(): number {
    return 0 // Always return 0 as cache is disabled
  }
}

// Global cache instance (disabled)
export const cache = new DisabledCache()

// Request deduplication disabled
const pendingRequests = new Map<string, Promise<any>>()

// Fetch without caching - always fresh data
export async function cachedFetch(
  url: string,
  options: CacheOptions = {},
  cacheDuration: number = 0 // Ignored - no caching
): Promise<any> {
  // No caching, no deduplication - always fresh fetch
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store', // Disable browser caching
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

    // No caching - return data immediately
    return data
  } catch (error) {
    throw error
  }
}

// Disabled server cache - returns function without caching
export const serverCache = (
  fn: Function,
  keys: string[],
  options: { revalidate?: number; tags?: string[] } = {}
) => {
  // No caching - return original function
  return fn
}

// Disabled cache invalidation
export const invalidateCache = (pattern: string) => {
  // Cache disabled - no-op
}

// Disabled cache clearing
export const clearAllCache = () => {
  // Cache disabled - no-op
} 