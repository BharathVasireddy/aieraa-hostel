import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import SessionWrapper from '@/components/SessionWrapper'
import { UserProvider } from '@/components/UserProvider'
import { CartProvider } from '@/components/CartProvider'
import PageTransition from '@/components/PageTransition'

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans'
})

export const metadata: Metadata = {
  title: 'Aieraa Hostel - Food Ordering App',
  description: 'Pre-order your hostel meals easily and skip the queue',
  manifest: '/manifest.json'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.className} ${plusJakartaSans.variable}`}>
        <SessionWrapper>
          <UserProvider>
            <CartProvider>
              <PageTransition>
                {children}
              </PageTransition>
            </CartProvider>
          </UserProvider>
        </SessionWrapper>
      </body>
    </html>
  )
} 