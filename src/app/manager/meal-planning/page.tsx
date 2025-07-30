import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { 
  Calendar, 
  Upload, 
  BarChart3, 
  Settings2, 
  ChefHat, 
  Users,
  FileText,
  Clock
} from 'lucide-react';

async function MealPlanningDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN')) {
    redirect('/auth/signin');
  }

  const quickStats = [
    {
      title: "Today's Meal Plans",
      value: "12",
      icon: ChefHat,
      color: "bg-teal-500",
    },
    {
      title: "Student Selections",
      value: "856",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Deadline Status",
      value: "Active",
      icon: Clock,
      color: "bg-green-500",
    },
    {
      title: "Participation Rate",
      value: "92%",
      icon: BarChart3,
      color: "bg-purple-500",
    },
  ];

  const actions = [
    {
      title: "Manage Categories",
      description: "Create and manage meal categories like South Indian Veg, North Indian Non Veg, etc.",
      href: "/manager/meal-planning/categories",
      icon: Settings2,
      color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      title: "Create Meal Plans",
      description: "Create daily meal plans for breakfast, lunch, and dinner",
      href: "/manager/meal-planning/plans",
      icon: Calendar,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Upload CSV",
      description: "Bulk upload meal plans using CSV file",
      href: "/manager/meal-planning/upload",
      icon: Upload,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Analytics & Reports",
      description: "View selection statistics and export data",
      href: "/manager/meal-planning/analytics",
      icon: BarChart3,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Student Selections",
      description: "View and manage student meal selections",
      href: "/manager/meal-planning/selections",
      icon: Users,
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Export Reports",
      description: "Download detailed reports and meal preparation lists",
      href: "/manager/meal-planning/reports",
      icon: FileText,
      color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Daily Meal Planning</h1>
            <p className="mt-2 text-gray-600">
              Manage daily meal preferences and track student selections
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className={`block ${action.color} border-2 rounded-lg p-6 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`${action.iconColor} flex-shrink-0`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Important Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Selection Deadline Information
              </h4>
              <p className="text-sm text-blue-800">
                Students must select their meal preferences by 5:00 PM the day before. 
                After the deadline, selections are automatically locked and cannot be modified by students.
                You can still override selections as a manager if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MealPlanningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meal planning dashboard...</p>
        </div>
      </div>
    }>
      <MealPlanningDashboard />
    </Suspense>
  );
} 