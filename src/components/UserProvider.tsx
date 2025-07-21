'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { User, University, UniversitySettings } from '@prisma/client';

// Custom type that includes university relationship
interface UserWithUniversity extends User {
  university?:
    | (University & {
        settings?: UniversitySettings | null;
      })
    | null;
}

interface UserContextType {
  user: UserWithUniversity | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCacheAndRefetch: () => Promise<void>;
  isMounted: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserWithUniversity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(
    null
  );

  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoize session user info to prevent unnecessary re-renders
  const sessionUserInfo = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
      name: session.user.name,
      universityId: session.user.universityId,
    };
  }, [
    session?.user?.id,
    session?.user?.role,
    session?.user?.email,
    session?.user?.name,
    session?.user?.universityId,
  ]);

  const fetchUserData = useCallback(async () => {
    if (!sessionUserInfo?.id) {
      setUser(null);
      setLoading(false);
      setError(null);
      setLastFetchedUserId(null);
      return;
    }

    // Prevent refetching the same user data
    if (
      lastFetchedUserId === sessionUserInfo.id &&
      user?.id === sessionUserInfo.id
    ) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/${sessionUserInfo.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        // Prevent aggressive caching that might cause issues
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          await signOut({ callbackUrl: '/auth/signin' });
          return;
        } else if (response.status === 403) {
          setError('Access denied. Please contact support.');
          return;
        } else if (response.status === 404) {
          setError('User account not found. Please login again.');
          await signOut({ callbackUrl: '/auth/signin' });
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        setLastFetchedUserId(sessionUserInfo.id);
        setError(null);
      } else {
        throw new Error('User data not found in response');
      }
    } catch (err: any) {
      console.error('UserProvider fetch error:', err);
      setError('Unable to load user data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [sessionUserInfo?.id, user?.id, lastFetchedUserId]);

  // Main effect to handle session changes - optimized to reduce unnecessary calls
  useEffect(() => {
    if (!isMounted) return;

    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setUser(null);
      setLoading(false);
      setError(null);
      setLastFetchedUserId(null);
      return;
    }

    if (status === 'authenticated' && sessionUserInfo?.id) {
      // Only fetch if we don't have user data or if the user ID changed
      if (
        !user ||
        user.id !== sessionUserInfo.id ||
        lastFetchedUserId !== sessionUserInfo.id
      ) {
        // Check if session has required data
        if (!sessionUserInfo.role) {
          setError('Loading user session...');
          setLoading(true);

          // Wait a bit for session to be fully loaded
          const timer = setTimeout(() => {
            if (sessionUserInfo?.role) {
              fetchUserData();
            } else {
              setError('Session incomplete. Please try logging in again.');
              setLoading(false);
            }
          }, 2000);

          return () => clearTimeout(timer);
        }

        fetchUserData();
      } else {
        // User data already matches session, just ensure loading is false
        setLoading(false);
        setError(null);
      }
    }
  }, [
    sessionUserInfo,
    status,
    isMounted,
    user?.id,
    lastFetchedUserId,
    fetchUserData,
  ]);

  const clearCacheAndRefetch = useCallback(async () => {
    // Reset state and force refetch
    setUser(null);
    setError(null);
    setLastFetchedUserId(null);
    await fetchUserData();
  }, [fetchUserData]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      loading: loading || status === 'loading' || !isMounted,
      error,
      refetch: fetchUserData,
      clearCacheAndRefetch,
      isMounted,
    }),
    [
      user,
      loading,
      status,
      isMounted,
      error,
      fetchUserData,
      clearCacheAndRefetch,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
