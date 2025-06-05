'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Camera, CameraOff } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  isOpen: boolean
}

export default function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen && hasPermission === null) {
      requestCameraPermission()
    }
    
    if (isOpen && hasPermission) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isOpen, hasPermission])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      setHasPermission(true)
      setError('')
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      streamRef.current = stream
    } catch (err) {
      console.error('Camera permission denied:', err)
      setHasPermission(false)
      setError('Camera access is required to scan QR codes. Please enable camera permissions.')
    }
  }

  const startScanning = async () => {
    if (!streamRef.current || !videoRef.current) return

    try {
      setIsScanning(true)
      videoRef.current.srcObject = streamRef.current
      await videoRef.current.play()
      
      // Start scanning for QR codes
      scanForQRCode()
    } catch (err) {
      console.error('Error starting video:', err)
      setError('Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      setTimeout(scanForQRCode, 100)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Simple QR code detection (for demo purposes)
    // In production, you'd use a proper QR code library like @zxing/library
    try {
      // For now, let's simulate QR detection with a manual input
      // You can replace this with actual QR detection logic
      setTimeout(scanForQRCode, 100)
    } catch (err) {
      setTimeout(scanForQRCode, 100)
    }
  }

  const handleManualInput = () => {
    // For demo purposes, let's allow manual QR code input
    const qrData = prompt('Enter QR code data (for testing):')
    if (qrData) {
      onScan(qrData)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {hasPermission === false ? (
          <div className="text-center py-8">
            <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={requestCameraPermission}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enable Camera
            </button>
          </div>
        ) : hasPermission === null ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Requesting camera permission...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white rounded-lg w-48 h-48 relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-600">Position the QR code within the frame</p>
              {isScanning && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <div className="animate-pulse w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm">Scanning...</span>
                </div>
              )}
            </div>

            {/* Manual input for testing */}
            <div className="border-t pt-4">
              <button
                onClick={handleManualInput}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Manual Input (for testing)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 