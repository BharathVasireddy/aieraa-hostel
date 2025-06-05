import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // If user is authenticated and trying to access root/landing page
    if (token && pathname === '/') {
      // Redirect based on user role
      if (token.role === 'ADMIN' || token.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else if (token.role === 'STUDENT') {
        return NextResponse.redirect(new URL('/student', req.url))
      }
    }

    // If user is authenticated and trying to access auth pages
    if (token && (pathname.startsWith('/auth/') || pathname === '/auth')) {
      // Redirect based on user role
      if (token.role === 'ADMIN' || token.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else if (token.role === 'STUDENT') {
        return NextResponse.redirect(new URL('/student', req.url))
      }
    }

    // Protect admin routes - Allow both ADMIN and MANAGER roles
    if (pathname.startsWith('/admin') && (!token || !['ADMIN', 'MANAGER'].includes(token.role))) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Protect student routes
    if (pathname.startsWith('/student') && (!token || token.role !== 'STUDENT')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes
        if (pathname === '/' || 
            pathname.startsWith('/auth/') || 
            pathname.startsWith('/api/auth/') ||
            pathname.startsWith('/_next/') ||
            pathname.startsWith('/favicon.ico')) {
          return true
        }

        // Require authentication for protected routes
        return !!token
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