'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, University, UniversitySettings } from '@/generated/prisma'
import { lightningFetch, lightningCache } from '@/lib/cache'

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

  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null)
      setLoading(false)
      return
    }

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
        return
      }
      
      // Use lightning fetch with 30 minute cache for user data
      const data = await lightningFetch(`/api/user/${session.user.id}`, {}, 30)
      
      if (data.user) {
        setUser(data.user)
        // Store in instant cache for immediate future access
        lightningCache.setInstant(cacheKey, data.user)
      } else {
        throw new Error('User data not found in response')
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      
      // Handle specific error cases
      if (err.message?.includes('404')) {
        console.warn('User not found in database, forcing logout')
        setError('User account not found. Please login again.')
        await signOut({ 
          callbackUrl: '/auth/signin',
          redirect: true 
        })
      } else if (err.message?.includes('401')) {
        console.warn('Unauthorized access, forcing logout')
        await signOut({ 
          callbackUrl: '/auth/signin',
          redirect: true 
        })
      } else {
        setError('Failed to fetch user data')
      }
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

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
      } else if (!user || user.id !== session.user.id) {
        fetchUserData()
      } else {
        setLoading(false)
      }
    } else if (status === 'unauthenticated') {
      setUser(null)
      setLoading(false)
      // Clear cache when user logs out
      lightningCache.clear()
    }
  }, [session, status, isMounted, user, fetchUserData])

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