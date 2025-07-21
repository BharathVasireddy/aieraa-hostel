'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PromotionalBanner {
  id: string
  title: string
  image: string
  actionType: string
  actionValue?: string
  order: number
}

interface PromotionalSliderProps {
  universityId: string
}

export default function PromotionalSlider({ universityId }: PromotionalSliderProps) {
  const [banners, setBanners] = useState<PromotionalBanner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch promotional banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/student/promotional-banners?universityId=${universityId}`)
        const data = await response.json()
        
        if (data.success && data.banners) {
          setBanners(data.banners)
        }
      } catch (error) {
        console.error('Failed to fetch promotional banners:', error)
      } finally {
        setLoading(false)
      }
    }

    if (universityId) {
      fetchBanners()
    }
  }, [universityId])

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Auto-slide every 5 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    )
  }, [banners.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    )
  }, [banners.length])

  const handleBannerClick = useCallback((banner: PromotionalBanner) => {
    // Only handle URL links - open in new tab
    if (banner.actionType === 'url' && banner.actionValue) {
      window.open(banner.actionValue, '_blank', 'noopener,noreferrer')
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-4 mb-6">
        <div className="bg-gray-200 rounded-2xl h-40 animate-pulse"></div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null // Don't show anything if no banners
  }

  const currentBanner = banners[currentIndex]

  return (
    <div className="mx-4 mb-6">
      <div className="relative">
        {/* Main Banner - Simple Image Only */}
        <div 
          className={`rounded-2xl overflow-hidden h-40 relative transition-transform duration-200 active:scale-[0.98] ${
            currentBanner.actionValue ? 'cursor-pointer' : ''
          }`}
          onClick={() => handleBannerClick(currentBanner)}
        >
          {currentBanner.image && (
            <img 
              src={currentBanner.image} 
              alt={currentBanner.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="flex justify-center space-x-2 mt-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-green-600 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 