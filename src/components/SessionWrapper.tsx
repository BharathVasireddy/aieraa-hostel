'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface SessionWrapperProps {
  children: ReactNode;
}

export default function SessionWrapper({ children }: SessionWrapperProps) {
  return (
    <SessionProvider
      // Reduce session polling to prevent excessive checks
      refetchInterval={5 * 60} // 5 minutes instead of default 1 minute
      refetchOnWindowFocus={false} // Disable refetch on window focus to prevent tab switch issues
      refetchWhenOffline={false} // Disable offline refetching
    >
      {children}
    </SessionProvider>
  );
}
