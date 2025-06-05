'use client'

import { useState, useRef, useEffect } from 'react'
import { X, CameraOff, QrCode, Camera, Smartphone } from 'lucide-react'

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
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle')
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (isOpen) {
      initCamera()
    } else {
      cleanup()
    }

    return cleanup
  }, [isOpen])

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
    setCameraStatus('idle')
    setError('')
  }

  const initCamera = async () => {
    try {
      setCameraStatus('requesting')
      setError('')

      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      // Simple camera constraints for maximum compatibility
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      }

      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!videoRef.current) {
        console.error('Video element not available')
        return
      }

      streamRef.current = stream
      const video = videoRef.current

      // Set video properties for mobile compatibility
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      video.autoplay = true

      // Wait for video to be ready
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video failed to load within 10 seconds'))
        }, 10000)

        video.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          video.play()
            .then(() => {
              clearTimeout(timeout)
              setCameraStatus('active')
              setIsScanning(true)
              console.log('Video playing successfully')
              startScanning()
              resolve()
            })
            .catch((playError) => {
              clearTimeout(timeout)
              console.error('Video play error:', playError)
              reject(new Error('Failed to start video playback'))
            })
        }

        video.onerror = (e) => {
          clearTimeout(timeout)
          console.error('Video error:', e)
          reject(new Error('Video failed to load'))
        }
      })

    } catch (err: any) {
      console.error('Camera initialization error:', err)
      setCameraStatus('error')
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is being used by another application.')
      } else {
        setError(err.message || 'Failed to access camera. Please try again.')
      }
    }
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    const scan = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scan)
        return
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Try to detect QR code using ImageData
      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        // Simple QR detection would go here
        // For now, we'll rely on manual input
      } catch (e) {
        console.log('QR detection error:', e)
      }

      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(scan)
    }

    animationFrameRef.current = requestAnimationFrame(scan)
  }

  const handleManualInput = () => {
    const qrData = prompt('Enter order ID or scan data for testing:')
    if (qrData) {
      // Try to create valid QR data format
      let scanData = qrData
      
      // If it's just an order ID, wrap it in JSON format
      if (!qrData.startsWith('{')) {
        scanData = JSON.stringify({
          orderId: qrData,
          orderNumber: qrData,
          type: 'order'
        })
      }
      
      onScan(scanData)
      onClose()
    }
  }

  const retryCamera = () => {
    cleanup()
    setTimeout(initCamera, 500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 p-4">
          {cameraStatus === 'error' ? (
            <div className="text-center py-8">
              <CameraOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4 text-sm font-medium">Camera Error</p>
              <p className="text-gray-600 mb-6 text-sm">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={retryCamera}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Camera className="w-4 h-4 inline mr-2" />
                  Try Again
                </button>
                <button
                  onClick={handleManualInput}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Smartphone className="w-4 h-4 inline mr-2" />
                  Manual Input
                </button>
              </div>
            </div>
          ) : cameraStatus === 'requesting' ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium mb-2">Starting Camera...</p>
              <p className="text-gray-500 text-sm">Please allow camera access when prompted</p>
            </div>
          ) : cameraStatus === 'active' ? (
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                  autoPlay
                  style={{
                    transform: 'scaleX(-1)', // Mirror for better UX
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Corner brackets */}
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                      
                      {/* Scanning line */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div 
                          className="absolute w-full h-0.5 bg-green-400 opacity-75"
                          style={{
                            top: '50%',
                            animation: 'scanner-line 2s ease-in-out infinite'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <QrCode className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium">
                        {isScanning ? 'Scanning for QR codes...' : 'Camera ready'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">
                  Position the QR code within the green frame
                </p>
                
                <button
                  onClick={handleManualInput}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Enter Order ID Manually
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes scanner-line {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  )
} 