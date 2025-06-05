'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, University, UniversitySettings } from '@/generated/prisma'

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

  const fetchUserData = async () => {
    if (!session?.user?.id) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/user/${session.user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
      } else if (response.status === 404) {
        // User not found in database - force logout
        console.warn('User not found in database, forcing logout')
        setError('User account not found. Please login again.')
        // Use NextAuth signOut instead of localStorage
        await signOut({ 
          callbackUrl: '/auth/signin',
          redirect: true 
        })
      } else {
        setError(data.error || 'Failed to fetch user data')
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError('Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isMounted || status === 'loading') return
    
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserData()
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [session, status, isMounted])

  const value = {
    user,
    loading: loading || status === 'loading' || !isMounted,
    error,
    refetch: fetchUserData,
    isMounted
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 