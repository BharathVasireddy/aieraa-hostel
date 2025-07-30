'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we're in a PWA environment
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {return;}

    let refreshing = false;

    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) {return;}
      refreshing = true;
      setUpdateComplete(true);
      
      // Auto-refresh after a short delay to show success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    });

    // Force check for updates immediately
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        console.log('🔄 Checking for PWA updates...', {
          waiting: !!registration.waiting,
          installing: !!registration.installing,
          active: !!registration.active
        });
        
        if (registration.waiting) {
          console.log('🎉 Update available! Service worker is waiting...');
          setUpdateAvailable(true);
          setShowPrompt(true);
        }

        // Listen for new service worker installations
        registration.addEventListener('updatefound', () => {
          console.log('🔄 New service worker found, installing...');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('🔄 Service worker state changed:', newWorker.state);
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✅ New service worker installed and ready!');
                setUpdateAvailable(true);
                setShowPrompt(true);
              }
            });
          }
        });

        // Force update check by calling update()
        registration.update().then(() => {
          console.log('🔄 Forced service worker update check completed');
        }).catch(error => {
          console.error('❌ Service worker update check failed:', error);
        });

      } catch (error) {
        console.error('❌ Error checking for updates:', error);
      }
    };

    // Check immediately when component mounts
    checkForUpdates();

    // Check for updates periodically (every 10 seconds for testing)
    const interval = setInterval(checkForUpdates, 10000);

    // Also check when window regains focus (user returns to app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 App became visible, checking for updates...');
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUpdate = async () => {
    if (!updateAvailable) {return;}

    setIsUpdating(true);
    console.log('🔄 Starting app update...');

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        console.log('📤 Sending SKIP_WAITING message to service worker...');
        // Tell the waiting service worker to skip waiting and become active
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('❌ Error updating app:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setUpdateAvailable(false);
    // Set a timestamp to avoid showing again too quickly
    localStorage.setItem('pwa-update-dismissed', Date.now().toString());
  };

  if (updateComplete) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
        <CheckCircle className="w-5 h-5" />
        <div>
          <p className="font-medium">App Updated! ✨</p>
          <p className="text-sm opacity-90">Refreshing with new features...</p>
        </div>
      </div>
    );
  }

  if (!showPrompt || !updateAvailable) {return null;}

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium mb-1">Update Available! 🚀</h4>
          <p className="text-sm opacity-90 mb-3">
            New features and improvements are ready to install.
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={() => void handleUpdate()}
              disabled={isUpdating}
              className="bg-white text-blue-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-1 disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>Update Now</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => void handleDismiss()}
              className="text-blue-100 hover:text-white text-sm px-2 py-1.5 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 