'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PromotionalBanner {
  id: string
  title: string
  description?: string
  image: string
  actionType: string
  actionValue?: string
  buttonText?: string
  discountPercentage?: number
  offerValidUntil?: string
  backgroundColor: string
  textColor: string
  order: number
}

interface PromotionalSliderProps {
  universityId: string
}

export default function PromotionalSlider({ universityId }: PromotionalSliderProps) {
  const [banners, setBanners] = useState<PromotionalBanner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

  const handleBannerAction = useCallback((banner: PromotionalBanner) => {
    if (!banner.actionType || banner.actionType === 'none') return

    switch (banner.actionType) {
      case 'menu':
        router.push('/student/menu')
        break
      case 'category':
        if (banner.actionValue) {
          localStorage.setItem('selectedCategory', banner.actionValue)
          router.push('/student/menu')
        }
        break
      case 'url':
        if (banner.actionValue) {
          window.open(banner.actionValue, '_blank', 'noopener,noreferrer')
        }
        break
      case 'search':
        if (banner.actionValue) {
          localStorage.setItem('searchQuery', banner.actionValue)
          router.push('/student/menu')
        }
        break
      default:
        break
    }
  }, [router])

  const formatOfferText = useCallback((banner: PromotionalBanner) => {
    if (banner.discountPercentage) {
      return `${banner.discountPercentage}% OFF`
    }
    return banner.buttonText || 'Get Now'
  }, [])

  const isOfferValid = useCallback((banner: PromotionalBanner) => {
    if (!banner.offerValidUntil) return true
    return new Date(banner.offerValidUntil) > new Date()
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
        {/* Main Banner */}
        <div 
          className="rounded-2xl p-6 text-white relative overflow-hidden h-40 flex items-center cursor-pointer transition-transform duration-200 active:scale-[0.98]"
          style={{ 
            backgroundColor: currentBanner.backgroundColor,
            color: currentBanner.textColor 
          }}
          onClick={() => handleBannerAction(currentBanner)}
        >
          {/* Background Image */}
          {currentBanner.image && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <img 
                src={currentBanner.image} 
                alt={currentBanner.title}
                className="w-full h-full object-cover opacity-20"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="max-w-[60%]">
              <h3 className="text-lg font-bold mb-2">{currentBanner.title}</h3>
              {currentBanner.description && (
                <p className="text-sm opacity-90 mb-3 line-clamp-2">
                  {currentBanner.description}
                </p>
              )}
              
              {/* Offer Badge */}
              {currentBanner.discountPercentage && isOfferValid(currentBanner) && (
                <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold mb-3">
                  {currentBanner.discountPercentage}% OFF
                </div>
              )}
              
              {/* Validity */}
              {currentBanner.offerValidUntil && isOfferValid(currentBanner) && (
                <p className="text-xs opacity-80 mb-3">
                  Valid until {new Date(currentBanner.offerValidUntil).toLocaleDateString()}
                </p>
              )}
              
              {/* Action Button */}
              {currentBanner.actionType !== 'none' && (
                <button 
                  className="bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 px-4 py-2 rounded-xl text-sm font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBannerAction(currentBanner)
                  }}
                >
                  <span>{formatOfferText(currentBanner)}</span>
                  {currentBanner.actionType === 'url' && (
                    <ExternalLink className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Decorative Image */}
          {currentBanner.image && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-xl overflow-hidden shadow-lg">
              <img 
                src={currentBanner.image} 
                alt={currentBanner.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
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