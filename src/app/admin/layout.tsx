import BottomNavigation from '@/components/BottomNavigation'
import { ToastContainer } from '@/components/ui/Toast'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-20">
        {children}
      </div>
      
      {/* Toast Container for notifications */}
      <ToastContainer />
      
      {/* Bottom Navigation for all admin pages */}
      <BottomNavigation />
    </div>
  )
} 