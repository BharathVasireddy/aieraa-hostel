'use client'

import { ArrowLeft, MessageCircle, Phone, Mail, Book, Bug } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HelpSupport() {
  const router = useRouter()

  const supportOptions = [
    {
      icon: <MessageCircle className="w-6 h-6 text-blue-600" />,
      title: "Chat Support",
      description: "Get instant help from our support team",
      action: () => alert('Chat support would open a live chat window')
    },
    {
      icon: <Phone className="w-6 h-6 text-green-600" />,
      title: "Call Us",
      description: "Speak directly with our support team",
      action: () => window.open('tel:+911234567890')
    },
    {
      icon: <Mail className="w-6 h-6 text-purple-600" />,
      title: "Email Support",
      description: "Send us your questions via email",
      action: () => window.open('mailto:support@aieraa-hostel.com')
    },
    {
      icon: <Book className="w-6 h-6 text-orange-600" />,
      title: "FAQ",
      description: "Find answers to common questions",
      action: () => alert('FAQ section would show frequently asked questions')
    },
    {
      icon: <Bug className="w-6 h-6 text-red-600" />,
      title: "Report Issue",
      description: "Report a bug or technical problem",
      action: () => alert('Issue reporting form would open here')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Help & Support</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">How can we help you?</h2>
          <p className="text-blue-100">
            We&apos;re here to assist you with any questions or issues you might have
          </p>
        </div>

        {/* Support Options */}
        <div className="space-y-3">
          {supportOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.action}
              className="w-full bg-white rounded-xl p-4 flex items-center space-x-4 hover:shadow-md transition-all duration-200 border border-gray-100"
            >
              <div className="flex-shrink-0">
                {option.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">{option.title}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Support Hours</p>
              <p className="text-sm text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
              <p className="text-sm text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Emergency Contact</p>
              <p className="text-sm text-gray-600">For urgent issues: +91 9876543210</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 