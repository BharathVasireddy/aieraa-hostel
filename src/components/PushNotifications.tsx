'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BJ24omJ9PPmTnTbuSbFBPLYxxBYIgVoEWgH6mo9NKrg0vovXhKO3oAc9I3_GM554UytSuuGKP_P475LFxmzi3VM';

export default function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      void checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();

      setIsSubscribed(!!existingSubscription);
      setSubscription(existingSubscription);

      // Show prompt if not subscribed and not dismissed
      const dismissed =
        localStorage.getItem('push-notifications-dismissed') === 'true';
      if (!existingSubscription && !dismissed) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 20000); // Show after 20 seconds
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

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

      if (response.ok) {
        setSubscription(pushSubscription);
        setIsSubscribed(true);
        setShowPrompt(false);

        // Send test notification
        await fetch('/api/push-notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '🔔 Notifications Enabled!',
            body: "You'll receive updates about your orders and special offers.",
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
          }),
        });
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from server
        await fetch('/api/push-notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        setSubscription(null);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('push-notifications-dismissed', 'true');

    // Allow showing again after 30 days
    setTimeout(
      () => {
        localStorage.removeItem('push-notifications-dismissed');
      },
      30 * 24 * 60 * 60 * 1000
    );
  };

  if (!isSupported || !showPrompt) {
    return null;
  }

  return (
    <div className='fixed top-4 left-4 right-4 z-50 mx-auto max-w-md'>
      <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-4 animate-slide-down'>
        <div className='flex items-start space-x-3'>
          <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0'>
            <Bell className='w-6 h-6 text-blue-600' />
          </div>

          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-gray-900 text-sm'>
              Stay Updated!
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Get notified about your order status and special offers.
            </p>

            <div className='flex items-center space-x-2 mt-3'>
              <button
                onClick={subscribeUser}
                disabled={loading}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </button>

              <button
                onClick={dismissPrompt}
                className='text-gray-500 px-3 py-2 rounded-lg text-sm hover:text-gray-700 transition-colors'
              >
                Not now
              </button>
            </div>
          </div>

          <button
            onClick={dismissPrompt}
            className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0'
          >
            <X className='w-4 h-4 text-gray-600' />
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification Settings Component for Settings Page
export function NotificationSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      void checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();
      setIsSubscribed(!!existingSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const toggleNotifications = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

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
        }

        setIsSubscribed(false);
      } else {
        const registration = await navigator.serviceWorker.ready;

        const pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await fetch('/api/push-notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: pushSubscription.toJSON(),
          }),
        });

        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          {isSubscribed ? (
            <Bell className='w-5 h-5 text-green-600' />
          ) : (
            <BellOff className='w-5 h-5 text-gray-400' />
          )}
          <div>
            <h3 className='font-medium text-gray-900'>Push Notifications</h3>
            <p className='text-sm text-gray-600'>
              Get updates about your orders
            </p>
          </div>
        </div>

        <button
          onClick={toggleNotifications}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 ${
            isSubscribed ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              isSubscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
