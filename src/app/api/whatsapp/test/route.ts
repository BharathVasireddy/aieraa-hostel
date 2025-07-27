import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { whatsappService } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json({ 
        success: false,
        message: 'Phone number and message are required' 
      }, { status: 400 })
    }

    // Check if WhatsApp configuration is present
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'WhatsApp API credentials not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.'
      })
    }

    // Send test message using WhatsApp API directly
    const testMessage = `🧪 Test Message\n\n${message}\n\n---\nSent from Aieraa Admin Panel\n⏰ ${new Date().toLocaleString()}`
    
    // Format phone number for Vietnam
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('84') ? cleanPhone : '84' + cleanPhone.replace(/^0/, '')
    
    const response = await fetch(`${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: testMessage,
          preview_url: false
        }
      }),
    })

    const resultData = await response.json()
    
    let result
    if (response.ok) {
      result = {
        success: true,
        messageId: resultData.messages?.[0]?.id,
        data: resultData
      }
    } else {
      result = {
        success: false,
        error: resultData.error?.message || 'Unknown error'
      }
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test message sent successfully! Message ID: ${result.messageId}`,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send message: ${result.error}`
      })
    }

  } catch (error) {
    console.error('WhatsApp test message error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please check your WhatsApp API configuration and try again.'
    }, { status: 500 })
  }
} 