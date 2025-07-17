'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

interface SessionWrapperProps {
  children: ReactNode
}

export default function SessionWrapper({ children }: SessionWrapperProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
} 