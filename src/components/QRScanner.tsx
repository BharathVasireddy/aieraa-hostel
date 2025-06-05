'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Camera, CameraOff, QrCode } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  isOpen: boolean
}

export default function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setError('')
      setHasPermission(null)
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        }
      })

      setHasPermission(true)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsScanning(true)
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setHasPermission(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }

  const stopCamera = () => {
    setIsScanning(false)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setHasPermission(null)
  }

  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data for testing:')
    if (qrData) {
      onScan(qrData)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          {hasPermission === false ? (
            <div className="text-center py-8">
              <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : hasPermission === null ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Starting camera...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Scanning Frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48 border-2 border-white rounded-lg">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                    
                    {/* Center target */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-white opacity-50" />
                    </div>
                  </div>
                </div>

                {/* Scanning indicator */}
                {isScanning && (
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm">Scanning for QR codes...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">
                  Position the QR code within the square frame
                </p>
                
                {/* Manual input for testing */}
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
    </div>
  )
} 