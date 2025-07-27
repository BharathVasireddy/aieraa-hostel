// WhatsApp OTP Service for Authentication
// File: src/lib/whatsapp-otp.ts

import { prisma } from './prisma'

// WATI Configuration
const WATI_API_URL = process.env.WATI_API_URL ?? 'https://live-mt-server.wati.io/320631'
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN ?? ''
const TEMPLATE_NAMESPACE = process.env.WATI_TEMPLATE_NAMESPACE ?? 'bc58e840_9936_490d_8bf4_8935dc18adf9'

// Login OTP Template Configuration
const LOGIN_OTP_TEMPLATE = 'aieraa_food_login_otp'
const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_ATTEMPTS = 3



class WhatsAppOTPService {
  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Format phone number for WhatsApp (ensure 91 country code for India)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleanPhone = phone.replace(/\D/g, '')
    
    // Remove leading +91 if present
    if (cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2)
    }
    
    // Add country code
    return '91' + cleanPhone
  }

  /**
   * Validate Indian phone number format
   */
  private isValidIndianPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(cleanPhone.replace(/^91/, ''))
  }

  /**
   * Send OTP template message via WATI
   */
  private async sendOTPTemplate(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!WATI_ACCESS_TOKEN) {
        throw new Error('WATI access token not configured')
      }

      const formattedPhone = this.formatPhoneNumber(phone)
      
      // Template parameters: {{1}} = OTP code
      const parameters = [
        { name: "1", value: otp }
      ]

      const endpoint = `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${formattedPhone}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_name: LOGIN_OTP_TEMPLATE,
          namespace: TEMPLATE_NAMESPACE,
          language: 'en',
          broadcast_name: 'login_otp',
          parameters
        })
      })

      const result = await response.json()

      if (!response.ok || result.result === false) {
        throw new Error(`WATI Template API error: ${result.info ?? result.message ?? response.statusText}`)
      }

      return {
        success: true,
        messageId: result.messageId ?? result.id ?? 'otp_sent',
      }
    } catch (error) {
      console.error('WhatsApp OTP send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string): Promise<{ success: boolean; error?: string; expiresAt?: Date }> {
    try {
      // Validate phone number
      if (!this.isValidIndianPhone(phone)) {
        return {
          success: false,
          error: 'Invalid phone number. Please enter a valid Indian mobile number.'
        }
      }

      const formattedPhone = this.formatPhoneNumber(phone)
      
      // Check if there's a recent OTP request (rate limiting)
      const recentOTP = await prisma.phoneOTP.findFirst({
        where: {
          phone: formattedPhone,
          createdAt: {
            gte: new Date(Date.now() - 60000) // 1 minute ago
          }
        }
      })

      if (recentOTP) {
        return {
          success: false,
          error: 'Please wait 1 minute before requesting another OTP.'
        }
      }

      // Generate OTP and expiry time
      const otp = this.generateOTP()
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000)

      // Save OTP to database
      await prisma.phoneOTP.upsert({
        where: { phone: formattedPhone },
        update: {
          otp,
          expiresAt,
          attempts: 0,
          verified: false
        },
        create: {
          phone: formattedPhone,
          otp,
          expiresAt,
          attempts: 0,
          verified: false
        }
      })

      // Send OTP via WhatsApp
      const sendResult = await this.sendOTPTemplate(formattedPhone, otp)

      if (!sendResult.success) {
        // Delete the OTP record if sending failed
        await prisma.phoneOTP.delete({
          where: { phone: formattedPhone }
        }).catch(() => {}) // Ignore deletion errors

        return {
          success: false,
          error: `Failed to send OTP: ${sendResult.error}`
        }
      }

      return {
        success: true,
        expiresAt
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.'
      }
    }
  }

  /**
   * Verify OTP and return user information
   */
  async verifyOTP(phone: string, otp: string): Promise<{ 
    success: boolean; 
    error?: string; 
    user?: any;
    isNewUser?: boolean;
  }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone)

      // Find OTP record
      const otpRecord = await prisma.phoneOTP.findUnique({
        where: { phone: formattedPhone }
      })

      if (!otpRecord) {
        return {
          success: false,
          error: 'No OTP found for this phone number. Please request a new OTP.'
        }
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        await prisma.phoneOTP.delete({
          where: { phone: formattedPhone }
        }).catch(() => {})

        return {
          success: false,
          error: 'OTP has expired. Please request a new OTP.'
        }
      }

      // Check if OTP is already verified
      if (otpRecord.verified) {
        return {
          success: false,
          error: 'OTP has already been used. Please request a new OTP.'
        }
      }

      // Check max attempts
      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await prisma.phoneOTP.delete({
          where: { phone: formattedPhone }
        }).catch(() => {})

        return {
          success: false,
          error: 'Maximum OTP attempts exceeded. Please request a new OTP.'
        }
      }

      // Increment attempts
      await prisma.phoneOTP.update({
        where: { phone: formattedPhone },
        data: { attempts: otpRecord.attempts + 1 }
      })

      // Verify OTP
      if (otpRecord.otp !== otp) {
        return {
          success: false,
          error: `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpRecord.attempts - 1} attempts remaining.`
        }
      }

      // Mark OTP as verified
      await prisma.phoneOTP.update({
        where: { phone: formattedPhone },
        data: { verified: true }
      })

      // Check if user exists with this phone number
      const user = await prisma.user.findFirst({
        where: { phone: formattedPhone }
      })

      if (!user) {
        return {
          success: false,
          error: 'Phone number not registered. Please sign up first.'
        }
      }

      // Check if user is approved
      if (user.status !== 'APPROVED') {
        return {
          success: false,
          error: 'Your account is pending approval. Please contact your university administrator.'
        }
      }

      // Clean up OTP record
      await prisma.phoneOTP.delete({
        where: { phone: formattedPhone }
      }).catch(() => {})

      return {
        success: true,
        user
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again.'
      }
    }
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await prisma.phoneOTP.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    } catch (error) {
      console.error('OTP cleanup error:', error)
    }
  }
}

export const whatsappOTPService = new WhatsAppOTPService()
export default whatsappOTPService 