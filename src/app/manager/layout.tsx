import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import SidebarLayout from '@/components/SidebarLayout';
import ManagerNavigation from '@/components/manager/ManagerNavigation';
import { prisma } from '@/lib/prisma';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and is a manager
  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'MANAGER') {
    // Redirect based on actual role
    if (session.user.role === 'ADMIN') {
      redirect('/admin');
    } else {
      redirect('/student');
    }
  }

  // Get manager's university and pending counts
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, universityId: true },
  });

  let pendingOrdersCount = 0;
  let pendingStudentsCount = 0;

  if (currentUser?.universityId) {
    // Get pending orders count
    pendingOrdersCount = await prisma.order.count({
      where: {
        universityId: currentUser.universityId,
        status: 'PENDING',
      },
    });

    // Get pending students count
    pendingStudentsCount = await prisma.user.count({
      where: {
        universityId: currentUser.universityId,
        role: 'STUDENT',
        status: 'PENDING',
      },
    });
  }

  const sidebar = (
    <ManagerSidebar
      user={{
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role,
        university: {
          name: session.user.university || 'University',
          code: 'UNI',
        },
        universityId: session.user.universityId,
      }}
      pendingOrdersCount={pendingOrdersCount}
      pendingStudentsCount={pendingStudentsCount}
    />
  );

  const mobileHeader = (
    <div className='flex items-center'>
      <div>
        <h1 className='text-lg font-semibold text-gray-900'>Manager Portal</h1>
        <p className='text-xs text-gray-600'>
          {session.user.university || 'University'}
        </p>
      </div>
    </div>
  );

  const mobileNavigation = <ManagerNavigation />;

  return (
    <SidebarLayout
      sidebar={sidebar}
      mobileHeader={mobileHeader}
      mobileNavigation={mobileNavigation}
    >
      {children}
    </SidebarLayout>
  );
}
