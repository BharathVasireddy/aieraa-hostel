import { useState, useEffect, useCallback, useRef } from 'react';

interface ProgressiveLoadingOptions {
  immediate?: boolean; // Whether to start loading immediately
  retryCount?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in ms
}

interface ProgressiveLoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

/**
 * Progressive loading hook for instant UI with background data fetching
 * Follows the "show-then-load" pattern used by modern web apps
 */
export function useProgressiveLoading<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: ProgressiveLoadingOptions = {}
): ProgressiveLoadingState<T> & {
  refetch: () => Promise<void>;
  reset: () => void;
} {
  const { immediate = true, retryCount = 2, retryDelay = 1000 } = options;

  const [state, setState] = useState<ProgressiveLoadingState<T>>({
    data: null,
    loading: immediate,
    error: null,
    loaded: false,
  });

  const attemptCountRef = useRef(0);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (isRetry = false) => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      if (!isRetry) {
        attemptCountRef.current = 0;
        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
        }));
      }

      try {
        const result = await fetchFn();

        // Only update state if component is still mounted
        if (mountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            loaded: true,
          });
        }
      } catch (error: any) {
        // Don't handle aborted requests as errors
        if (error.name === 'AbortError') {
          return;
        }

        attemptCountRef.current++;

        // Only update state if component is still mounted
        if (!mountedRef.current) return;

        // Retry logic
        if (attemptCountRef.current <= retryCount) {
          console.warn(
            `Progressive loading attempt ${attemptCountRef.current} failed, retrying...`,
            error
          );

          setTimeout(() => {
            if (mountedRef.current) {
              fetchData(true);
            }
          }, retryDelay * attemptCountRef.current); // Exponential backoff
        } else {
          // All retries exhausted
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Failed to load data',
            loaded: false,
          }));
        }
      }
    },
    [fetchFn, retryCount, retryDelay]
  );

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: null,
      loading: false,
      error: null,
      loaded: false,
    });
    attemptCountRef.current = 0;
  }, []);

  // Effect for dependency-based loading
  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      // Cleanup on unmount or dependency change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    refetch,
    reset,
  };
}

/**
 * Hook for loading multiple data sources progressively
 * Each data source loads independently, allowing partial content to show
 */
export function useProgressiveMultiLoading<T extends Record<string, any>>(
  loaders: {
    [K in keyof T]: () => Promise<T[K]>;
  },
  options: ProgressiveLoadingOptions = {}
): {
  [K in keyof T]: ProgressiveLoadingState<T[K]>;
} & {
  refetchAll: () => Promise<void>;
  resetAll: () => void;
  isAnyLoading: boolean;
  hasAnyErrors: boolean;
  allLoaded: boolean;
} {
  const loaderKeys = Object.keys(loaders) as (keyof T)[];

  // Create individual loading states for each loader
  const loadingStates = {} as {
    [K in keyof T]: ProgressiveLoadingState<T[K]> & {
      refetch: () => Promise<void>;
      reset: () => void;
    };
  };

  loaderKeys.forEach(key => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    loadingStates[key] = useProgressiveLoading(loaders[key], [], options);
  });

  const refetchAll = useCallback(async () => {
    await Promise.all(loaderKeys.map(key => loadingStates[key].refetch()));
  }, [loadingStates, loaderKeys]);

  const resetAll = useCallback(() => {
    loaderKeys.forEach(key => loadingStates[key].reset());
  }, [loadingStates, loaderKeys]);

  // Computed states
  const isAnyLoading = loaderKeys.some(key => loadingStates[key].loading);
  const hasAnyErrors = loaderKeys.some(
    key => loadingStates[key].error !== null
  );
  const allLoaded = loaderKeys.every(key => loadingStates[key].loaded);

  // Return individual states plus computed states
  const result = {} as any;
  loaderKeys.forEach(key => {
    result[key] = {
      data: loadingStates[key].data,
      loading: loadingStates[key].loading,
      error: loadingStates[key].error,
      loaded: loadingStates[key].loaded,
    };
  });

  return {
    ...result,
    refetchAll,
    resetAll,
    isAnyLoading,
    hasAnyErrors,
    allLoaded,
  };
}
