'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import type { User, University, UniversitySettings } from '@/generated/prisma'

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

  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/user/${session.user.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.')
          await signOut({ callbackUrl: '/auth/signin' })
          return
        } else if (response.status === 403) {
          setError('Access denied. Please contact support.')
          return
        } else if (response.status === 404) {
          setError('User account not found. Please login again.')
          await signOut({ callbackUrl: '/auth/signin' })
          return
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
      
      const data = await response.json()
      
      if (data.user) {
        setUser(data.user)
        setError(null)
      } else {
        throw new Error('User data not found in response')
      }
    } catch (err: any) {
      setError('Unable to load user data. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Main effect to handle session changes
  useEffect(() => {
    if (!isMounted) return

    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (status === 'unauthenticated') {
      setUser(null)
      setLoading(false)
      setError(null)
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      // Check if session has required data
      if (!session.user.role) {
        setError('Loading user session...')
        setLoading(true)
        
        // Wait a bit for session to be fully loaded
        const timer = setTimeout(() => {
          if (session?.user?.role) {
            fetchUserData()
          } else {
            setError('Session incomplete. Please try logging in again.')
            setLoading(false)
          }
        }, 2000)
        
        return () => clearTimeout(timer)
      }
      
      fetchUserData()
    }
  }, [session, status, isMounted, fetchUserData])

  const clearCacheAndRefetch = useCallback(async () => {
    // Cache disabled - just refetch user data
    setUser(null)
    setError(null)
    await fetchUserData()
  }, [fetchUserData])

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