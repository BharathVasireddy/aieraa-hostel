'use client';

import {
  ClipboardList,
  UtensilsCrossed,
  Users,
  Settings,
  CheckCircle,
  Clock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

interface QuickActionsManagerProps {
  pendingApprovals: number;
  universityId?: string;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: number;
  onClick: () => void;
}

const QuickAction = memo<QuickActionProps>(
  ({ title, description, icon: Icon, color, badge, onClick }) => (
    <button
      onClick={() => void onClick()}
      className='bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-left group'
    >
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-3'>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
          >
            <Icon className='w-5 h-5 text-white' />
          </div>
          <div className='flex-1'>
            <h3 className='font-semibold text-gray-900 group-hover:text-gray-700'>
              {title}
            </h3>
            <p className='text-sm text-gray-600 mt-1'>{description}</p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          {badge !== undefined && badge > 0 && (
            <span className='bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full'>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          <ArrowRight className='w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors' />
        </div>
      </div>
    </button>
  )
);

QuickAction.displayName = 'QuickAction';

const QuickActionsManager = memo<QuickActionsManagerProps>(
  ({ pendingApprovals, universityId }) => {
    const router = useRouter();

    const quickActions = [
      {
        title: 'Pending Orders',
        description:
          pendingApprovals > 0
            ? `${pendingApprovals} orders waiting for approval`
            : 'All orders are up to date',
        icon: Clock,
        color: pendingApprovals > 0 ? 'bg-orange-600' : 'bg-green-600',
        badge: pendingApprovals > 0 ? pendingApprovals : undefined,
        onClick: () => router.push('/manager/orders?status=PENDING'),
      },
      {
        title: 'Approve Orders',
        description: 'Review and approve student meal orders',
        icon: CheckCircle,
        color: 'bg-blue-600',
        onClick: () => router.push('/manager/orders'),
      },
      {
        title: 'Manage Menu',
        description: 'Update menu items and availability',
        icon: UtensilsCrossed,
        color: 'bg-purple-600',
        onClick: () => router.push('/manager/menu'),
      },
      {
        title: 'Student Approvals',
        description: 'Review and approve student registrations',
        icon: UserCheck,
        color: 'bg-orange-600',
        onClick: () => router.push('/manager/students?status=PENDING'),
      },
      {
        title: 'Student Management',
        description: 'View and manage all students',
        icon: Users,
        color: 'bg-green-600',
        onClick: () => router.push('/manager/students'),
      },
      {
        title: 'University Settings',
        description: 'Configure cutoff times and policies',
        icon: Settings,
        color: 'bg-gray-600',
        onClick: () => router.push('/manager/settings'),
      },
      {
        title: 'View All Orders',
        description: 'Complete order history and management',
        icon: ClipboardList,
        color: 'bg-indigo-600',
        onClick: () => router.push('/manager/orders?status=all'),
      },
    ];

    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>Quick Actions</h2>
          <p className='text-sm text-gray-600'>
            {universityId ? 'University-scoped actions' : 'Manager tools'}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {quickActions.map((action, index) => (
            <QuickAction
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color}
              badge={action.badge}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>
    );
  }
);

QuickActionsManager.displayName = 'QuickActionsManager';

export default QuickActionsManager;
