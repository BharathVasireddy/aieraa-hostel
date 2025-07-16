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
    SessionRecovery.useAutoRecovery()
  }, [])

  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null)
      setLoading(false)
      setError(null)
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
        console.log('⚡ INSTANT user data from cache')
        setUser(cachedUser)
        setLoading(false)
        setHasTriedFetch(true)
        return
      }
      
      // Use lightning fetch with 30 minute cache for user data
      const data = await lightningFetch(`/api/user/${session.user.id}`, {}, 30)
      
      if (data.user) {
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
      
      // Handle specific error cases
      if (err.message?.includes('404')) {
        console.warn('User not found in database')
        setError('User account not found. Please login again.')
        // Don't automatically sign out on first 404, give user a chance to retry
        if (retryCount > 1) {
          await SessionRecovery.forceLogout()
        }
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        console.warn('Unauthorized access, forcing logout')
        setError('Session expired. Please login again.')
        await SessionRecovery.forceLogout()
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

  const value = {
    user,
    loading: loading || status === 'loading' || !isMounted,
    error,
    refetch: fetchUserData,
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