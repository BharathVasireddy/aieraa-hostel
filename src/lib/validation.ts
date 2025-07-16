import { OrderStatus } from '@/generated/prisma'

// Valid OrderStatus enum values
export const VALID_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'APPROVED', 
  'PREPARING',
  'READY',
  'SERVED',
  'REJECTED',
  'CANCELLED'
]

/**
 * Validates if a string is a valid OrderStatus
 * @param status - The status string to validate
 * @returns boolean indicating if the status is valid
 */
export function isValidOrderStatus(status: string): status is OrderStatus {
  return VALID_ORDER_STATUSES.includes(status.toUpperCase() as OrderStatus)
}

/**
 * Safely converts a string to OrderStatus if valid
 * @param status - The status string to convert
 * @returns OrderStatus if valid, undefined otherwise
 */
export function toOrderStatus(status: string | null): OrderStatus | undefined {
  if (!status) return undefined
  
  const upperStatus = status.toUpperCase()
  return isValidOrderStatus(upperStatus) ? upperStatus as OrderStatus : undefined
}

/**
 * Gets all valid OrderStatus values as strings
 * @returns Array of valid OrderStatus strings
 */
export function getValidOrderStatuses(): string[] {
  return VALID_ORDER_STATUSES
}

// Input validation and sanitization utilities

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000) // Limit length
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): { isValid: boolean; sanitized: string } {
  const sanitized = sanitizeString(email).toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return {
    isValid: emailRegex.test(sanitized) && sanitized.length <= 254,
    sanitized
  }
}

/**
 * Validate phone number (Indian/Vietnamese)
 */
export function validatePhone(phone: string): { isValid: boolean; sanitized: string } {
  const sanitized = phone.replace(/\D/g, '') // Remove non-digits
  const phonePattern = /^(\+?91|0)?[6-9]\d{9}$|^(\+?84|0)?[1-9]\d{8}$/
  
  return {
    isValid: phonePattern.test(sanitized),
    sanitized
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  
  if (password.length > 128) {
    errors.push('Password is too long')
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  const num = parseFloat(input)
  
  if (isNaN(num)) return min
  
  return Math.max(min, Math.min(max, num))
}

/**
 * Rate limiting store (in-memory - use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiting
 */
export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remainingRequests: number } {
  const now = Date.now()
  const key = identifier
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remainingRequests: maxRequests - 1 }
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remainingRequests: 0 }
  }
  
  entry.count++
  return { allowed: true, remainingRequests: maxRequests - entry.count }
}

/**
 * Clean up expired rate limit entries
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute 