'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  BarChart3,
  Settings,
  User,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Globe,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[];
}

interface AdminSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    university?: {
      name: string;
      code: string;
    };
  };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Universities', href: '/admin/universities', icon: Building2 },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Menu Management', href: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    {
      name: 'Promotional Banners',
      href: '/admin/promotional-banners',
      icon: Megaphone,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      children: [
        { name: 'System Settings', href: '/admin/settings' },
        { name: 'Homepage', href: '/admin/settings/homepage' },
      ],
    },
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    
    // Handle URLs with query parameters
    const [hrefPath, hrefQuery] = href.split('?');
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname;
    
    if (hrefQuery) {
      // For exact match with query parameters
      return currentUrl === href;
    }
    
    return pathname.startsWith(hrefPath);
  };

  const isChildActive = (
    parentHref: string,
    children?: NavigationItem['children']
  ) => {
    if (!children) {return false;}
    return children.some(child => isActive(child.href));
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className='flex flex-col h-full bg-white border-r border-gray-200'>
      {/* Logo & Brand */}
      <div className='flex items-center px-6 py-5 border-b border-gray-100'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm'>
            <Globe className='w-6 h-6 text-white' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>Aieraa Admin</h1>
            <p className='text-sm text-gray-500'>System Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-4 py-4 space-y-2 overflow-y-auto'>
        {navigationItems.map(item => {
          const Icon = item.icon;
          const isItemActive = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name.toLowerCase());
          const hasActiveChild = isChildActive(item.href, item.children);

          return (
            <div key={item.name}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleExpanded(item.name.toLowerCase());
                  } else {
                    router.push(item.href);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isItemActive || hasActiveChild
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className='flex items-center space-x-3'>
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isItemActive || hasActiveChild
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span className='font-medium'>{item.name}</span>
                  {item.badge && (
                    <span className='bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm'>
                      {item.badge}
                    </span>
                  )}
                </div>
                {hasChildren && (
                  <div className='flex items-center'>
                    {isExpanded ? (
                      <ChevronDown className='w-4 h-4 transition-transform text-gray-400' />
                    ) : (
                      <ChevronRight className='w-4 h-4 transition-transform text-gray-400' />
                    )}
                  </div>
                )}
              </button>

              {/* Submenu */}
              {hasChildren && isExpanded && (
                <div className='mt-2 ml-4 space-y-1'>
                  {item.children?.map(child => (
                    <button
                      key={child.name}
                      onClick={() => router.push(child.href)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                        isActive(child.href)
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className='flex items-center space-x-3'>
                        {child.icon && (
                          <child.icon 
                            className={`w-4 h-4 ${
                              isActive(child.href) ? 'text-white' : 'text-gray-400'
                            }`}
                          />
                        )}
                        <span>{child.name}</span>
                        {child.badge && (
                          <span className='bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full'>
                            {child.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className='relative p-4 border-t border-gray-100'>
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className='w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group'
        >
          <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm'>
            <span className='text-white font-bold text-sm'>
              {user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()}
            </span>
          </div>
          <div className='flex-1 text-left'>
            <p className='text-sm font-semibold text-gray-900 truncate'>
              {user.name}
            </p>
            <p className='text-xs text-gray-500 truncate'>{user.email}</p>
          </div>
          <ChevronUp
            className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className='absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2'>
            <button
              onClick={() => {
                router.push('/admin/profile');
                setShowProfileMenu(false);
              }}
              className='w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
            >
              <User className='w-4 h-4 text-gray-400' />
              <span>Profile Settings</span>
            </button>
            <button
              onClick={() => {
                handleLogout();
                setShowProfileMenu(false);
              }}
              className='w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
            >
              <LogOut className='w-4 h-4 text-red-500' />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
