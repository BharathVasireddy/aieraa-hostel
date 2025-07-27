import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'

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

    const { email, name, message } = await request.json()

    if (!email || !name || !message) {
      return NextResponse.json({ 
        success: false,
        message: 'Email, name, and message are required' 
      }, { status: 400 })
    }

    // Check if Brevo configuration is present
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'Brevo API key not configured. Please set BREVO_API_KEY environment variable.'
      })
    }

    // Send test email using email service
    const result = await emailService.sendTestEmail(email, name, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully! Message ID: ${result.messageId}`,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send email: ${result.error}`
      })
    }

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please check your Brevo API configuration and try again.'
    }, { status: 500 })
  }
} 