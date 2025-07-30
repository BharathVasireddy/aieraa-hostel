'use client';

import { Bell, RefreshCw, Settings, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface ManagerHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    university?: string;
    universityId?: string;
  };
}

export default function ManagerHeader({ user }: ManagerHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0); // Can be fetched from API

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <header className='bg-white border-b border-gray-200 px-4 py-3'>
      <div className='flex items-center justify-between max-w-7xl mx-auto'>
        {/* Left - University Info */}
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center'>
            <span className='text-white font-bold text-sm'>
              {user.university?.slice(0, 2).toUpperCase() || 'UN'}
            </span>
          </div>
          <div>
            <h1 className='font-semibold text-gray-900 text-lg'>
              Manager Portal
            </h1>
            <p className='text-sm text-gray-600'>
              {user.university || 'University'}
            </p>
          </div>
        </div>

        {/* Right - Actions */}
        <div className='flex items-center space-x-3'>
          {/* Notifications */}
          <button className='relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'>
            <Bell className='w-5 h-5' />
            {notificationCount > 0 && (
              <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'>
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className='relative'>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <div className='w-8 h-8 bg-green-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-medium text-sm'>
                  {getInitials(user.name)}
                </span>
              </div>
              <ChevronDown className='w-4 h-4 text-gray-600' />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className='absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'>
                {/* User Info */}
                <div className='px-4 py-3 border-b border-gray-100'>
                  <p className='font-medium text-gray-900'>{user.name}</p>
                  <p className='text-sm text-gray-600'>{user.email}</p>
                  <p className='text-xs text-green-600 mt-1'>
                    University Manager
                  </p>
                </div>

                {/* Menu Items */}
                <div className='py-1'>
                  <button
                    onClick={() => (window.location.href = '/manager/profile')}
                    className='w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex items-center space-x-2'>
                      <Settings className='w-4 h-4' />
                      <span>Profile & Settings</span>
                    </div>
                  </button>

                  <button
                    onClick={() => void handleLogout()}
                    className='w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors'
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showUserMenu && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
