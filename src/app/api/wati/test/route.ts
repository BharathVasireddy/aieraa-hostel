import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { watiWhatsAppService } from '@/lib/wati-whatsapp'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, name: true }
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'Access denied. Admin role required.'
      }, { status: 403 })
    }

    const { phoneNumber, message, testType } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        message: 'Phone number is required'
      }, { status: 400 })
    }

    // Check if Wati API is configured
    if (!process.env.WATI_ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'Wati API not configured. Please set WATI_ACCESS_TOKEN environment variable.'
      })
    }

    let result
    
    // Handle different test types
    if (testType === 'template' || testType === 'order_confirmation') {
      console.log('🧪 Testing WATI template message for order confirmation')
      result = await watiWhatsAppService.sendTestOrderConfirmation(phoneNumber)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `✅ Order confirmation template sent successfully via WATI! Message ID: ${result.messageId}`,
          messageId: result.messageId,
          testType: 'template'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: `❌ Failed to send WATI template: ${result.error}`,
          testType: 'template'
        })
      }
    } else {
      // Regular message test
      if (!message) {
        return NextResponse.json({
          success: false,
          message: 'Message is required for regular message test'
        }, { status: 400 })
      }

      console.log('🧪 Testing WATI regular message')
      result = await watiWhatsAppService.sendTestMessage(phoneNumber, message)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `✅ Test message sent successfully via WATI! Message ID: ${result.messageId}`,
          messageId: result.messageId,
          testType: 'regular'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: `❌ Failed to send WATI message: ${result.error}`,
          testType: 'regular'
        })
      }
    }

  } catch (error) {
    console.error('Wati test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please check your Wati API configuration and try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET method for testing configuration
export async function GET() {
  try {
    const hasToken = !!process.env.WATI_ACCESS_TOKEN
    const apiUrl = process.env.WATI_API_URL || 'https://live-mt-server.wati.io/320431'
    
    return NextResponse.json({
      configured: hasToken,
      apiUrl: hasToken ? apiUrl : 'Not configured',
      message: hasToken ? 'WATI API is configured and ready' : 'WATI API token not found'
    })
  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: 'Configuration check failed'
    }, { status: 500 })
  }
} 