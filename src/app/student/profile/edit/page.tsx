'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Mail, Check, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  roomNumber?: string;
  university?: {
    name: string;
    code: string;
  };
}

export default function EditProfile() {
  const { data: session } = useSession();
  const router = useRouter();

  // Form state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
  });

  // Phone verification state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [currentPhoneOtp, setCurrentPhoneOtp] = useState('');
  const [newPhoneOtp, setNewPhoneOtp] = useState('');
  const [verificationStep, setVerificationStep] = useState<
    'current' | 'new' | 'complete'
  >('current');

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      void fetchUserData();
    }
  }, [session?.user?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${session?.user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setUserData(data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          roomNumber: data.user.roomNumber || '',
        });
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validate phone based on country code
  const isValidPhone = (phone: string, code: string) => {
    return code === '+91'
      ? phone.length === 10 && /^[6-9]\d{9}$/.test(phone)
      : phone.length === 9 && /^[1-9]\d{8}$/.test(phone);
  };

  // Send OTP to current phone number
  const sendCurrentPhoneOTP = async () => {
    if (!userData?.phone) {
      setError('No current phone number found');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userData.phone }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('OTP sent to your current phone number');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Send OTP to new phone number
  const sendNewPhoneOTP = async () => {
    if (!isValidPhone(newPhone, countryCode)) {
      setError(
        `Please enter a valid ${countryCode === '+91' ? 'Indian' : 'Vietnamese'} phone number`
      );
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const fullPhoneNumber = `${countryCode}${newPhone}`;
      const response = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('OTP sent to your new phone number');
        setVerificationStep('new');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify current phone OTP
  const verifyCurrentPhoneOTP = async () => {
    if (!userData?.phone || !currentPhoneOtp) {
      setError('Please enter the OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userData.phone,
          otp: currentPhoneOtp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Current phone verified! Now verify your new phone number.');
        setCurrentPhoneOtp('');
        await sendNewPhoneOTP();
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify new phone OTP and update profile
  const verifyNewPhoneOTP = async () => {
    if (!newPhone || !newPhoneOtp) {
      setError('Please enter the OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const fullPhoneNumber = `${countryCode}${newPhone}`;
      const response = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          otp: newPhoneOtp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the phone number in the profile
        setFormData(prev => ({ ...prev, phone: fullPhoneNumber }));
        setVerificationStep('complete');
        setSuccess('Phone number successfully verified and updated!');
        setIsEditingPhone(false);
        setNewPhone('');
        setNewPhoneOtp('');
        setCurrentPhoneOtp('');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/user/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setUserData(data.user);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Custom Header with Back Button */}
      <header className='sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3'>
        <div className='flex items-center'>
          <button
            onClick={() => router.push('/student/profile')}
            className='mr-3 p-2 -ml-2 rounded-lg hover:bg-gray-100'
          >
            <ArrowLeft className='h-5 w-5 text-gray-600' />
          </button>
          <h1 className='text-lg font-semibold text-gray-900'>Edit Profile</h1>
        </div>
      </header>

      <div className='px-4 pt-20 pb-32'>
        <div className='max-w-md mx-auto space-y-6'>
          {/* Error/Success Messages */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3'>
              <AlertCircle className='w-5 h-5 text-red-600 mt-0.5 flex-shrink-0' />
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          )}

          {success && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3'>
              <Check className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' />
              <p className='text-sm text-green-700'>{success}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className='bg-white rounded-xl p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Basic Information
            </h2>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Full Name
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  placeholder='Enter your full name'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Room Number
                </label>
                <input
                  type='text'
                  value={formData.roomNumber}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      roomNumber: e.target.value,
                    }))
                  }
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  placeholder='Enter your room number'
                />
              </div>
            </div>
          </div>

          {/* Email - Read Only */}
          <div className='bg-white rounded-xl p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Email Address
            </h2>
            <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
              <Mail className='w-5 h-5 text-gray-500' />
              <span className='text-gray-700'>{formData.email}</span>
              <span className='text-xs text-gray-500 ml-auto'>
                Cannot be changed
              </span>
            </div>
          </div>

          {/* Phone Number */}
          <div className='bg-white rounded-xl p-6 shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Phone Number
              </h2>
              {!isEditingPhone && (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className='text-green-600 hover:text-green-700 text-sm font-medium'
                >
                  Change
                </button>
              )}
            </div>

            {!isEditingPhone ? (
              <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
                <Phone className='w-5 h-5 text-gray-500' />
                <span className='text-gray-700'>
                  {formData.phone || 'No phone number set'}
                </span>
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Current Phone Verification */}
                {userData?.phone && verificationStep === 'current' && (
                  <div className='border border-amber-200 bg-amber-50 rounded-lg p-4'>
                    <p className='text-sm text-amber-800 mb-3'>
                      First, verify your current phone number: {userData.phone}
                    </p>
                    <div className='flex space-x-2'>
                      <input
                        type='text'
                        placeholder='Enter OTP'
                        value={currentPhoneOtp}
                        onChange={e => setCurrentPhoneOtp(e.target.value)}
                        className='flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500'
                        maxLength={6}
                      />
                      <button
                        onClick={verifyCurrentPhoneOTP}
                        disabled={otpLoading}
                        className='px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50'
                      >
                        {otpLoading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                    <button
                      onClick={sendCurrentPhoneOTP}
                      disabled={otpLoading}
                      className='text-sm text-amber-700 hover:text-amber-800 mt-2'
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

                {/* New Phone Input */}
                {(verificationStep === 'new' || !userData?.phone) && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      New Phone Number
                    </label>
                    <div className='flex space-x-2 mb-3'>
                      <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        className='px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white'
                      >
                        <option value='+91'>🇮🇳 +91</option>
                        <option value='+84'>🇻🇳 +84</option>
                      </select>
                      <input
                        type='tel'
                        value={newPhone}
                        onChange={e =>
                          setNewPhone(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder={
                          countryCode === '+91' ? '8885333635' : '123456789'
                        }
                        className='flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500'
                        maxLength={countryCode === '+91' ? 10 : 9}
                      />
                    </div>

                    {!userData?.phone && (
                      <button
                        onClick={sendNewPhoneOTP}
                        disabled={
                          otpLoading || !isValidPhone(newPhone, countryCode)
                        }
                        className='w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 mb-3'
                      >
                        {otpLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                )}

                {/* New Phone OTP Verification */}
                {verificationStep === 'new' && (
                  <div className='border border-green-200 bg-green-50 rounded-lg p-4'>
                    <p className='text-sm text-green-800 mb-3'>
                      Enter the OTP sent to {countryCode}
                      {newPhone}
                    </p>
                    <div className='flex space-x-2'>
                      <input
                        type='text'
                        placeholder='Enter OTP'
                        value={newPhoneOtp}
                        onChange={e => setNewPhoneOtp(e.target.value)}
                        className='flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500'
                        maxLength={6}
                      />
                      <button
                        onClick={verifyNewPhoneOTP}
                        disabled={otpLoading}
                        className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50'
                      >
                        {otpLoading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                    <button
                      onClick={sendNewPhoneOTP}
                      disabled={otpLoading}
                      className='text-sm text-green-700 hover:text-green-800 mt-2'
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

                {/* Cancel Phone Edit */}
                <button
                  onClick={() => {
                    setIsEditingPhone(false);
                    setNewPhone('');
                    setNewPhoneOtp('');
                    setCurrentPhoneOtp('');
                    setVerificationStep('current');
                    setError('');
                    setSuccess('');
                  }}
                  className='text-gray-600 hover:text-gray-800 text-sm'
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving || isEditingPhone}
            className='w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
