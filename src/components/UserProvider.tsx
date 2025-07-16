'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, University, UniversitySettings } from '@/generated/prisma'
import { lightningFetch, lightningCache } from '@/lib/cache'
import { SessionRecovery } from '@/lib/session-recovery'

// Custom type that includes university relationship
interface UserWithUniversity extends User {
  university?: University & {
    settings?: UniversitySettings | null
  } | null
}

interface UserContextType {
  user: UserWithUniversity | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCacheAndRefetch: () => Promise<void>
  isMounted: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserWithUniversity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [hasTriedFetch, setHasTriedFetch] = useState(false)

  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
    // Enable auto-recovery for session errors
    SessionRecovery.enableAutoRecovery()
  }, [])

  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null)
      setLoading(false)
      setError(null)
      return
    }

    // Check if session has required role information
    if (!session.user.role) {
      console.warn('⚠️  Session missing user role in fetchUserData, skipping fetch')
      return
    }

    // Skip session validation for now to test authentication flow
    // const isValidSession = await SessionRecovery.validateSession()
    // if (!isValidSession) {
    //   console.log('❌ Session validation failed in UserProvider')
    //   setError('Session expired. Please login again.')
    //   await SessionRecovery.forceLogout()
    //   return
    // }

    try {
      setLoading(true)
      setError(null)
      
      // Check instant cache first
      const cacheKey = `user_${session.user.id}`
      const cachedUser = lightningCache.getInstant<UserWithUniversity>(cacheKey)
      if (cachedUser) {
        console.log('⚡ INSTANT user data from cache:', {
          id: cachedUser.id,
          name: cachedUser.name,
          studentId: cachedUser.studentId,
          roomNumber: cachedUser.roomNumber,
          university: cachedUser.university,
          role: cachedUser.role,
          status: cachedUser.status
        })
        setUser(cachedUser)
        setLoading(false)
        setHasTriedFetch(true)
        return
      }
      
      // Use lightning fetch with 30 minute cache for user data
      const data = await lightningFetch(`/api/user/${session.user.id}`, {}, 30)
      
      console.log('🔍 User data fetched from API:', JSON.stringify(data, null, 2))
      
      if (data.user) {
        console.log('✅ User data structure:', {
          id: data.user.id,
          name: data.user.name,
          studentId: data.user.studentId,
          roomNumber: data.user.roomNumber,
          university: data.user.university,
          role: data.user.role,
          status: data.user.status
        })
        setUser(data.user)
        // Store in instant cache for immediate future access
        lightningCache.setInstant(cacheKey, data.user)
        setError(null)
        setRetryCount(0)
      } else {
        throw new Error('User data not found in response')
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      
      // Temporarily disable session recovery to test authentication flow
      // if (err.message?.includes('JWT') || 
      //     err.message?.includes('session') || 
      //     err.message?.includes('token') ||
      //     err.message?.includes('Unable to determine user role')) {
      //   console.log('🔄 JWT/Session error detected, attempting recovery...')
      //   
      //   const recovered = await SessionRecovery.handleSessionError(err)
      //   if (recovered) {
      //     console.log('✅ Session recovered, retrying user fetch')
      //     // Retry the fetch after successful recovery
      //     setTimeout(() => fetchUserData(), 500)
      //     return
      //   } else {
      //     console.log('❌ Session recovery failed, user will be logged out')
      //     setError('Session expired. Please login again.')
      //     return
      //   }
      // }
      
      // Handle specific error cases with more resilient logic
      if (err.message?.includes('404')) {
        console.warn('User not found in database')
        setError('User account not found. Please login again.')
        // Don't automatically sign out on first 404, give user a chance to retry
        if (retryCount > 2) {
          await SessionRecovery.forceLogout()
        }
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        console.warn('Unauthorized access detected')
        setError('Session expired. Please login again.')
        // Only force logout after multiple attempts to avoid page reload issues
        if (retryCount > 1) {
          await SessionRecovery.forceLogout()
        }
      } else {
        setError('Failed to load your account data. Please try again.')
        setRetryCount(prev => prev + 1)
      }
    } finally {
      setLoading(false)
      setHasTriedFetch(true)
    }
  }, [session?.user?.id, retryCount])

  useEffect(() => {
    if (!isMounted || status === 'loading') return
    
    if (status === 'authenticated' && session?.user?.id) {
      // Check session validity first - be more patient with missing role
      if (!session.user.role) {
        console.warn('⚠️  Session missing user role, waiting for session to be fully loaded...')
        // Don't return immediately, give it more time
        const timer = setTimeout(() => {
          if (session?.user?.role) {
            console.log('✅ Session role loaded after delay')
            // Session is now ready, continue with normal flow
          } else {
            console.warn('⚠️  Session still missing role after timeout')
          }
        }, 2000)
        return () => clearTimeout(timer)
      }
      
      // Check if we have instant cached data first
      const cacheKey = `user_${session.user.id}`
      const cachedUser = lightningCache.getInstant<UserWithUniversity>(cacheKey)
      
      if (cachedUser && (!user || user.id !== session.user.id)) {
        console.log('⚡ Loading user from instant cache')
        setUser(cachedUser)
        setLoading(false)
        setHasTriedFetch(true)
      } else if ((!user || user.id !== session.user.id) && !hasTriedFetch) {
        fetchUserData()
      } else if (hasTriedFetch) {
        setLoading(false)
      }
    } else if (status === 'unauthenticated') {
      setUser(null)
      setLoading(false)
      setError(null)
      setHasTriedFetch(false)
      setRetryCount(0)
      // Clear cache when user logs out
      lightningCache.clear()
    }
  }, [session, status, isMounted, user, fetchUserData, hasTriedFetch])

  // Reset retry count when session changes
  useEffect(() => {
    if (session?.user?.id) {
      setRetryCount(0)
      setHasTriedFetch(false)
    }
  }, [session?.user?.id])

  const clearCacheAndRefetch = useCallback(async () => {
    console.log('🗑️ Clearing cache and refetching user data...')
    lightningCache.clear()
    if (session?.user?.id) {
      const cacheKey = `user_${session.user.id}`
      lightningCache.deleteInstant(cacheKey)
    }
    setUser(null)
    setHasTriedFetch(false)
    await fetchUserData()
  }, [session?.user?.id, fetchUserData])

  const value = {
    user,
    loading: loading || status === 'loading' || !isMounted,
    error,
    refetch: fetchUserData,
    clearCacheAndRefetch,
    isMounted
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 