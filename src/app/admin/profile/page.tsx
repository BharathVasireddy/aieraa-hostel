'use client'

import { useState, useEffect } from 'react'
import { User, Shield, Camera, Eye, EyeOff, LogOut, Activity, Settings, Phone, Mail, MapPin, Calendar, Check, X, AlertTriangle, Save, Edit3 } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'
import { format } from 'date-fns'
import { cachedFetch } from '@/lib/cache'

interface ProfileData {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  profileImage?: string
  university?: {
    id: string
    name: string
    code: string
    city: string
    state: string
    country: string
    contactEmail: string
    contactPhone: string
  }
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export default function AdminProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile')
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false)
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Notifications
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchProfileData()
    }
  }, [session])

  useEffect(() => {
    // Handle tab parameter from URL
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && ['profile', 'security', 'activity'].includes(tab)) {
      setActiveTab(tab as 'profile' | 'security' | 'activity')
      if (tab === 'security') {
        setShowPasswordForm(true)
      }
    }
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const data = await cachedFetch('/api/admin/profile', {}, 10) // 10 minute cache
      if (data.profile) {
        setProfileData(data.profile)
        setEditForm({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || ''
        })
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      showNotification('error', 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Please select an image smaller than 5MB')
      return
    }

    setUploadingImage(true)
    
    try {
      // In a real app, you would upload to your file storage service
      // For now, we'll create a local object URL
      const imageUrl = URL.createObjectURL(file)
      
      // Update profile with new image
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          profileImage: imageUrl
        })
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(data.profile)
        showNotification('success', 'Profile picture updated successfully')
      } else {
        throw new Error('Failed to update profile picture')
      }
      
    } catch (error) {
      console.error('Error uploading image:', error)
      showNotification('error', 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!editForm.name || !editForm.email) {
      showNotification('error', 'Name and email are required')
      return
    }

    setProfileUpdateLoading(true)
    
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (response.ok) {
        setProfileData(data.profile)
        setIsEditing(false)
        showNotification('success', 'Profile updated successfully')
      } else {
        showNotification('error', data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification('error', 'Failed to update profile')
    } finally {
      setProfileUpdateLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showNotification('error', 'All password fields are required')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('error', 'New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showNotification('error', 'New password must be at least 6 characters long')
      return
    }

    setPasswordChangeLoading(true)
    
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordForm(false)
        showNotification('success', 'Password changed successfully')
      } else {
        showNotification('error', data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      showNotification('error', 'Failed to change password')
    } finally {
      setPasswordChangeLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await signOut({ callbackUrl: '/auth/signin' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load profile data</p>
          <button 
            onClick={fetchProfileData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-yellow-50 border border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <Check className="w-5 h-5" />}
              {notification.type === 'error' && <X className="w-5 h-5" />}
              {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            <div className="flex items-center gap-2 mt-1">
              {profileData.role === 'ADMIN' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👑 Super Admin
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🎯 University Manager
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {profileData.profileImage ? (
                  <img 
                    src={profileData.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {profileData.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
              <p className="text-gray-600 font-medium">{profileData.email}</p>
              {profileData.phone && (
                <p className="text-gray-500 text-sm">{profileData.phone}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  profileData.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {profileData.role}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  {profileData.status}
                </span>
              </div>
            </div>
          </div>

          {profileData.university && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">University Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Institution</p>
                  <p className="font-medium">{profileData.university.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Code</p>
                  <p className="font-medium">{profileData.university.code}</p>
                </div>
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium">{profileData.university.city}, {profileData.university.state}, {profileData.university.country}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contact</p>
                  <p className="font-medium">{profileData.university.contactEmail}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'security'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'activity'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Activity
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditForm({
                          name: profileData.name || '',
                          email: profileData.email || '',
                          phone: profileData.phone || ''
                        })
                        setIsEditing(false)
                      } else {
                        setIsEditing(true)
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={profileUpdateLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {profileUpdateLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Full Name</span>
                        </div>
                        <p className="text-gray-900 font-medium">{profileData.name}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">Email Address</span>
                        </div>
                        <p className="text-gray-900 font-medium">{profileData.email}</p>
                      </div>
                      {profileData.phone && (
                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">Phone Number</span>
                          </div>
                          <p className="text-gray-900 font-medium">{profileData.phone}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Account Type</span>
                        </div>
                        <p className="text-gray-900 font-medium">{profileData.role}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Member Since</span>
                        </div>
                        <p className="text-gray-900 font-medium">
                          {format(new Date(profileData.createdAt), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                      {profileData.lastLoginAt && (
                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm">Last Login</span>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {format(new Date(profileData.lastLoginAt), 'MMMM dd, yyyy h:mm a')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Password & Security</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Account Security</p>
                        <p className="text-sm text-gray-600">Your account is secured with a strong password</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>

                  {showPasswordForm && (
                    <div className="mt-6 p-4 border border-gray-200 rounded-lg space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePasswordChange}
                          disabled={passwordChangeLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {passwordChangeLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Update Password</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordForm(false)
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Account Activity</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Account Created</p>
                        <p className="text-sm text-gray-600">Your account was successfully created</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(profileData.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  {profileData.lastLoginAt && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Last Login</p>
                          <p className="text-sm text-gray-600">You signed in to your account</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(profileData.lastLoginAt), 'MMM dd, yyyy h:mm a')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Settings className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Profile Updated</p>
                        <p className="text-sm text-gray-600">Your profile information was last updated</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(profileData.updatedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-900">Logout</h3>
              <p className="text-red-700 text-sm mt-1">Sign out of your account securely</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
} 