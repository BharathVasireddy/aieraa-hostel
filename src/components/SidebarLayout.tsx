'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  mobileHeader?: React.ReactNode;
  mobileNavigation?: React.ReactNode;
}

export default function SidebarLayout({
  children,
  sidebar,
  mobileHeader,
  mobileNavigation,
}: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Close mobile sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Desktop Sidebar */}
      <div className='hidden lg:flex lg:w-64 lg:flex-col'>
        <div className='flex-1 flex flex-col min-h-0'>{sidebar}</div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className='fixed inset-0 z-50 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        >
          <div className='absolute inset-0 bg-gray-600 bg-opacity-75' />
          <div
            className='relative flex-1 flex flex-col max-w-xs w-full bg-white'
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Sidebar Header */}
            <div className='absolute top-0 right-0 -mr-12 pt-2'>
              <button
                type='button'
                className='ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
                onClick={() => setSidebarOpen(false)}
              >
                <span className='sr-only'>Close sidebar</span>
                <X className='h-6 w-6 text-white' />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Mobile Header */}
        {isMobile && mobileHeader && (
          <div className='lg:hidden'>
            <div className='flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3'>
              <button
                type='button'
                className='-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500'
                onClick={() => setSidebarOpen(true)}
              >
                <span className='sr-only'>Open sidebar</span>
                <Menu className='h-6 w-6' />
              </button>
              {mobileHeader}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className='flex-1 relative overflow-y-auto focus:outline-none'>
          <div className='py-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && mobileNavigation && (
          <div className='lg:hidden'>{mobileNavigation}</div>
        )}
      </div>
    </div>
  );
}
