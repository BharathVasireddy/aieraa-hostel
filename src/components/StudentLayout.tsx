'use client'

import { useEffect, useState } from 'react'
import { format, addDays, startOfToday } from 'date-fns'
import StudentHeader from './StudentHeader'
import BottomNavigation from './BottomNavigation'
import { useUser } from './UserProvider'

interface StudentLayoutProps {
  children: React.ReactNode
  showDatePicker?: boolean
  className?: string
}

export default function StudentLayout({ 
  children, 
  showDatePicker = true,
  className = '' 
}: StudentLayoutProps) {
  const { user, loading, isMounted } = useUser()
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to tomorrow without localStorage access during SSR
    const tomorrow = addDays(startOfToday(), 1)
    return format(tomorrow, 'yyyy-MM-dd')
  })

  // Load from localStorage only after component mounts (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedOrderDate')
      if (saved) {
        // Validate saved date is not in the past
        const savedDate = new Date(saved)
        const tomorrow = addDays(startOfToday(), 1)
        if (savedDate >= tomorrow) {
          setSelectedDate(saved)
        }
      }
    }
  }, [])

  // Persist date selection to localStorage and dispatch custom event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedOrderDate', selectedDate)
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('dateChanged', { 
        detail: { date: selectedDate } 
      }))
    }
  }, [selectedDate])

  // Show loading state while user data is being fetched or during SSR
  if (loading || !isMounted) {
    return (
      <div className={`min-h-screen bg-white ${className}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if user data is not available
  if (!user) {
    return (
      <div className={`min-h-screen bg-white ${className}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">Unable to load user data</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* Common Header */}
      <StudentHeader 
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        showDatePicker={showDatePicker}
        user={{
          name: user.name,
          roomNumber: user.roomNumber || 'N/A',
          university: user.university?.name || 'Unknown University'
        }}
      />

      {/* Page Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation />
      </div>
    </div>
  )
} 