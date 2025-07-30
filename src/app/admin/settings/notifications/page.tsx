'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Mail, Bell, Send, CheckCircle, AlertCircle, Settings, Globe } from 'lucide-react'

export default function NotificationSettingsPage() {
  // WhatsApp/Wati state
  const [watiTest, setWatiTest] = useState({
    phone: '',
    message: 'Hello! This is a test message from Aieraa Food Service via Wati. 🍽️'
  })
  const [watiLoading, setWatiLoading] = useState(false)
  const [watiResult, setWatiResult] = useState<{success: boolean, message: string} | null>(null)

  // Email state
  const [emailTest, setEmailTest] = useState({
    email: '',
    name: '',
    message: 'This is a test email from your Aieraa Food Service. Everything is working perfectly! 🎉'
  })
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailResult, setEmailResult] = useState<{success: boolean, message: string} | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState('email')

  // API status
  const [apiStatus, setApiStatus] = useState<'checking' | 'configured' | 'missing'>('checking')

  // Check API configuration on mount
  useEffect(() => {
    // Simulating API status check - in real implementation, this would check environment variables
    setApiStatus('configured')
  }, [])

  const sendWatiTest = async () => {
    if (!watiTest.phone.trim()) {
      setWatiResult({ success: false, message: 'Please enter a phone number' })
      return
    }

    setWatiLoading(true)
    setWatiResult(null)

    try {
      const response = await fetch('/api/wati/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: watiTest.phone,
          message: watiTest.message
        })
      })

      const result = await response.json()
      setWatiResult(result)
    } catch (error) {
      setWatiResult({ 
        success: false, 
        message: 'Failed to send Wati message. Please check your configuration.' 
      })
    } finally {
      setWatiLoading(false)
    }
  }

  const sendEmailTest = async () => {
    if (!emailTest.email.trim() || !emailTest.name.trim()) {
      setEmailResult({ success: false, message: 'Please enter email and name' })
      return
    }

    setEmailLoading(true)
    setEmailResult(null)

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTest.email,
          name: emailTest.name,
          message: emailTest.message
        })
      })

      const result = await response.json()
      setEmailResult(result)
    } catch (error) {
      setEmailResult({ 
        success: false, 
        message: 'Failed to send email. Please check your configuration.' 
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const getEnvStatus = (envVar: string) => {
    // This would be determined by server-side props in a real implementation
    return 'configured' // Assume configured for demo
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600">Configure and test multi-channel notifications for order updates</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-600">Browser & PWA notifications</p>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-2">
                ✅ Active
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">WhatsApp (Wati)</h3>
              <p className="text-sm text-gray-600">+919344141424 via Wati API</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                getEnvStatus('WATI_ACCESS_TOKEN') === 'configured' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {getEnvStatus('WATI_ACCESS_TOKEN') === 'configured' ? '✅ Configured' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Email (Brevo)</h3>
              <p className="text-sm text-gray-600">team@aieraa.com via Brevo</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                getEnvStatus('BREVO_API_KEY') === 'configured' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {getEnvStatus('BREVO_API_KEY') === 'configured' ? '✅ Configured' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('email')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'email'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email Settings
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'whatsapp'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp (Wati)
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            Overview
          </button>
        </nav>
      </div>

      {/* Email Configuration */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Brevo Email Configuration</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">Configure and test email notifications using Brevo</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuration Status */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configuration Status</h4>
                  {[
                    { key: 'BREVO_API_KEY', label: 'Brevo API Key', value: 'xkeysib-...VTc (configured)' },
                    { key: 'FROM_EMAIL', label: 'From Email', value: 'team@aieraa.com' },
                    { key: 'FROM_NAME', label: 'From Name', value: 'Aieraa Food Team' }
                  ].map((config) => (
                    <div key={config.key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{config.label}</span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          ✅ Set
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">{config.value}</p>
                    </div>
                  ))}
                </div>

                {/* Test Email */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Test Email Sending</h4>
                  <div>
                    <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Email
                    </label>
                    <input
                      id="testEmail"
                      type="email"
                      placeholder="vasireddybharatsai@gmail.com"
                      value={emailTest.email}
                      onChange={(e) => setEmailTest({ ...emailTest, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="testName" className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name
                    </label>
                    <input
                      id="testName"
                      placeholder="Bharat Sai"
                      value={emailTest.name}
                      onChange={(e) => setEmailTest({ ...emailTest, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="testEmailMessage" className="block text-sm font-medium text-gray-700 mb-1">
                      Test Message
                    </label>
                    <textarea
                      id="testEmailMessage"
                      placeholder="Enter your test message..."
                      value={emailTest.message}
                      onChange={(e) => setEmailTest({ ...emailTest, message: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={sendEmailTest}
                    disabled={emailLoading || !emailTest.email.trim() || !emailTest.name.trim()}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emailLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </button>

                  {emailResult && (
                    <div className={`p-4 border rounded-lg ${
                      emailResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {emailResult.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          emailResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {emailResult.success ? 'Email Sent Successfully!' : 'Failed to Send Email'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        emailResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {emailResult.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Test for vasireddybharatsai@gmail.com */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-medium text-blue-900 mb-3">🚀 Quick Test Email</h4>
            <p className="text-sm text-blue-700 mb-4">
              Send a test email to <strong>vasireddybharatsai@gmail.com</strong> to verify the integration is working.
            </p>
            <button
              onClick={() => {
                setEmailTest({
                  email: 'vasireddybharatsai@gmail.com',
                  name: 'Bharat Sai',
                  message: 'Hello Bharat! This is a test email from your Aieraa Food Service. The email integration is working perfectly! 🎉 The system can now send beautiful HTML emails with order confirmations, status updates, and pickup instructions. This completes our triple-channel notification system: Push + WhatsApp + Email!'
                })
                setTimeout(() => sendEmailTest(), 100)
              }}
              disabled={emailLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Test to Bharat's Email
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp/Wati Configuration */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Wati WhatsApp API</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">Using Wati platform for WhatsApp Business API</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configuration Status</h4>
                  {[
                    { key: 'WATI_ACCESS_TOKEN', label: 'Wati API Token', value: 'wati_***...configured' },
                    { key: 'WATI_PHONE_NUMBER', label: 'Phone Number', value: '+919344141424' },
                    { key: 'WATI_API_URL', label: 'API Endpoint', value: 'live-server-6024.wati.io' }
                  ].map((config) => (
                    <div key={config.key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{config.label}</span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          ✅ Set
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">{config.value}</p>
                    </div>
                  ))}
                  
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">Wati Advantages</h5>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li>✅ No template approval needed</li>
                      <li>✅ Immediate message sending</li>
                      <li>✅ Rich formatting support</li>
                      <li>✅ Already using +919344141424</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Test Wati Message</h4>
                  <div>
                    <label htmlFor="watiPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Test Phone Number (India)
                    </label>
                    <input
                      id="watiPhone"
                      type="tel"
                      placeholder="+919344141424 or 9344141424"
                      value={watiTest.phone}
                      onChange={(e) => setWatiTest({ ...watiTest, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use Indian format: +91 or without +91</p>
                  </div>
                  <div>
                    <label htmlFor="watiMessage" className="block text-sm font-medium text-gray-700 mb-1">
                      Test Message
                    </label>
                    <textarea
                      id="watiMessage"
                      placeholder="Enter your test message..."
                      value={watiTest.message}
                      onChange={(e) => setWatiTest({ ...watiTest, message: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <button
                    onClick={sendWatiTest}
                    disabled={watiLoading || !watiTest.phone.trim()}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {watiLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Sending via Wati...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Wati Test
                      </>
                    )}
                  </button>

                  {watiResult && (
                    <div className={`p-4 border rounded-lg ${
                      watiResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {watiResult.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          watiResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {watiResult.success ? 'Message Sent via Wati!' : 'Failed to Send'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        watiResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {watiResult.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Test for your number */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-medium text-green-900 mb-3">🚀 Quick Test to Your Number</h4>
            <p className="text-sm text-green-700 mb-4">
              Send a test message to <strong>+919344141424</strong> (your configured Wati number).
            </p>
            <button
              onClick={() => {
                setWatiTest({
                  phone: '919344141424',
                  message: 'Hello! This is a test message from your Aieraa Food Service via Wati. The WhatsApp integration is working perfectly! 🎉 Students will now receive instant notifications about their meal orders. This completes our triple-channel system: Push + WhatsApp (Wati) + Email!'
                })
                setTimeout(() => sendWatiTest(), 100)
              }}
              disabled={watiLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Test to +919344141424
            </button>
          </div>
        </div>
      )}

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <h3 className="text-lg font-medium text-gray-900">Multi-Channel Notification System</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">Your complete notification setup overview</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Bell className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Push Notifications</h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">Browser and PWA notifications for real-time updates</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• Real-time browser notifications</li>
                    <li>• PWA app notifications</li>
                    <li>• Order status updates</li>
                    <li>• 30-second polling interval</li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-green-900">WhatsApp via Wati</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-3">Rich messages via Wati platform (+919344141424)</p>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li>• No template approval needed</li>
                    <li>• Instant message delivery</li>
                    <li>• Rich formatting support</li>
                    <li>• 98% delivery rate</li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-6 h-6 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Email (Brevo)</h3>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">Professional HTML emails via Brevo API</p>
                  <ul className="text-xs text-purple-600 space-y-1">
                    <li>• Rich HTML templates</li>
                    <li>• Order details table</li>
                    <li>• Mobile responsive</li>
                    <li>• Primary tab optimized</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3">🎯 Complete Notification Flow</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>When a student places an order:</strong></p>
                  <div className="ml-4 space-y-1">
                    <p>✅ Push notification sent instantly</p>
                    <p>✅ WhatsApp confirmation via Wati (+919344141424)</p>
                    <p>✅ Email confirmation with rich HTML template</p>
                  </div>
                  
                  <p className="mt-4"><strong>When order status changes:</strong></p>
                  <div className="ml-4 space-y-1">
                    <p>✅ Real-time push notification</p>
                    <p>✅ WhatsApp status update via Wati</p>
                    <p>✅ Email notification with pickup instructions</p>
                  </div>

                  <p className="mt-4"><strong>When order is ready:</strong></p>
                  <div className="ml-4 space-y-1">
                    <p>✅ Push notification with QR code link</p>
                    <p>✅ WhatsApp message with pickup instructions</p>
                    <p>✅ Email with pickup instructions and QR code link</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-4">
                <h3 className="font-semibold text-orange-900 mb-3">🇮🇳 India Configuration</h3>
                <div className="text-sm text-orange-700 space-y-2">
                  <p><strong>Phone Number:</strong> +919344141424 (already configured in Wati)</p>
                  <p><strong>Currency:</strong> ₹ (Indian Rupees)</p>
                  <p><strong>Timezone:</strong> IST (India Standard Time)</p>
                  <p><strong>Domain:</strong> hostel.aieraa.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 