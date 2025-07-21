'use client';

import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  enabled?: boolean;
}

export default function PullToRefresh({ onRefresh, children, enabled = true }: PullToRefreshProps) {
  const { isRefreshing, isPulling, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh,
    enabled
  });

  const opacity = Math.min(pullProgress, 1);
  const scale = 0.8 + (pullProgress * 0.2);
  const rotation = pullProgress * 180;

  return (
    <div className="relative min-h-screen">
      {/* Pull to refresh indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance - 60}px)`,
          opacity: isPulling ? opacity : 0
        }}
      >
        <div 
          className="bg-white rounded-full shadow-lg border border-gray-200 p-3 mx-4"
          style={{
            transform: `scale(${scale})`
          }}
        >
          <RefreshCw 
            className={`w-6 h-6 text-green-600 transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isPulling ? Math.min(pullDistance * 0.3, 30) : 0}px)`
        }}
      >
        {children}
      </div>

      {/* Loading overlay */}
      {isRefreshing && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-center">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
} 