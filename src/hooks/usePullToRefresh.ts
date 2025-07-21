'use client';

import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 0.5,
  enabled = true
}: PullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const scrollContainer = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = document.documentElement || document.body;
    scrollContainer.current = container;

    let touchStartY = 0;
    let touchCurrentY = 0;
    let canPull = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh at the top of the page
      if (window.scrollY > 0) return;
      
      touchStartY = e.touches[0].clientY;
      startY.current = touchStartY;
      canPull = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull) return;
      
      touchCurrentY = e.touches[0].clientY;
      currentY.current = touchCurrentY;
      
      const deltaY = touchCurrentY - touchStartY;
      
      // Only process downward swipes at the top of the page
      if (deltaY > 0 && window.scrollY === 0) {
        e.preventDefault(); // Prevent default scrolling
        
        const distance = Math.min(deltaY * resistance, threshold * 1.5);
        setPullDistance(distance);
        setIsPulling(distance > 10);
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull) return;
      
      canPull = false;
      
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          // Animate back to 0
          setTimeout(() => {
            setPullDistance(0);
            setIsPulling(false);
            setIsRefreshing(false);
          }, 300);
        }
      } else {
        // Animate back to 0
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance, onRefresh, pullDistance, isRefreshing]);

  return {
    isRefreshing,
    isPulling,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
} 