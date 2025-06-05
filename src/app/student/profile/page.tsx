'use client'

import { useState, useEffect } from 'react'
import { User, HelpCircle, LogOut, Shield, Camera } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'

interface UserData {
  id: string
  name: string
  email: string
  studentId?: string
  roomNumber?: string
  university?: {
    name: string
    code: string
  }
  profileImage?: string
}

export default function StudentProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        // API returns { success: true, user: userData }
        setUserData(data.user || data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Upload to your storage service (implement based on your provider)
      // For now, create a mock URL
      const mockImageUrl = URL.createObjectURL(file)
      
      // Update user profile with new image
      const response = await fetch(`/api/user/${session?.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileImage: mockImageUrl
        })
      })

      if (response.ok) {
        setUserData(prev => prev ? { ...prev, profileImage: mockImageUrl } : null)
        alert('Profile image updated successfully!')
      } else {
        throw new Error('Failed to update profile image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditProfile = () => {
    setShowEditProfile(true)
  }

  const handlePrivacySecurity = () => {
    setShowPrivacySecurity(true)
  }

  const handleHelpSupport = () => {
    router.push('/student/help-support')
  }

  const handleAppRating = () => {
    // Open app store or show rating modal
    if (window.confirm('Would you like to rate our app? This will open your app store.')) {
      // In production, detect platform and open appropriate store
      window.open('https://play.google.com/store', '_blank')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/auth/signin'
      })
      router.push('/auth/signin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Profile" showNotifications={true} />
        <div className="px-4 py-4">
          <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Profile" 
        showNotifications={true}
      />

      <div className="px-4 py-4 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {userData?.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-3 h-3 text-white" />
                )}
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {userData?.name || 'Student Name'}
              </h2>
              <p className="text-sm text-gray-600">
                {userData?.studentId || 'Student ID: Loading...'}
              </p>
              <p className="text-sm text-gray-600">
                {userData?.roomNumber || 'Room: Not assigned'}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                {userData?.university?.name || 'University Name'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Account</h3>
          </div>
          
          <div className="space-y-0">
            <button 
              onClick={handleEditProfile}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Edit Profile</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button 
              onClick={handlePrivacySecurity}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Privacy & Security</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Support</h3>
          </div>
          
          <div className="space-y-0">
            <button 
              onClick={handleHelpSupport}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Help & Support</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button 
              onClick={handleAppRating}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⭐</span>
                <span className="text-gray-900">Rate Our App</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📱</span>
                <span className="text-gray-900">App Version</span>
              </div>
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-xl shadow-sm">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-red-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </div>
            <span className="text-red-400">›</span>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
} 