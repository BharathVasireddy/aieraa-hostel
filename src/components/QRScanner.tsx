'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, CameraOff, Check, CheckCircle, Clock, MapPin, Scan, User, X, XCircle } from 'lucide-react'

interface QRScannerProps {
  onScanSuccess: (data: OrderQRData) => void
  onScanError: (error: string) => void
  className?: string
}

interface OrderQRData {
  type: string
  orderId: string
  orderNumber: string
  studentName: string
  pickupLocation: string
  timestamp: string
  verifyUrl: string
}

export default function QRScanner({ onScanSuccess, onScanError, className = '' }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [lastScanResult, setLastScanResult] = useState<OrderQRData | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setDevices(videoDevices)
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId)
        }
      } catch (error) {
        // Handle error silently
      }
    }
    getDevices()
  }, [])

  // Request camera permission
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          deviceId: selectedDevice || undefined,
          facingMode: 'environment' // Prefer back camera
        } 
      })
      setHasPermission(true)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setHasPermission(false)
      onScanError('Camera permission denied. Please allow camera access.')
    }
  }

  // Stop camera stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Start scanning
  const startScanning = async () => {
    if (!hasPermission) {
      await requestPermission()
    }
    setIsScanning(true)
    setScanStatus('scanning')
    
    // Start QR scanning (simplified approach)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  // Simulate QR code reading (replace with actual QR scanner library)
  const simulateQRScan = (testData?: string) => {
    try {
      const qrData = testData || JSON.stringify({
        type: 'order_pickup',
        orderId: 'test-order-123',
        orderNumber: 'ORD-2024-001',
        studentName: 'John Doe',
        pickupLocation: 'Main Hostel Counter',
        timestamp: new Date().toISOString(),
        verifyUrl: `${window.location.origin}/admin/orders/test-order-123/verify`
      })
      
      const parsedData: OrderQRData = JSON.parse(qrData)
      
      if (parsedData.type !== 'order_pickup') {
        throw new Error('Invalid QR code type')
      }
      
      setLastScanResult(parsedData)
      setScanStatus('success')
      onScanSuccess(parsedData)
      
    } catch (error) {
      setScanStatus('error')
      onScanError(error instanceof Error ? error.message : 'Invalid QR code')
    }
  }

  // Manual text input for QR data (fallback)
  const [manualInput, setManualInput] = useState('')

  const processManualInput = () => {
    if (manualInput.trim()) {
      simulateQRScan(manualInput.trim())
    }
  }

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-lg ${className}`}>
        {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Scan className="text-green-600" size={20} />
          Order Pickup Scanner
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Scan QR code to verify order pickup
        </p>
          </div>

      {/* Camera Section */}
      <div className="p-4">
        {/* Camera Permission */}
        {hasPermission === null && (
          <div className="text-center">
            <Camera className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-gray-600 mb-4">Camera access required for scanning</p>
          <button
              onClick={() => void requestPermission()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
              Enable Camera
          </button>
        </div>
        )}

        {hasPermission === false && (
          <div className="text-center">
            <CameraOff className="mx-auto text-red-400 mb-2" size={48} />
            <p className="text-red-600 mb-4">Camera access denied</p>
            <p className="text-sm text-gray-600">Please enable camera in browser settings</p>
              </div>
        )}

        {/* Camera View */}
        {hasPermission && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-500 w-48 h-48 rounded-lg animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-2">
              {!isScanning ? (
                <button
                  onClick={() => void startScanning()}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Camera size={16} />
                  Start Scanning
                </button>
              ) : (
                <button
                  onClick={() => void stopStream()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <CameraOff size={16} />
                  Stop Scanning
                </button>
              )}
              
              {/* Test Scan Button */}
                <button
                onClick={() => simulateQRScan()}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                title="Test with sample QR"
                >
                Test
                </button>
            </div>

            {/* Device Selection */}
            {devices.length > 1 && (
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Manual Input Fallback */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manual QR Data Input (Fallback)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste QR code data here..."
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => void processManualInput()}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
            >
              Process
            </button>
                    </div>
                  </div>
                </div>

      {/* Scan Result */}
      {lastScanResult && (
        <div className="p-4 border-t border-gray-200">
          <div className={`p-3 rounded-lg ${
            scanStatus === 'success' ? 'bg-green-50 border border-green-200' : 
            scanStatus === 'error' ? 'bg-red-50 border border-red-200' : 
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-start gap-3">
              {scanStatus === 'success' ? (
                <CheckCircle className="text-green-600 mt-0.5" size={16} />
              ) : (
                <XCircle className="text-red-600 mt-0.5" size={16} />
              )}
              
              <div className="flex-1 space-y-2">
                <h4 className="font-medium text-gray-900">
                  Order #{lastScanResult.orderNumber}
                </h4>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{lastScanResult.studentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{lastScanResult.pickupLocation}</span>
                    </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{new Date(lastScanResult.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          )}

      {/* Scanning Status */}
      {scanStatus === 'scanning' && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm">Scanning for QR code...</span>
          </div>
        </div>
      )}
    </div>
  )
} 