'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJCMq4Cs5IHaaYxfTGVTxcTWIuOjZ2LrfE1tUDqnfpB4mIqTQSgzBMx-s0_F1gMf9F1Ks5B5B8zRMA18ityrJ0M';

export default function PushNotificationDebug() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    const debugData: any = {
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushManagerSupported: 'PushManager' in window,
      notificationSupported: 'Notification' in window,
      notificationPermission: Notification?.permission || 'unknown',
      vapidKey: VAPID_PUBLIC_KEY,
      isHTTPS: window.location.protocol === 'https:',
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    };

    console.log('🔔 Push Notification Debug:', debugData);

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        debugData.serviceWorkerReady = true;
        debugData.existingSubscription = !!existingSubscription;
        debugData.subscriptionEndpoint = existingSubscription?.endpoint;
        
        setIsSubscribed(!!existingSubscription);
        setSubscription(existingSubscription);
        
        console.log('🔔 Existing subscription:', existingSubscription);
      } catch (error) {
        console.error('❌ Error checking subscription:', error);
        debugData.error = error;
      }
    }

    setDebugInfo(debugData);
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToNotifications = async () => {
    setLoading(true);
    try {
      console.log('🔔 Starting push notification subscription...');
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      
      if (permission !== 'granted') {
        console.error('❌ Notification permission not granted');
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      console.log('🔔 Service worker ready:', registration);

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('🔔 Push subscription created:', pushSubscription);

      // Send subscription to server
      const response = await fetch('/api/push-notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: pushSubscription.toJSON(),
        }),
      });

      console.log('🔔 Server response:', response.status, response.statusText);

      if (response.ok) {
        setSubscription(pushSubscription);
        setIsSubscribed(true);
        console.log('✅ Successfully subscribed to push notifications');
        
        // Send test notification
        await sendTestNotification();
      } else {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
      }
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      console.log('🔔 Sending test notification...');
      const response = await fetch('/api/push-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '🔔 Test Notification',
          body: 'This is a test notification to verify push notifications are working!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
        }),
      });

      console.log('🔔 Test notification response:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Test notification sent successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Test notification failed:', errorText);
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setLoading(true);
    try {
      if (subscription) {
        await subscription.unsubscribe();
        
        await fetch('/api/push-notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
        
        setIsSubscribed(false);
        setSubscription(null);
        console.log('✅ Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="fixed bottom-20 right-4 z-50 bg-red-600 text-white p-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Push notifications not supported</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Toggle Debug Button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors mb-2"
      >
        <Bell className="w-4 h-4" />
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mb-2">
          <h3 className="font-medium text-gray-900 mb-3">Push Notification Debug</h3>
          
          {/* Status */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              {isSubscribed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-sm">
                {isSubscribed ? 'Subscribed' : 'Not subscribed'}
              </span>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>Permission: {debugInfo.notificationPermission}</div>
              <div>PWA: {debugInfo.isPWA ? 'Yes' : 'No'}</div>
              <div>HTTPS: {debugInfo.isHTTPS ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!isSubscribed ? (
              <button
                onClick={() => void subscribeToNotifications()}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3" />
                    <span>Enable Notifications</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => void sendTestNotification()}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Send Test Notification
                </button>
                <button
                  onClick={() => void unsubscribeFromNotifications()}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <BellOff className="w-3 h-3" />
                  <span>Disable Notifications</span>
                </button>
              </>
            )}
          </div>

          {/* Debug Info */}
          <details className="mt-3">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
            <pre className="text-xs text-gray-600 mt-1 overflow-auto max-h-32">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
} 