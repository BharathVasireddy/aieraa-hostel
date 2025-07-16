'use client'

import { 
  Home, 
  UtensilsCrossed, 
  Clock, 
  Settings, 
  BarChart3, 
  ChefHat, 
  ShoppingBag, 
  Users,
  Building,
  Crown,
  UserPlus,
  AlertTriangle,
  Plus,
  Menu
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showMore, setShowMore] = useState(false)

  const handleNavigation = useCallback((path: string) => {
    if (pathname !== path) {
      router.push(path)
    }
    setShowMore(false) // Close more menu when navigating
  }, [router, pathname])

  // Determine user type from session
  const userType = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER' ? 'manager' : 'student'
  const isSuper = session?.user?.role === 'ADMIN'

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

  // Core navigation items (always visible)
  const coreManagerNav = [
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
      icon: Users,
      label: isSuper ? 'All Students' : 'Students',
      path: '/admin/users',
      isActive: pathname === '/admin/users'
    }
  ]

  // Extended navigation items (in more menu or additional slots)
  const extendedManagerNav = [
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

  // Super Admin exclusive items
  const superAdminNav = isSuper ? [
    {
      icon: Building,
      label: 'Universities',
      path: '/admin/universities',
      isActive: pathname.startsWith('/admin/universities'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ] : []

  // Combine navigation based on role
  let navItems = userType === 'student' ? studentNav : coreManagerNav
  let moreItems = userType === 'manager' ? [...extendedManagerNav, ...superAdminNav] : []

  // If Super Admin, show university management in main nav
  if (isSuper) {
    navItems = [
      ...coreManagerNav,
      {
        icon: Building,
        label: 'Universities',
        path: '/admin/universities',
        isActive: pathname.startsWith('/admin/universities'),
        special: true
      }
    ]
    moreItems = extendedManagerNav
  }

  // Don't show navigation on auth pages or landing page
  if (pathname === '/' || pathname.startsWith('/auth/')) {
    return null
  }

  const gridCols = userType === 'manager' ? (isSuper ? 'grid-cols-6' : 'grid-cols-5') : 'grid-cols-4'

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className={`grid ${gridCols}`}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isSpecial = item.special && isSuper
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center py-3 px-1 transition-colors duration-200 ${
                  item.isActive
                    ? isSpecial 
                      ? 'text-purple-600 bg-purple-50 border-t-2 border-purple-600'
                      : 'text-green-600 bg-green-50 border-t-2 border-green-600'
                    : isSpecial
                      ? 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`${userType === 'manager' ? 'w-4 h-4' : 'w-5 h-5'} mb-1`} />
                <span className={`font-medium ${userType === 'manager' ? 'text-[10px]' : 'text-xs'}`}>
                  {item.label}
                </span>
                {isSpecial && (
                  <Crown className="w-2 h-2 text-purple-500 absolute top-1 right-1" />
                )}
              </button>
            )
          })}

          {/* More Menu Button (for manager/admin) */}
          {userType === 'manager' && moreItems.length > 0 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex flex-col items-center justify-center py-3 px-1 transition-colors duration-200 ${
                showMore
                  ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Menu className="w-4 h-4 mb-1" />
              <span className="font-medium text-[10px]">More</span>
              {showMore && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable More Menu */}
      {showMore && userType === 'manager' && moreItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 safe-area-pb">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Additional Features</h3>
              <button
                onClick={() => setShowMore(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon
                const isSpecial = item.path === '/admin/universities'
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                      item.isActive
                        ? isSpecial
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSpecial ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{item.label}</p>
                      {isSpecial && (
                        <div className="flex items-center space-x-1 mt-0.5">
                          <Crown className="w-3 h-3 text-purple-500" />
                          <span className="text-xs text-purple-600">Super Admin</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Quick Emergency Actions (Super Admin Only) */}
              {isSuper && (
                <button
                  onClick={() => {
                    setShowMore(false)
                    router.push('/admin/settings')
                  }}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Emergency</p>
                    <p className="text-xs text-red-600">Force logout & more</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for more menu */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setShowMore(false)}
        />
      )}
    </>
  )
} 