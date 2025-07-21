'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Plus, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed') === 'true'
    setHasBeenDismissed(dismissed)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after a delay if not dismissed and not standalone
      setTimeout(() => {
        if (!dismissed && !standalone) {
          setShowInstallPrompt(true)
        }
      }, 10000) // Show after 10 seconds
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show manual install instructions
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 15000) // Show after 15 seconds on iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setHasBeenDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
    
    // Allow showing again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  // Don't show if already installed or dismissed
  if (isStandalone || hasBeenDismissed || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Install App</h3>
              <p className="text-sm text-gray-600">Add to Home Screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              Get the full app experience
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              Install Aieraa Hostel on your home screen for faster access and a better experience.
            </p>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">⚡ Faster loading</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">📱 Works offline</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">🔔 Push notifications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">🎨 Native app feel</span>
              </div>
            </div>
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                <Share className="w-4 h-4 mr-2" />
                Install on iOS
              </h5>
              <ol className="text-sm text-blue-800 space-y-2">
                <li>1. Tap the Share button below</li>
                <li>2. Scroll down and tap "Add to Home Screen"</li>
                <li>3. Tap "Add" to install the app</li>
              </ol>
            </div>
          ) : (
            deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 mb-4"
              >
                <Download className="w-5 h-5" />
                <span>Install App</span>
              </button>
            )
          )}

          {/* Manual Instructions for Android */}
          {!isIOS && !deferredPrompt && (
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <h5 className="font-medium text-green-900 mb-3 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Install on Android
              </h5>
              <ol className="text-sm text-green-800 space-y-2">
                <li>1. Open Chrome menu (⋮)</li>
                <li>2. Tap "Add to Home screen"</li>
                <li>3. Tap "Add" to install</li>
              </ol>
            </div>
          )}

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="w-full py-3 text-gray-600 text-sm hover:text-gray-800 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
} 