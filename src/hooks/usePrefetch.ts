import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface PrefetchOptions {
  delay?: number // Delay before prefetching (ms)
  priority?: 'low' | 'high' // Priority level
  condition?: () => boolean // Condition to check before prefetching
}

/**
 * Hook for prefetching data and routes before user navigation
 * This makes the app feel instant by loading content in advance
 */
export function usePrefetch() {
  const router = useRouter()
  const prefetchedUrls = useRef<Set<string>>(new Set())
  const prefetchedData = useRef<Map<string, any>>(new Map())

  // Prefetch a route
  const prefetchRoute = useCallback((href: string, options: PrefetchOptions = {}) => {
    const { delay = 0, condition = () => true } = options
    
    if (!condition() || prefetchedUrls.current.has(href)) {
      return
    }

    const prefetch = () => {
      try {
        router.prefetch(href)
        prefetchedUrls.current.add(href)
        console.log(`🚀 Prefetched route: ${href}`)
      } catch (error) {
        console.warn(`Failed to prefetch route: ${href}`, error)
      }
    }

    if (delay > 0) {
      setTimeout(prefetch, delay)
    } else {
      prefetch()
    }
  }, [router])

  // Prefetch API data
  const prefetchData = useCallback(async (
    url: string, 
    options: PrefetchOptions & { transform?: (data: any) => any } = {}
  ) => {
    const { delay = 0, condition = () => true, transform } = options
    
    if (!condition() || prefetchedData.current.has(url)) {
      return
    }

    const prefetch = async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (response.ok) {
          let data = await response.json()
          if (transform) {
            data = transform(data)
          }
          prefetchedData.current.set(url, data)
          console.log(`🚀 Prefetched data: ${url}`)
        }
      } catch (error) {
        console.warn(`Failed to prefetch data: ${url}`, error)
      }
    }

    if (delay > 0) {
      setTimeout(prefetch, delay)
    } else {
      await prefetch()
    }
  }, [])

  // Get prefetched data
  const getPrefetchedData = useCallback((url: string) => {
    return prefetchedData.current.get(url)
  }, [])

  // Clear prefetched data
  const clearPrefetchedData = useCallback((url?: string) => {
    if (url) {
      prefetchedData.current.delete(url)
    } else {
      prefetchedData.current.clear()
    }
  }, [])

  // Prefetch on hover (for links)
  const prefetchOnHover = useCallback((href: string, options: PrefetchOptions = {}) => {
    return {
      onMouseEnter: () => prefetchRoute(href, options),
      onTouchStart: () => prefetchRoute(href, options), // For mobile
    }
  }, [prefetchRoute])

  // Prefetch on intersection (for elements coming into view)
  const prefetchOnIntersection = useCallback((
    urls: string[], 
    options: PrefetchOptions & { rootMargin?: string } = {}
  ) => {
    const { rootMargin = '50px', condition = () => true } = options
    
    useEffect(() => {
      if (!condition()) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = parseInt(entry.target.getAttribute('data-prefetch-index') || '0')
              const url = urls[index]
              if (url) {
                if (url.startsWith('/')) {
                  prefetchRoute(url, options)
                } else {
                  prefetchData(url, options)
                }
              }
            }
          })
        },
        { rootMargin }
      )

      // Create invisible elements to track
      urls.forEach((url, index) => {
        const element = document.createElement('div')
        element.setAttribute('data-prefetch-index', index.toString())
        element.style.height = '1px'
        element.style.visibility = 'hidden'
        document.body.appendChild(element)
        observer.observe(element)
      })

      return () => {
        observer.disconnect()
        // Clean up elements
        document.querySelectorAll('[data-prefetch-index]').forEach(el => el.remove())
      }
    }, [urls, condition, rootMargin])
  }, [prefetchRoute, prefetchData])

  return {
    prefetchRoute,
    prefetchData,
    getPrefetchedData,
    clearPrefetchedData,
    prefetchOnHover,
    prefetchOnIntersection
  }
}

/**
 * Hook for intelligent prefetching based on user behavior patterns
 */
export function useSmartPrefetch() {
  const { prefetchRoute, prefetchData } = usePrefetch()
  const userBehavior = useRef({
    visitedPages: new Set<string>(),
    timeOnPage: new Map<string, number>(),
    clickPatterns: new Map<string, number>(),
  })

  // Track page visits
  const trackPageVisit = useCallback((page: string) => {
    userBehavior.current.visitedPages.add(page)
    userBehavior.current.timeOnPage.set(page, Date.now())
  }, [])

  // Track click patterns
  const trackClick = useCallback((target: string) => {
    const current = userBehavior.current.clickPatterns.get(target) || 0
    userBehavior.current.clickPatterns.set(target, current + 1)
  }, [])

  // Predict next likely page based on patterns
  const predictNextPage = useCallback(() => {
    const patterns = userBehavior.current.clickPatterns
    const sorted = Array.from(patterns.entries()).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] // Most clicked target
  }, [])

  // Smart prefetch based on user behavior
  const smartPrefetch = useCallback(() => {
    const nextPage = predictNextPage()
    if (nextPage && nextPage.startsWith('/')) {
      prefetchRoute(nextPage, { delay: 1000, priority: 'low' })
    }
  }, [predictNextPage, prefetchRoute])

  // Prefetch common user flows
  const prefetchUserFlow = useCallback((flow: string[]) => {
    flow.forEach((step, index) => {
      const delay = (index + 1) * 500 // Stagger prefetching
      if (step.startsWith('/')) {
        prefetchRoute(step, { delay, priority: 'low' })
      } else {
        prefetchData(step, { delay, priority: 'low' })
      }
    })
  }, [prefetchRoute, prefetchData])

  return {
    trackPageVisit,
    trackClick,
    smartPrefetch,
    prefetchUserFlow,
    predictNextPage
  }
}

/**
 * Common prefetch strategies for the hostel app
 */
export function useHostelPrefetch() {
  const { prefetchRoute, prefetchData } = usePrefetch()
  const { prefetchUserFlow } = useSmartPrefetch()

  // Prefetch student flow
  const prefetchStudentFlow = useCallback(() => {
    prefetchUserFlow([
      '/student/menu',
      '/student/orders',
      '/student/checkout',
      '/api/student/popular-dishes',
      '/api/student/todays-specials'
    ])
  }, [prefetchUserFlow])

  // Prefetch admin flow
  const prefetchAdminFlow = useCallback(() => {
    prefetchUserFlow([
      '/admin/orders',
      '/admin/menu',
      '/admin/users',
      '/api/admin/analytics'
    ])
  }, [prefetchUserFlow])

  // Prefetch based on user role
  const prefetchByRole = useCallback((role: string) => {
    switch (role) {
      case 'STUDENT':
        prefetchStudentFlow()
        break
      case 'ADMIN':
      case 'MANAGER':
        prefetchAdminFlow()
        break
    }
  }, [prefetchStudentFlow, prefetchAdminFlow])

  // Prefetch menu data for tomorrow (common pattern)
  const prefetchTomorrowMenu = useCallback((universityId: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    
    prefetchData(`/api/menu?universityId=${universityId}&date=${dateStr}`, {
      delay: 2000, // Wait 2 seconds before prefetching
      priority: 'low'
    })
  }, [prefetchData])

  return {
    prefetchStudentFlow,
    prefetchAdminFlow,
    prefetchByRole,
    prefetchTomorrowMenu
  }
} 