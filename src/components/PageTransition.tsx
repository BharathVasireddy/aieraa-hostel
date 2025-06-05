'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

// Define slide directions based on routes
const getSlideDirection = (pathname: string) => {
  // Landing to auth pages - slide left
  if (pathname.startsWith('/auth/')) {
    return { initial: { x: '100%' }, exit: { x: '-100%' } }
  }
  
  // Auth pages to main app - slide left  
  if (pathname.startsWith('/student') || pathname.startsWith('/admin')) {
    return { initial: { x: '100%' }, exit: { x: '-100%' } }
  }
  
  // Default - fade transition
  return { initial: { opacity: 0 }, exit: { opacity: 0 } }
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render animations during SSR
  if (!isMounted) {
    return <div className="w-full min-h-full">{children}</div>
  }

  const slideDirection = getSlideDirection(pathname)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={slideDirection.initial}
        animate={{ 
          x: 0, 
          opacity: 1,
          scale: 1
        }}
        exit={slideDirection.exit}
        transition={{
          type: "tween",
          ease: [0.22, 1, 0.36, 1], // Custom easing for app-like feel
          duration: 0.4
        }}
        className="w-full min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Loading transition for async operations
export function LoadingTransition({ isLoading, children }: { isLoading: boolean, children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center min-h-screen"
        >
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Button press animation
export function ButtonPress({ children, className, ...props }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Modal/Sheet transition
export function SlideUpModal({ isOpen, children, onClose }: { 
  isOpen: boolean, 
  children: React.ReactNode,
  onClose: () => void 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 max-h-96 overflow-hidden"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 