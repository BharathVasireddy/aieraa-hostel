import React from 'react'
import { Clock } from 'lucide-react'
import { getOrderingCountdown } from '@/lib/timezone'

interface OrderingCountdownProps {
  selectedDate: string
}

const OrderingCountdown: React.FC<OrderingCountdownProps> = ({ selectedDate }) => {
  const countdown = getOrderingCountdown(selectedDate)

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <Clock className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Order Deadline</h3>
          <p className="text-sm text-gray-600">
            Orders close at 8:00 PM for next day delivery
          </p>
          <div className="mt-2">
            {!countdown.isPastCutoff ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-orange-600">
                  {countdown.hours}h {countdown.minutes}m remaining
                </span>
                <span className="text-xs text-gray-500">to order</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-red-600">
                Ordering closed for today
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderingCountdown 