'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  UtensilsCrossed, 
  Users, 
  BarChart3, 
  Settings, 
  User,
  ChevronDown,
  ChevronRight,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  ChevronUp
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: {
    name: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
    badge?: number
  }[]
}

interface ManagerSidebarProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    university?: {
      name: string
      code: string
    }
    universityId?: string
  }
  pendingOrdersCount?: number
  pendingStudentsCount?: number
}

export default function ManagerSidebar({ 
  user, 
  pendingOrdersCount = 0, 
  pendingStudentsCount = 0 
}: ManagerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    {
      name: 'Orders', href: '/manager/orders', icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      children: [
        { name: 'All Orders', href: '/manager/orders', icon: ShoppingCart },
        { name: 'Pending Approval', href: '/manager/orders?status=pending', badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined, icon: Clock },
        { name: 'In Progress', href: '/manager/orders?status=preparing', icon: AlertCircle },
        { name: 'Ready for Pickup', href: '/manager/orders?status=ready', icon: CheckCircle },
        { name: 'Completed', href: '/manager/orders?status=served', icon: CheckCircle }
      ]
    },
    { name: 'Menu Management', href: '/manager/menu', icon: UtensilsCrossed },
    { name: 'Students', href: '/manager/students', icon: Users, badge: pendingStudentsCount > 0 ? pendingStudentsCount : undefined },
    { name: 'Analytics', href: '/manager/analytics', icon: BarChart3 },
    {
      name: 'Settings', href: '/manager/settings', icon: Settings,
      children: [
        { name: 'University Settings', href: '/manager/settings' },
        { name: 'Ordering Rules', href: '/manager/settings/ordering' },
        { name: 'Notifications', href: '/manager/settings/notifications' }
      ]
    }
  ]

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => {
    if (href === '/manager') {
      return pathname === '/manager'
    }
    return pathname.startsWith(href)
  }

  const isChildActive = (parentHref: string, children?: NavigationItem['children']) => {
    if (!children) return false
    return children.some(child => isActive(child.href))
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo & University Info */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">
              {user.university?.code || 'UN'}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manager Portal</h1>
            <p className="text-sm text-gray-500">{user.university?.name || 'University'}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {(pendingOrdersCount > 0 || pendingStudentsCount > 0) && (
        <div className="px-6 py-3 mx-4 mt-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl space-y-3">
          {pendingOrdersCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700">Pending Orders</span>
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {pendingOrdersCount}
              </span>
            </div>
          )}
          {pendingStudentsCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700">Pending Students</span>
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {pendingStudentsCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isItemActive = isActive(item.href)
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.name.toLowerCase())
          const hasActiveChild = isChildActive(item.href, item.children)

          return (
            <div key={item.name}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleExpanded(item.name.toLowerCase())
                  } else {
                    router.push(item.href)
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isItemActive || hasActiveChild
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-colors ${
                    isItemActive || hasActiveChild 
                      ? 'text-white' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                {hasChildren && (
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 transition-transform text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 transition-transform text-gray-400" />
                    )}
                  </div>
                )}
              </button>

              {/* Submenu */}
              {hasChildren && isExpanded && (
                <div className="mt-2 ml-4 space-y-1">
                  {item.children?.map((child) => (
                    <button
                      key={child.name}
                      onClick={() => router.push(child.href)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                        isActive(child.href)
                          ? 'bg-green-50 text-green-700 border-l-2 border-green-500'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {child.icon && <child.icon className="w-4 h-4" />}
                        <span>{child.name}</span>
                        {child.badge && (
                          <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {child.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Profile Section */}
      <div className="relative p-4 border-t border-gray-100">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <ChevronUp className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
            <button
              onClick={() => {
                router.push('/manager/profile')
                setShowProfileMenu(false)
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 text-gray-400" />
              <span>Profile Settings</span>
            </button>
            <button
              onClick={() => {
                handleLogout()
                setShowProfileMenu(false)
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 