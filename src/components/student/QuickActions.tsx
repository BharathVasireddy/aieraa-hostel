import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Utensils, Clock, Coffee, ChefHat, Star } from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  bgColor: string;
  iconColor: string;
  onClick: () => void;
}

const QuickActions: React.FC = () => {
  const router = useRouter();

  const handleSearchClick = (query?: string) => {
    if (query) {
      localStorage.setItem('searchQuery', query);
    }
    router.push('/student/menu');
  };

  const handleQuickOrder = () => {
    router.push('/student/quick-order');
  };

  const handleViewAllOrders = () => {
    router.push('/student/orders');
  };

  const actions: QuickAction[] = [
    {
      id: 'browse-menu',
      icon: Search,
      label: 'Browse Menu',
      description: 'Explore all dishes',
      bgColor: 'bg-info-50',
      iconColor: 'text-info-600',
      onClick: () => handleSearchClick(),
    },
    {
      id: 'quick-order',
      icon: Utensils,
      label: 'Quick Order',
      description: 'Reorder favorites',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      onClick: handleQuickOrder,
    },
    {
      id: 'my-orders',
      icon: Clock,
      label: 'My Orders',
      description: 'Track your orders',
      bgColor: 'bg-accent-purple/10',
      iconColor: 'text-purple-600',
      onClick: handleViewAllOrders,
    },
    {
      id: 'todays-specials',
      icon: Star,
      label: "Today's Specials",
      description: 'Limited time offers',
      bgColor: 'bg-warning-50',
      iconColor: 'text-warning-600',
      onClick: () => handleSearchClick('specials'),
    },
  ];

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h2 className="text-heading-3 mb-1">Quick Actions</h2>
        <p className="text-body-sm">Get things done faster</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="card-interactive p-4 text-left group"
          >
            <div className="flex flex-col space-y-3">
              <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className={`w-6 h-6 ${action.iconColor}`} />
              </div>
              <div>
                <h3 className="text-heading-4 mb-1">{action.label}</h3>
                <p className="text-caption">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
