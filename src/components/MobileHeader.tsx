'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { ReactNode } from 'react'

interface MobileHeaderProps {
  title: string
  showSearch?: boolean
  showNotifications?: boolean
  showMenu?: boolean
  onMenuClick?: () => void
  rightElement?: ReactNode
}

export default function MobileHeader({ 
  title, 
  showSearch = false, 
  showNotifications = true,
  showMenu = false,
  onMenuClick,
  rightElement
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showMenu && (
            <button 
              onClick={onMenuClick}
              className="mr-3 p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {showSearch && (
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
          )}
          {showNotifications && (
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          )}
          {rightElement}
        </div>
      </div>
    </header>
  )
} 