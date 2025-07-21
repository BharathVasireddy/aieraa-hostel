import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname
    const token = req.nextauth.token
    const isAuthenticated = !!token
    
    // For home page, always allow access
    if (pathname === '/') {
      return NextResponse.next()
    }
    
    // For auth pages, redirect authenticated users to their dashboard
    if (pathname.startsWith('/auth/')) {
      if (isAuthenticated) {
        const userRole = token.role as string
        let redirectUrl = '/'
        
        switch (userRole) {
          case 'ADMIN':
            redirectUrl = '/admin'
            break
          case 'MANAGER':
            redirectUrl = '/manager'
            break
          case 'STUDENT':
            redirectUrl = '/student'
            break
          default:
            redirectUrl = '/'
        }
        
        const response = NextResponse.redirect(new URL(redirectUrl, req.url))
        // Prevent caching of auth redirects
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        return response
      }
      
      // Add no-cache headers for auth pages
      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
    
    // For protected routes, check authentication
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
    
    // Role-based access control with new structure
    const userRole = token.role as string
    
    // Super Admin (ADMIN) routes - only /admin paths
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      // Redirect MANAGER to their dedicated route
      if (userRole === 'MANAGER') {
        return NextResponse.redirect(new URL('/manager', req.url))
      }
      // Redirect others to student dashboard
      return NextResponse.redirect(new URL('/student', req.url))
    }
    
    // Manager routes - only /manager paths
    if (pathname.startsWith('/manager') && userRole !== 'MANAGER') {
      // Redirect ADMIN to their dedicated route
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      // Redirect others to student dashboard
      return NextResponse.redirect(new URL('/student', req.url))
    }
    
    // Student routes
    if (pathname.startsWith('/student') && userRole !== 'STUDENT') {
      // Redirect ADMIN and MANAGER to their respective dashboards
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      if (userRole === 'MANAGER') {
        return NextResponse.redirect(new URL('/manager', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Always allow public routes
        if (pathname === '/') {
          return true
        }
        
        // For auth pages, always allow (middleware handles authenticated users)
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // For protected routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 