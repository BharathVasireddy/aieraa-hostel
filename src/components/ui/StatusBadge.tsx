import React from 'react'

export interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

const statusVariants = {
  // Order statuses
  PENDING: 'warning',
  APPROVED: 'info',
  PREPARING: 'info', 
  READY: 'success',
  SERVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  
  // Payment statuses
  PAID: 'success',
  FAILED: 'danger',
  REFUNDED: 'warning',
  
  // User statuses
  ACTIVE: 'success',
  INACTIVE: 'danger',
  SUSPENDED: 'warning',
  
  // User roles
  ADMIN: 'info',
  MANAGER: 'success',
  STUDENT: 'default',
  CATERER: 'warning'
} as const

const variantStyles = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-orange-100 text-orange-800 border-orange-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200'
} as const

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm'
} as const

export default function StatusBadge({ 
  status, 
  variant, 
  size = 'sm' 
}: StatusBadgeProps) {
  // Auto-determine variant based on status if not provided
  const finalVariant = variant || statusVariants[status as keyof typeof statusVariants] || 'default'
  
  // Format status text
  const displayText = status
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variantStyles[finalVariant]}
        ${sizeStyles[size]}
      `}
    >
      {displayText}
    </span>
  )
}

// Helper function to get status variant for custom logic
export function getStatusVariant(status: string): StatusBadgeProps['variant'] {
  return statusVariants[status as keyof typeof statusVariants] || 'default'
} 