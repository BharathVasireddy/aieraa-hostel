// CACHING DISABLED - All cache operations are now no-ops

// Types
export interface CacheOptions {
  duration?: number; // minutes (ignored)
  force?: boolean;
  tags?: string[];
}

// Disabled cache class - all operations are no-ops
class DisabledCache {
  private cache = new Map<string, { data: unknown; expires: number }>();

  set<T>(_key: string, _data: T, _ttlMinutes: number = 5): void {
    // Cache disabled - no-op
  }

  get<T>(_key: string): T | null {
    // Cache disabled - always return null
    return null;
  }

  delete(_key: string): void {
    // Cache disabled - no-op
  }

  clear(): void {
    // Cache disabled - no-op
  }

  // Get cache size for debugging
  size(): number {
    return 0; // Always return 0 as cache is disabled
  }
}

// Global cache instance (disabled)
export const cache = new DisabledCache();

// Fetch without caching - always fresh data
export async function cachedFetch(
  url: string,
  options: RequestInit = {}
): Promise<unknown> {
  // No caching, no deduplication - always fresh fetch
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
    cache: 'no-store', // Disable browser caching
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

// Disabled server cache - returns function without caching
export const serverCache = (
  fn: Function,
  _keys: string[],
  _options: { revalidate?: number; tags?: string[] } = {}
) => {
  // No caching - return original function
  return fn;
};

// Disabled cache invalidation
export const invalidateCache = (_pattern: string) => {
  // Cache disabled - no-op
};

// Disabled cache clearing
export const clearAllCache = () => {
  // Cache disabled - no-op
};
