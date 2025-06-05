'use client'

import { useState, useRef, useEffect } from 'react'
import { X, CameraOff, QrCode, Camera } from 'lucide-react'

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
  const [codeReader, setCodeReader] = useState<any>(null)

  // Initialize ZXing code reader
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      import('@zxing/library').then((ZXing) => {
        const reader = new ZXing.BrowserMultiFormatReader()
        setCodeReader(reader)
      }).catch(() => {
        console.log('ZXing library not available, using fallback')
      })
    }

    return () => {
      if (codeReader) {
        codeReader.reset()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      initializeCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const initializeCamera = async () => {
    try {
      setError('')
      setHasPermission(null)
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Check if device has camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      // Request camera with mobile-optimized constraints
      const constraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 640, max: 1920 },
          height: { ideal: 480, max: 1080 },
          aspectRatio: { ideal: 4/3 }
        },
        audio: false
      }

      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('Camera access granted')
      setHasPermission(true)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        
        // Wait for video to load
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve
          }
        })

        await videoRef.current.play()
        setIsScanning(true)
        
        // Start QR scanning
        startQRDetection()
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setHasPermission(false)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access and refresh the page.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is being used by another application.')
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        setError('Camera does not support the required constraints.')
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }

  const stopCamera = () => {
    setIsScanning(false)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (codeReader) {
      codeReader.reset()
    }
    
    setHasPermission(null)
  }

  const startQRDetection = async () => {
    if (!videoRef.current || !isScanning) return

    try {
      if (codeReader) {
        // Use ZXing library for detection
        console.log('Starting ZXing QR detection...')
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: any, err: any) => {
          if (result) {
            console.log('QR Code detected:', result.text)
            onScan(result.text)
            stopCamera()
            onClose()
          }
        })
      } else {
        // Fallback to manual detection
        console.log('Using manual QR detection...')
        manualQRDetection()
      }
    } catch (error) {
      console.error('QR detection error:', error)
      // Continue trying
      setTimeout(startQRDetection, 1000)
    }
  }

  const manualQRDetection = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      setTimeout(manualQRDetection, 100)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Continue scanning
    setTimeout(manualQRDetection, 500)
  }

  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data for testing:')
    if (qrData) {
      onScan(qrData)
      onClose()
    }
  }

  const retryCamera = () => {
    setError('')
    setHasPermission(null)
    initializeCamera()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-sm mx-4 max-h-[90vh] flex flex-col">
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

        <div className="flex-1 p-4">
          {hasPermission === false ? (
            <div className="text-center py-8">
              <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 text-sm">{error}</p>
              <button
                onClick={retryCamera}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Retry Camera
              </button>
            </div>
          ) : hasPermission === null ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Starting camera...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning Frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                    
                    {/* Scanning line animation */}
                    {isScanning && (
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute w-full h-0.5 bg-green-400 animate-pulse" 
                             style={{
                               top: '50%',
                               animation: 'scan 2s linear infinite'
                             }}>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                {isScanning && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <QrCode className="w-4 h-4 text-green-400" />
                        <span className="text-sm">Scanning for QR codes...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">
                  Position the QR code within the frame
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

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  )
} 