'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ClipboardList,
  UtensilsCrossed,
  Users,
  BarChart3,
} from 'lucide-react';

export default function ManagerNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navigationItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/manager',
      description: 'Overview & Stats',
    },
    {
      name: 'Orders',
      icon: ClipboardList,
      path: '/manager/orders',
      description: 'Manage Orders',
    },
    {
      name: 'Menu',
      icon: UtensilsCrossed,
      path: '/manager/menu',
      description: 'Menu Items',
    },
    {
      name: 'Students',
      icon: Users,
      path: '/manager/students',
      description: 'Student Management',
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/manager/analytics',
      description: 'Reports & Insights',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/manager') {
      return pathname === '/manager';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50'>
      <div className='grid grid-cols-5 h-16'>
        {navigationItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`
                flex flex-col items-center justify-center space-y-1 transition-all duration-200
                ${
                  active
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon
                className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-600'}`}
              />
              <span
                className={`text-xs font-medium ${active ? 'text-green-600' : 'text-gray-600'}`}
              >
                {item.name}
              </span>

              {/* Active indicator */}
              {active && (
                <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-green-600 rounded-b-full' />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
