'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, User, ChevronDown } from 'lucide-react'
import { format, addDays, startOfToday } from 'date-fns'
import { getOrderingCountdown } from '@/lib/timezone'

interface StudentHeaderProps {
  selectedDate: string
  onDateChange: (date: string) => void
  showDatePicker?: boolean
  user: {
    name: string
    roomNumber: string
    university: string
  }
}

export default function StudentHeader({ 
  selectedDate, 
  onDateChange, 
  showDatePicker = true,
  user
}: StudentHeaderProps) {
  const router = useRouter()
  const [showDatePickerDropdown, setShowDatePickerDropdown] = useState(false)

  // Generate next 7 days for date selection (starting from tomorrow)
  const availableDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfToday(), i + 1) // Start from tomorrow
      return {
        date: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE, MMM dd'),
        dayName: format(date, 'EEEE'),
        shortDay: format(date, 'EEE'),
        day: format(date, 'dd'),
        month: format(date, 'MMM'),
        isTomorrow: i === 0
      }
    })
  }, [])

  const selectedDateObj = useMemo(() => 
    availableDates.find(d => d.date === selectedDate), 
    [availableDates, selectedDate]
  )

  // Calculate countdown for selected date
  const countdown = useMemo(() => {
    return getOrderingCountdown(selectedDate)
  }, [selectedDate])

  // Get compact countdown text
  const countdownText = useMemo(() => {
    if (countdown.isPastCutoff) {
      return 'Ordering closed'
    } else {
      return `${countdown.hours}h ${countdown.minutes}m left`
    }
  }, [countdown])

  // Handle date selection with validation
  const handleDateSelection = useCallback((dateString: string) => {
    const selectedDate = new Date(dateString)
    const tomorrow = addDays(startOfToday(), 1)
    
    // Ensure selected date is not in the past
    if (selectedDate >= tomorrow) {
      onDateChange(dateString)
      setShowDatePickerDropdown(false)
    }
  }, [onDateChange])

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: University Info */}
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{user.university}</h1>
              <p className="text-xs text-gray-600">Room {user.roomNumber}</p>
            </div>
          </div>

          {/* Center-Right: Date Selection & Profile */}
          <div className="flex items-center space-x-3">
            {showDatePicker && (
              <div className="relative">
                <button
                  onClick={() => setShowDatePickerDropdown(!showDatePickerDropdown)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all duration-200 shadow-sm active:scale-95"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-green-200">
                      <Calendar className="w-3 h-3 text-green-700" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium text-green-900">
                        {selectedDateObj?.shortDay}, {selectedDateObj?.day}
                      </div>
                      <div className={`text-xs ${countdown.isPastCutoff ? 'text-red-600' : 'text-green-600'}`}>
                        {countdownText}
                      </div>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-green-600 transition-transform duration-200 ${showDatePickerDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Date Picker Dropdown */}
                {showDatePickerDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                      <h3 className="text-sm font-semibold text-green-900">Select Meal Date</h3>
                      <p className="text-xs text-green-700">Choose when you&apos;d like to collect your hostel meal</p>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {availableDates.map((dateOption) => (
                        <button
                          key={dateOption.date}
                          onClick={() => handleDateSelection(dateOption.date)}
                          className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all duration-200 hover:bg-gray-50 active:scale-98 ${
                            selectedDate === dateOption.date
                              ? 'bg-green-50 border border-green-200 text-green-900'
                              : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs transition-colors duration-200 ${
                                selectedDate === dateOption.date
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <span className="font-bold">{dateOption.day}</span>
                                <span className="text-xs">{dateOption.shortDay}</span>
                              </div>
                              <div>
                                <div className="font-medium">{dateOption.dayName}</div>
                                <div className="text-xs text-gray-500">{dateOption.month} {dateOption.day}</div>
                              </div>
                            </div>
                            {dateOption.isTomorrow && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Tomorrow</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Icon */}
            <button 
              onClick={() => router.push('/student/profile')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200 active:scale-95"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Click outside overlay to close date picker */}
      {showDatePickerDropdown && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-10" 
          onClick={() => setShowDatePickerDropdown(false)}
        ></div>
      )}
    </>
  )
} 