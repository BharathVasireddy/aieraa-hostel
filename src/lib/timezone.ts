// Vietnam Timezone Utilities
// Vietnam is UTC+7

/**
 * Get current time in Vietnam timezone
 */
export function getVietnamTime(): Date {
  const now = new Date()
  // Convert to Vietnam time (UTC+7)
  return new Date(now.getTime() + (7 * 60 * 60 * 1000))
}

/**
 * Get Vietnam time from a specific date
 */
export function toVietnamTime(date: Date): Date {
  return new Date(date.getTime() + (7 * 60 * 60 * 1000))
}

/**
 * Get greeting based on Vietnam time
 */
export function getVietnamGreeting(): string {
  const vietnamTime = getVietnamTime()
  const hours = vietnamTime.getHours()
  
  if (hours < 12) {
    return 'Morning'
  } else if (hours < 17) {
    return 'Afternoon'  
  } else {
    return 'Evening'
  }
}

/**
 * Get cutoff time for a specific order date (10 PM Vietnam time the day before)
 */
export function getOrderCutoffTime(orderDate: string): Date {
  const selectedDate = new Date(orderDate)
  // Get the day before the selected date
  const dayBefore = new Date(selectedDate.getTime() - (24 * 60 * 60 * 1000))
  
  // Set cutoff to 10 PM Vietnam time on the day before
  const cutoff = new Date(dayBefore)
  cutoff.setHours(22, 0, 0, 0) // 10 PM cutoff
  
  return cutoff
}

/**
 * Check if current Vietnam time is past the ordering cutoff for a specific date
 */
export function isPastOrderingCutoff(orderDate: string): boolean {
  const vietnamTime = getVietnamTime()
  const cutoff = getOrderCutoffTime(orderDate)
  return vietnamTime >= cutoff
}

/**
 * Get countdown to ordering cutoff for a specific date
 */
export function getOrderingCountdown(orderDate: string): { hours: number; minutes: number; isPastCutoff: boolean } {
  const vietnamTime = getVietnamTime()
  const cutoff = getOrderCutoffTime(orderDate)
  
  if (vietnamTime >= cutoff) {
    return { hours: 0, minutes: 0, isPastCutoff: true }
  }
  
  const diff = cutoff.getTime() - vietnamTime.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { hours, minutes, isPastCutoff: false }
}

/**
 * Legacy function for backward compatibility - get cutoff for tomorrow's orders
 */
export function getTomorrowOrderCutoff(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDateString = tomorrow.toISOString().split('T')[0]
  return getOrderCutoffTime(tomorrowDateString)
}

/**
 * Format Vietnam time for display
 */
export function formatVietnamTime(date?: Date): string {
  const vietnamTime = date ? toVietnamTime(date) : getVietnamTime()
  return vietnamTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format Vietnam date for display
 */
export function formatVietnamDate(date?: Date): string {
  const vietnamTime = date ? toVietnamTime(date) : getVietnamTime()
  return vietnamTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
} 