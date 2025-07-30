import React from 'react'
import QRCode from 'react-qr-code'
import { Check, Copy, Download } from 'lucide-react'
import { useState } from 'react'

interface QRCodeGeneratorProps {
  orderId: string
  orderNumber: string
  studentName: string
  pickupLocation?: string
  className?: string
  size?: number
  showDownload?: boolean
  showCopy?: boolean
}

export default function QRCodeGenerator({
  orderId,
  orderNumber,
  studentName,
  pickupLocation = 'Main Hostel Counter',
  className = '',
  size = 200,
  showDownload = true,
  showCopy = true
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)

  // QR Code data - comprehensive pickup information
  const qrData = JSON.stringify({
    type: 'order_pickup',
    orderId,
    orderNumber,
    studentName,
    pickupLocation,
    timestamp: new Date().toISOString(),
    verifyUrl: `${window.location.origin}/admin/orders/${orderId}/verify`
  })

  const downloadQR = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    // Create SVG from QR code
    const svg = document.querySelector(`#qr-${orderId}`)
    if (!svg) {return}
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    img.onload = () => {
      canvas.width = size + 100 // Add padding for text
      canvas.height = size + 150
      
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw QR code
        ctx.drawImage(img, 50, 50, size, size)
        
        // Add order info text
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`Order #${orderNumber}`, canvas.width / 2, 30)
        
        ctx.font = '14px Arial'
        ctx.fillText(studentName, canvas.width / 2, size + 80)
        ctx.fillText(pickupLocation, canvas.width / 2, size + 100)
        ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, canvas.width / 2, size + 120)
        
        // Download
        const link = document.createElement('a')
        link.download = `order-qr-${orderNumber}.png`
        link.href = canvas.toDataURL()
        link.click()
      }
      
      URL.revokeObjectURL(url)
    }
    
    img.src = url
  }

  const copyQRData = async () => {
    try {
      await navigator.clipboard.writeText(qrData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Handle copy error silently
    }
  }

  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-lg border ${className}`}>
      {/* QR Code Header */}
      <div className="text-center mb-4">
        <h3 className="font-semibold text-gray-900">Order Pickup QR</h3>
        <p className="text-sm text-gray-600">#{orderNumber}</p>
      </div>

      {/* QR Code */}
      <div className="p-4 bg-white rounded-lg border-2 border-gray-200 mb-4">
        <QRCode
          id={`qr-${orderId}`}
          value={qrData}
          size={size}
          level="M"
          className="block"
        />
      </div>

      {/* Order Details */}
      <div className="text-center text-sm text-gray-600 mb-4 space-y-1">
        <p><strong>Student:</strong> {studentName}</p>
        <p><strong>Pickup Location:</strong> {pickupLocation}</p>
        <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {showDownload && (
          <button
            onClick={downloadQR}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download size={16} />
            Download
          </button>
        )}
        
        {showCopy && (
          <button
            onClick={copyQRData}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Data'}
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 text-center">
        <p><strong>Instructions:</strong></p>
        <p>Show this QR code to hostel staff for order pickup verification</p>
      </div>
    </div>
  )
} 