import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Performance: Cache auth results for static routes
const staticRoutes = ['/icons/', '/images/', '/_next/', '/favicon.ico']

export default withAuth(
  function middleware(req) {
    // Skip auth for static resources immediately
    const pathname = req.nextUrl.pathname
    if (staticRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    const token = req.nextauth.token
    const isAuthenticated = !!token
    
    // Performance: Early return for public routes
    if (pathname === '/' || pathname.startsWith('/auth/')) {
      return NextResponse.next()
    }

    // Redirect unauthenticated users
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    const userRole = token.role as string
    
    // Role-based access control with performance optimization
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.redirect(new URL('/student', req.url))
      }
    } else if (pathname.startsWith('/student')) {
      if (userRole !== 'STUDENT') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Performance: Allow all requests, handle auth in middleware function
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 