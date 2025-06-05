'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, University, UniversitySettings } from '@/generated/prisma'
import { cachedFetch, clientCache } from '@/lib/cache'

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
  const [fetchAttempted, setFetchAttempted] = useState(false)

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

    // Prevent multiple simultaneous fetches
    if (fetchAttempted && loading) {
      return
    }

    try {
      setFetchAttempted(true)
      setLoading(true)
      setError(null)
      
      // Use cached fetch with 10 minute cache for user data
      const data = await cachedFetch(`/api/user/${session.user.id}`, {}, 10)
      
      if (data.user) {
        setUser(data.user)
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
      setFetchAttempted(false)
    }
  }, [session?.user?.id, fetchAttempted, loading])

  useEffect(() => {
    if (!isMounted || status === 'loading') return
    
    if (status === 'authenticated' && session?.user?.id) {
      // Only fetch if we don't have user data or session changed
      if (!user || user.id !== session.user.id) {
        fetchUserData()
      } else {
        setLoading(false)
      }
    } else if (status === 'unauthenticated') {
      setUser(null)
      setLoading(false)
      // Clear cache when user logs out
      clientCache.clear()
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