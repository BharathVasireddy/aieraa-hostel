'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

// Native-style transitions with subtle animations
const getNativeTransition = (pathname: string) => {
  // Use subtle fade and scale for all pages - feels native
  return { 
    initial: { opacity: 0, scale: 0.98 }, 
    exit: { opacity: 0, scale: 1.02 } 
  }
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

  const transition = getNativeTransition(pathname)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={transition.initial}
        animate={{ 
          opacity: 1,
          scale: 1
        }}
        exit={transition.exit}
        transition={{
          type: "tween",
          ease: [0.4, 0.0, 0.2, 1], // Material Design easing - feels native
          duration: 0.15 // Quick and snappy like native apps
        }}
        className="w-full min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Loading transition for async operations - more subtle
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
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.2,
            ease: [0.4, 0.0, 0.2, 1]
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Native button press animation - iOS/Android style
export function ButtonPress({ children, className, ...props }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }} // Subtle press down
      transition={{ type: "tween", duration: 0.1 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Native modal transition - bottom sheet style
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ 
              type: "tween", 
              ease: [0.4, 0.0, 0.2, 1],
              duration: 0.3 
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 max-h-96 overflow-hidden"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 