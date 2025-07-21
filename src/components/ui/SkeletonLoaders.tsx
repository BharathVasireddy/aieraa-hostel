import React from 'react';

// Base skeleton component
export const Skeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;

// Dashboard skeleton - specifically for admin/manager dashboards
export const DashboardSkeleton: React.FC = () => (
  <div className='min-h-screen bg-gray-50'>
    {/* Header Skeleton */}
    <div className='bg-white border-b border-gray-100 px-6 py-4'>
      <Skeleton className='h-8 w-48 mb-2' />
      <Skeleton className='h-4 w-64' />
    </div>

    {/* Stats Grid Skeleton */}
    <div className='p-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className='bg-white rounded-xl border border-gray-200 p-6'
          >
            <Skeleton className='h-4 w-24 mb-4' />
            <Skeleton className='h-8 w-16 mb-2' />
            <Skeleton className='h-3 w-32' />
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <Skeleton className='h-6 w-32 mb-4' />
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <Skeleton className='h-6 w-32 mb-4' />
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Card skeleton for menu items, orders, etc.
export const CardSkeleton: React.FC = () => (
  <div className='bg-white rounded-xl p-4 shadow-sm border'>
    <div className='flex space-x-4'>
      <Skeleton className='w-16 h-16 rounded-lg' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
        <div className='flex justify-between items-center pt-2'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-8 w-20 rounded-lg' />
        </div>
      </div>
    </div>
  </div>
);

// List skeleton for multiple items
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className='space-y-4'>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard stats skeleton
export const StatsSkeleton: React.FC = () => (
  <div className='grid grid-cols-2 gap-4 mb-6'>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className='bg-white rounded-xl p-4 shadow-sm'>
        <Skeleton className='h-4 w-16 mb-2' />
        <Skeleton className='h-8 w-12' />
      </div>
    ))}
  </div>
);

// Profile header skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className='bg-white rounded-xl p-6 shadow-sm'>
    <div className='flex items-center space-x-4'>
      <Skeleton className='w-16 h-16 rounded-full' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-20' />
      </div>
    </div>
  </div>
);

// Order item skeleton
export const OrderSkeleton: React.FC = () => (
  <div className='bg-white rounded-xl p-4 shadow-sm border-l-4 border-gray-200'>
    <div className='flex justify-between items-start mb-3'>
      <div className='space-y-2'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-4 w-32' />
      </div>
      <Skeleton className='h-6 w-16 rounded-full' />
    </div>
    <div className='space-y-2'>
      <Skeleton className='h-4 w-48' />
      <Skeleton className='h-4 w-20' />
    </div>
  </div>
);

// Menu category skeleton
export const CategorySkeleton: React.FC = () => (
  <div className='flex space-x-3 pb-4 overflow-x-auto'>
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className='h-10 w-24 rounded-full flex-shrink-0' />
    ))}
  </div>
);

// Search bar skeleton
export const SearchSkeleton: React.FC = () => (
  <div className='relative mb-4'>
    <Skeleton className='h-12 w-full rounded-xl' />
  </div>
);

// Banner skeleton
export const BannerSkeleton: React.FC = () => (
  <div className='mb-6'>
    <Skeleton className='h-40 w-full rounded-xl' />
  </div>
);

// Table skeleton for admin pages
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
    {/* Header */}
    <div className='border-b border-gray-200 p-4'>
      <div className='flex space-x-4'>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className='h-4 w-24 flex-1' />
        ))}
      </div>
    </div>
    {/* Rows */}
    <div className='divide-y divide-gray-200'>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='p-4'>
          <div className='flex space-x-4'>
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className='h-4 flex-1' />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Analytics chart skeleton
export const ChartSkeleton: React.FC = () => (
  <div className='bg-white rounded-xl p-6 shadow-sm'>
    <Skeleton className='h-6 w-32 mb-4' />
    <Skeleton className='h-64 w-full' />
  </div>
);

// Quick action buttons skeleton
export const QuickActionsSkeleton: React.FC = () => (
  <div className='grid grid-cols-2 gap-4 mb-6'>
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className='h-20 rounded-xl' />
    ))}
  </div>
);
