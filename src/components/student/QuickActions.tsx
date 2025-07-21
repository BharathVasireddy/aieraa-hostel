import React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Utensils, Clock, Coffee } from 'lucide-react'

const QuickActions: React.FC = () => {
  const router = useRouter()

  const handleSearchClick = (query?: string) => {
    if (query) {
      localStorage.setItem('searchQuery', query)
    }
    router.push('/student/menu')
  }

  const handleQuickOrder = () => {
    router.push('/student/quick-order')
  }

  const handleViewAllOrders = () => {
    router.push('/student/orders')
  }

  const actions = [
    {
      icon: Search,
      label: 'Browse Menu',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: () => handleSearchClick()
    },
    {
      icon: Utensils,
      label: 'Quick Order',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      onClick: handleQuickOrder
    },
    {
      icon: Clock,
      label: 'My Orders',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      onClick: handleViewAllOrders
    },
    {
      icon: Coffee,
      label: 'Today\'s Specials',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      onClick: () => handleSearchClick('specials')
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-12 h-12 ${action.bgColor} rounded-full flex items-center justify-center`}>
              <action.icon className={`w-6 h-6 ${action.iconColor}`} />
            </div>
            <span className="font-medium text-gray-900">{action.label}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

export default QuickActions 