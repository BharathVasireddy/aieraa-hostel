'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, QrCode, Camera, Smartphone, AlertCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  isOpen: boolean
}

export default function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    console.log('Cleaning up camera resources...')
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      setStream(null)
    }
    
    // Find video element by ID and clean it up
    const video = document.getElementById('qr-scanner-video') as HTMLVideoElement
    if (video) {
      video.srcObject = null
    }
    
    setIsVideoReady(false)
    setIsLoading(false)
    setError('')
  }, [stream])

  const startCamera = useCallback(async () => {
    console.log('Starting camera...')
    setIsLoading(true)
    setError('')
    setIsVideoReady(false)

    try {
      // Clean up any existing streams first
      cleanup()

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 300))

      // Find video element by ID
      const video = document.getElementById('qr-scanner-video') as HTMLVideoElement
      if (!video) {
        throw new Error('Video element not found in DOM')
      }

      console.log('Video element found, requesting camera permission...')
      
      // Simple constraints that work on most devices
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      console.log('Camera permission granted, setting up video...')
      setStream(mediaStream)
      
      // Set up video element
      video.srcObject = mediaStream
      video.autoplay = true
      video.playsInline = true
      video.muted = true

      // Wait for video to be ready and play
      const setupVideo = () => {
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video setup timeout'))
          }, 10000)

          const onLoadedMetadata = () => {
            console.log('Video metadata loaded')
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
            clearTimeout(timeout)
            
            // Try to play
            video.play()
              .then(() => {
                console.log('Video playing successfully!')
                setIsVideoReady(true)
                setIsLoading(false)
                resolve()
              })
              .catch((playError) => {
                console.error('Video play failed:', playError)
                reject(new Error('Video play failed'))
              })
          }

          const onError = (e: Event) => {
            console.error('Video error:', e)
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
            clearTimeout(timeout)
            reject(new Error('Video failed to load'))
          }

          video.addEventListener('loadedmetadata', onLoadedMetadata)
          video.addEventListener('error', onError)
        })
      }

      await setupVideo()

    } catch (err: any) {
      console.error('Camera error:', err)
      setIsLoading(false)
      
      let errorMessage = 'Failed to access camera'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another app.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }, [cleanup])

  useEffect(() => {
    if (isOpen) {
      // Ensure component is mounted before starting camera
      const timer = setTimeout(startCamera, 500)
      return () => clearTimeout(timer)
    } else {
      cleanup()
    }
  }, [isOpen, startCamera, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const handleManualInput = () => {
    const input = prompt('Enter Order ID:')?.trim()
    if (input) {
      // Create proper QR data format
      const qrData = JSON.stringify({
        orderId: input,
        orderNumber: input,
        type: 'order'
      })
      onScan(qrData)
      onClose()
    }
  }

  const handleRetry = () => {
    cleanup()
    setTimeout(startCamera, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">QR Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {error ? (
            // Error State
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h4 className="text-lg font-semibold text-red-600 mb-2">Camera Error</h4>
                <p className="text-gray-600 text-sm mb-6">{error}</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={handleManualInput}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Enter Order ID</span>
                </button>
              </div>
            </div>
          ) : isLoading ? (
            // Loading State
            <div className="text-center py-12 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <Camera className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800 mb-1">Starting Camera</p>
                <p className="text-gray-500 text-sm">Please allow camera access when prompted</p>
              </div>
              
              {/* Add manual input option during loading too */}
              <div className="pt-4">
                <button
                  onClick={handleManualInput}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Enter Order ID Instead
                </button>
              </div>
            </div>
          ) : isVideoReady ? (
            // Camera Active State
            <div className="space-y-4">
              {/* Video Container */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  id="qr-scanner-video"
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Scanning Frame */}
                    <div className="w-48 h-48 relative">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                      
                      {/* Animated scanning line */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div 
                          className="absolute w-full h-1 bg-green-400 opacity-75 rounded-full"
                          style={{
                            top: '50%',
                            animation: 'scanLine 2s ease-in-out infinite'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black/75 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Position QR code in frame</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm text-center">
                    <strong>Camera is active!</strong> Hold the QR code steady within the green frame.
                  </p>
                </div>
                
                <button
                  onClick={handleManualInput}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Enter Order ID Manually
                </button>
              </div>
            </div>
          ) : (
            // Initial/Preparing State
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Preparing camera...</p>
              <button
                onClick={handleManualInput}
                className="mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Enter Order ID Instead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  )
} 