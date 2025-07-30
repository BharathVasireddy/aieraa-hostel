'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render during SSR
  if (!isMounted) {
    return <div className="w-full min-h-full">{children}</div>
  }

  // Simple instant render without animations
  return (
    <div key={pathname} className="w-full min-h-full">
      {children}
    </div>
  )
}

// Simple loading component without animations
export function LoadingTransition({ isLoading, children }: { isLoading: boolean, children: React.ReactNode }) {
  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </>
  )
}

// Simple button without animations - just CSS active state
export function ButtonPress({ children, className, ...props }: any) {
  return (
    <button
      className={`${className} active:scale-95 transition-transform duration-75`}
      {...props}
    >
      {children}
    </button>
  )
}

// Simple modal without complex animations
export function SlideUpModal({ isOpen, children, onClose }: { 
  isOpen: boolean, 
  children: React.ReactNode,
  onClose: () => void 
}) {
  if (!isOpen) {return null}

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 max-h-96 overflow-hidden transform transition-transform duration-300 translate-y-0">
        {children}
      </div>
    </>
  )
} 