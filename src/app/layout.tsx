import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import { UserProvider } from '@/components/UserProvider';
import { CartProvider } from '@/components/CartProvider';
import { NotificationProvider } from '@/components/NotificationSystem';
import PageTransition from '@/components/PageTransition';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PushNotifications from '@/components/PushNotifications';
import PWAPerformanceMonitor from '@/components/PWAPerformanceMonitor';

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'Aieraa Hostel - Food Ordering App',
  description: 'Pre-order your hostel meals easily and skip the queue',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  // Performance optimizations
  robots: 'index, follow',
  keywords: 'hostel, food, ordering, meals, students, vietnam, university',
  authors: [{ name: 'Aieraa' }],
  // PWA-like metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aieraa Hostel',
  },
  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    title: 'Aieraa Hostel - Food Ordering App',
    description: 'Pre-order your hostel meals easily and skip the queue',
    siteName: 'Aieraa Hostel',
    images: '/icons/icon-512x512.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link
          rel='preload'
          href='/icons/icon-192x192.png'
          as='image'
          type='image/png'
        />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />

        {/* DNS prefetch for external domains */}
        <link rel='dns-prefetch' href='//fonts.googleapis.com' />
        <link rel='dns-prefetch' href='//fonts.gstatic.com' />

        {/* Optimize resource hints */}
        <meta name='format-detection' content='telephone=no' />
        <meta name='msapplication-tap-highlight' content='no' />

        {/* Critical CSS inlining hint */}
        <meta name='optimize-css' content='true' />
      </head>
      <body
        className={`${inter.variable} font-sans`}
        suppressHydrationWarning={true}
      >
        <div className='w-full min-h-full'>
          <SessionWrapper>
            <UserProvider>
              <NotificationProvider>
                <CartProvider>
                  <PageTransition>{children}</PageTransition>
                  <PWAInstallPrompt />
                  <PushNotifications />
                  <PWAPerformanceMonitor />
                </CartProvider>
              </NotificationProvider>
            </UserProvider>
          </SessionWrapper>
        </div>

        {/* Performance monitoring script (only in production) */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Basic performance monitoring
                window.addEventListener('load', function() {
                  if ('performance' in window) {
                    setTimeout(function() {
                      const perf = performance.getEntriesByType('navigation')[0];
                      // Performance tracking without debug output
                    }, 0);
                  }
                });
                
                // Service worker registration for offline support
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(error) {
                      // Service worker registration failed silently
                    });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
