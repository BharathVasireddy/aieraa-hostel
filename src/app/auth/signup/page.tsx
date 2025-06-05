'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, ArrowLeft, MapPin } from 'lucide-react'
import { ButtonPress } from '@/components/PageTransition'

interface University {
  id: string
  name: string
  code: string
}

// Phone validation for Indian and Vietnamese numbers
const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Indian numbers: +91 followed by 10 digits (total 12-13 digits with country code)
  // Vietnamese numbers: +84 followed by 9 digits (total 11-12 digits with country code)
  const indianPattern = /^(\+?91|0)?[6-9]\d{9}$/
  const vietnamesePattern = /^(\+?84|0)?[1-9]\d{8}$/
  
  return indianPattern.test(cleaned) || vietnamesePattern.test(cleaned)
}

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    universityId: '',
    studentId: '',
    roomNumber: '',
    phone: '',
    role: 'STUDENT' // Fixed to STUDENT only
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [universities, setUniversities] = useState<University[]>([])
  const [phoneError, setPhoneError] = useState('')
  const router = useRouter()

  // Fetch universities
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities')
        if (response.ok) {
          const data = await response.json()
          setUniversities(data)
        }
      } catch (error) {
        console.error('Failed to fetch universities:', error)
      }
    }
    fetchUniversities()
  }, [])

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }))
    
    if (value && !validatePhone(value)) {
      setPhoneError('Please enter a valid Indian (+91) or Vietnamese (+84) phone number')
    } else {
      setPhoneError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid Indian or Vietnamese phone number')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          universityId: formData.universityId,
          studentId: formData.studentId,
          roomNumber: formData.roomNumber,
          phone: formData.phone,
          role: formData.role
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account created successfully! Please wait for admin approval before signing in.')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      handlePhoneChange(value)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Back Button - Absolute positioned */}
      <ButtonPress 
        onClick={() => router.back()}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </ButtonPress>

      {/* Main Content */}
      <div className="px-4 pt-16 pb-8">
        <div className="max-w-md mx-auto">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <img 
                src="https://aieraa.com/wp-content/uploads/2020/08/Aieraa-Overseas-Logo.png" 
                alt="Aieraa Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Aieraa Hostel</h1>
            <p className="text-gray-600">Create your student account to order hostel meals</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            {/* University Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                University
              </label>
              <select
                name="universityId"
                value={formData.universityId}
                onChange={handleInputChange}
                required
                className="input"
              >
                <option value="">Select your university</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name} ({university.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Student Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    required
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="input-small"
                    placeholder="Student ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    required
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    className="input-small"
                    placeholder="Room #"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className={`input ${phoneError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your phone number (+91 or +84)"
              />
              {phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: Indian (+91) or Vietnamese (+84) numbers
              </p>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input pr-12"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input pr-12"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <ButtonPress
              type="submit"
              disabled={loading || !!phoneError}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Student Account
                </div>
              )}
            </ButtonPress>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> Your account will need approval from a manager before you can sign in. 
              You&apos;ll receive confirmation once your account is approved.
            </p>
          </div>

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary-hover font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 