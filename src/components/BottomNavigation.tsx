'use client'

import { Home, UtensilsCrossed, Clock, Settings, BarChart3, ChefHat, ShoppingBag } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { useSession } from 'next-auth/react'

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleNavigation = useCallback((path: string) => {
    if (pathname !== path) {
      router.push(path)
    }
  }, [router, pathname])

  // Determine user type from session
  const userType = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER' ? 'manager' : 'student'

  const studentNav = [
    { 
      icon: Home, 
      label: 'Home', 
      path: '/student',
      isActive: pathname === '/student'
    },
    { 
      icon: UtensilsCrossed, 
      label: 'Menu', 
      path: '/student/menu',
      isActive: pathname === '/student/menu'
    },
    { 
      icon: Clock, 
      label: 'Orders', 
      path: '/student/orders',
      isActive: pathname === '/student/orders'
    },
    { 
      icon: Settings, 
      label: 'Profile', 
      path: '/student/profile',
      isActive: pathname === '/student/profile'
    }
  ]

  const managerNav = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/admin',
      isActive: pathname === '/admin'
    },
    {
      icon: ShoppingBag,
      label: 'Orders',
      path: '/admin/orders',
      isActive: pathname === '/admin/orders'
    },
    {
      icon: ChefHat,
      label: 'Menu',
      path: '/admin/menu',
      isActive: pathname === '/admin/menu'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/admin/analytics',
      isActive: pathname === '/admin/analytics'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/admin/settings',
      isActive: pathname === '/admin/settings'
    }
  ]

  const navItems = userType === 'student' ? studentNav : managerNav

  // Don't show navigation on auth pages or landing page
  if (pathname === '/' || pathname.startsWith('/auth/')) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className={`grid ${userType === 'manager' ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center py-3 px-1 transition-colors duration-200 ${
                item.isActive
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`${userType === 'manager' ? 'w-4 h-4' : 'w-5 h-5'} mb-1`} />
              <span className={`font-medium ${userType === 'manager' ? 'text-[10px]' : 'text-xs'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
} 