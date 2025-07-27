'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Phone, Shield, Clock, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WhatsAppLoginProps {
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
}

export default function WhatsAppLogin({ onSuccess, onError }: WhatsAppLoginProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [canResend, setCanResend] = useState(false)
  
  const otpInputs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 5) {
      return cleaned
    } else if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{5})(\d{0,5})/, '$1 $2')
    }
    return cleaned.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2')
  }

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    setError('')
    
    // Debug logging
    const cleanDigits = formatted.replace(/\D/g, '')
    console.log('Phone input:', {
      raw: e.target.value,
      formatted,
      cleanDigits,
      length: cleanDigits.length,
      isValid: cleanDigits.length === 10
    })
  }

  // Send OTP
  const handleSendOTP = async () => {
    if (!phone || phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') })
      })

      const data = await response.json()

      if (data.success) {
        setStep('otp')
        setSuccess('OTP sent to your WhatsApp! Check your messages.')
        startCountdown()
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Start countdown timer
  const startCountdown = () => {
    setTimeLeft(60)
    setCanResend(false)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newOTP = otp.split('')
    newOTP[index] = value
    setOtp(newOTP.join(''))
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus()
    }

    // Auto-verify when OTP is complete
    if (newOTP.join('').length === 6) {
      setTimeout(() => handleVerifyOTP(newOTP.join('')), 100)
    }
  }

  // Handle backspace in OTP input
  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus()
    }
  }

  // Verify OTP
  const handleVerifyOTP = async (otpCode = otp) => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone.replace(/\D/g, ''), 
          otp: otpCode 
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Login successful! Redirecting...')
        onSuccess?.(data.user)
        
        // Redirect based on user status
        setTimeout(() => {
          router.push(data.redirectTo || '/student')
        }, 1000)
      } else {
        setError(data.error || 'Invalid OTP')
        setOtp('')
        // Focus first OTP input
        otpInputs.current[0]?.focus()
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = () => {
    if (canResend) {
      handleSendOTP()
    }
  }

  // Go back to phone input
  const handleBack = () => {
    setStep('phone')
    setOtp('')
    setError('')
    setSuccess('')
    setTimeLeft(0)
    setCanResend(false)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <MessageCircle className="h-12 w-12 text-green-600" />
            <Shield className="h-5 w-5 text-blue-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Login with WhatsApp
        </h2>
        <p className="text-gray-600">
          {step === 'phone' 
            ? 'Enter your mobile number to receive a verification code'
            : 'Enter the 6-digit code sent to your WhatsApp'
          }
        </p>
      </div>

      {/* Phone Number Step */}
      {step === 'phone' && (
        <div className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">+91</span>
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
                className="block w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                maxLength={11}
                disabled={loading}
              />
              <Phone className="absolute inset-y-0 right-0 pr-3 flex items-center h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            onClick={handleSendOTP}
            disabled={(() => {
              const cleanDigits = phone.replace(/\D/g, '')
              const isDisabled = loading || !phone || cleanDigits.length !== 10
              console.log('Button state:', {
                phone,
                cleanDigits,
                digitLength: cleanDigits.length,
                loading,
                isDisabled
              })
              return isDisabled
            })()}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending OTP...
              </div>
            ) : (
              'Send OTP on WhatsApp'
            )}
          </button>
        </div>
      )}

      {/* OTP Verification Step */}
      {step === 'otp' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <button
                onClick={handleBack}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Change number
              </button>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              Code sent to +91 {phone}
            </div>

            {/* OTP Input */}
            <div className="flex space-x-3 justify-center mb-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputs.current[index] = el)}
                  type="tel"
                  maxLength={1}
                  value={otp[index] || ''}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Timer and Resend */}
          <div className="text-center">
            {timeLeft > 0 ? (
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                Resend OTP in {timeLeft}s
              </div>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={!canResend || loading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                Didn't receive code? Resend OTP
              </button>
            )}
          </div>

          <button
            onClick={() => handleVerifyOTP()}
            disabled={loading || otp.length !== 6}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify & Login'
            )}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Secure & Private</p>
            <p>Your phone number is encrypted and used only for authentication. We never spam or share your contact details.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 