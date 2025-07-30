'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, MapPin, User, UserPlus, CheckCircle, Clock, X } from 'lucide-react'
import { ButtonPress } from '@/components/PageTransition'
// Cache imports removed - caching disabled

interface University {
  id: string
  name: string
  code: string
  city: string
}

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, universityName }: { isOpen: boolean; onClose: () => void; universityName: string }) => {
  if (!isOpen) {return null}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={() => void onClose()}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Account Created Successfully!</h3>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-800 mb-1">Pending Approval</p>
                <p className="text-xs text-amber-700">
                  Your account is awaiting approval from the {universityName} manager. 
                  You'll receive an email confirmation once approved.
                </p>
              </div>
            </div>
          </div>
          
          <ButtonPress
            onClick={() => void onClose()}
            className="w-full btn-primary"
          >
            Go to Sign In
          </ButtonPress>
        </div>
      </div>
    </div>
  )
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
  const router = useRouter()
  const { data: session, status } = useSession()
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
  const [universitiesLoading, setUniversitiesLoading] = useState(true) // Add loading state
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [phoneError, setPhoneError] = useState('')
  
  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      switch (session.user.role) {
        case 'ADMIN':
        case 'MANAGER':
          router.replace('/admin')
          break
        case 'STUDENT':
          router.replace('/student')
          break
        default:
          router.replace('/')
      }
    }
  }, [session, status, router])
  
  // Optimized university fetching with caching
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setUniversitiesLoading(true)
        
        // Always fetch fresh data - no caching
        const response = await fetch('/api/public/universities', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          setUniversities(data.universities)
        } else {
          console.error('Failed to fetch universities:', data.error)
        }
      } catch (error) {
        console.error('Error fetching universities:', error)
      } finally {
        setUniversitiesLoading(false)
      }
    }
    
    void fetchUniversities()
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
        setShowSuccessModal(true)
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

  const handleModalClose = () => {
    setShowSuccessModal(false)
    router.push('/auth/signin')
  }

  const getSelectedUniversityName = () => {
    const university = universities.find(u => u.id === formData.universityId)
    return university?.name || 'your university'
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-4">
            <div className="absolute inset-0 w-8 h-8 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-green-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render form if already authenticated
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 w-12 h-12 border-4 border-green-200 rounded-full"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <>
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
            <div className="text-center mb-6">
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

            {/* Approval Notice - Moved to top */}
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800 text-center">
                <strong>Account requires manager approval</strong> before you can sign in
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* University Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  University
                </label>
                               {universitiesLoading ? (
                   <div className="flex items-center justify-center py-6 bg-green-50 rounded-xl border border-green-100">
                     <div className="relative w-8 h-8">
                       <div className="absolute inset-0 w-8 h-8 border-4 border-green-200 rounded-full"></div>
                       <div className="absolute inset-0 w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                     <span className="ml-3 text-green-700 font-medium">Loading universities...</span>
                   </div>
                 ) : (
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
                        {university.name} - {university.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Personal Information */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="your-email@university.edu"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`input ${phoneError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="+91 9876543210 or +84 987654321"
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                )}
              </div>

              {/* Student Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="ST123456"
                  />
                </div>

                <div>
                  <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Room Number
                  </label>
                  <input
                    id="roomNumber"
                    name="roomNumber"
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="A-101"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input pr-12"
                    placeholder="Create a strong password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <ButtonPress
                type="submit"
                disabled={loading || !!phoneError}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="relative w-5 h-5 mx-auto">
                    <div className="absolute inset-0 w-5 h-5 border-2 border-white border-opacity-25 rounded-full"></div>
                    <div className="absolute inset-0 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Student Account
                  </div>
                )}
              </ButtonPress>
            </form>

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

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleModalClose}
        universityName={getSelectedUniversityName()}
      />
    </>
  )
} 