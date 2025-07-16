import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    console.log('🧪 Testing session retrieval...')
    
    const session = await getServerSession(authOptions)
    
    console.log('🧪 Session result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    })
    
    return NextResponse.json({
      success: true,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          role: session.user?.role,
          status: session.user?.status
        }
      } : null,
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role
      }
    })
    
  } catch (error) {
    console.error('🧪 Session test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 