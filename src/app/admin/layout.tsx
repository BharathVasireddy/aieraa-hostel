import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import SidebarLayout from '@/components/SidebarLayout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is an admin
  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'ADMIN') {
    // Redirect based on actual role
    if (session.user.role === 'MANAGER') {
      redirect('/manager');
    } else {
      redirect('/student');
    }
  }

  const sidebar = (
    <AdminSidebar
      user={{
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role,
        university: {
          name: session.user.university || 'Unknown',
          code: 'SYS',
        },
      }}
    />
  );

  const mobileHeader = (
    <div className='flex items-center'>
      <h1 className='text-lg font-semibold text-gray-900'>Admin Portal</h1>
    </div>
  );

  return (
    <SidebarLayout sidebar={sidebar} mobileHeader={mobileHeader}>
      {children}
    </SidebarLayout>
  );
}
