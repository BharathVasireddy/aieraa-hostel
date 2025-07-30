'use client'

import { useState, useEffect, useCallback } from 'react'

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
      void fetchBanners()
    }
  }, [universityId])

  const handleBannerClick = useCallback((banner: PromotionalBanner) => {
    // Only handle URL links - open in new tab
    if (banner.actionType === 'url' && banner.actionValue) {
      window.open(banner.actionValue, '_blank', 'noopener,noreferrer')
    }
  }, [])

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex space-x-4 px-4 overflow-hidden">
          <div className="bg-gray-200 rounded-2xl h-40 w-80 flex-shrink-0 animate-pulse"></div>
          <div className="bg-gray-200 rounded-2xl h-40 w-80 flex-shrink-0 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null // Don't show anything if no banners
  }

  return (
    <div className="mb-6">
      {/* Horizontal Scrollable Banners */}
      <div className="flex space-x-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`rounded-2xl overflow-hidden h-40 w-80 flex-shrink-0 relative transition-transform duration-200 active:scale-[0.98] snap-start ${
              banner.actionValue ? 'cursor-pointer' : ''
            }`}
            onClick={() => handleBannerClick(banner)}
          >
            {banner.image && (
              <img 
                src={banner.image} 
                alt={banner.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 