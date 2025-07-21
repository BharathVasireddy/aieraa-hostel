'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useUser } from '@/components/UserProvider';
import {
  Clock,
  UserCheck,
  UserX,
  XCircle,
  Eye,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface PendingStudent {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  createdAt: string;
  course?: string;
  phone?: string;
}

interface PendingApprovalsWidgetProps {
  pendingCount?: number;
}

const PendingApprovalsWidget = memo<PendingApprovalsWidgetProps>(
  ({ pendingCount = 0 }) => {
    const { user } = useUser();
    const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>(
      []
    );
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [localPendingCount, setLocalPendingCount] = useState(pendingCount);

    const fetchPendingStudents = useCallback(async () => {
      if (!user?.universityId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/manager/users?role=STUDENT&status=PENDING&limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          setPendingStudents(data.users || []);
          setLocalPendingCount(data.summary?.pending || 0);
        }
      } catch (error) {
        console.error('Failed to fetch pending students:', error);
      } finally {
        setLoading(false);
      }
    }, [user?.universityId]);

    useEffect(() => {
      fetchPendingStudents();
    }, [fetchPendingStudents]);

    const updateStudentStatus = async (
      studentId: string,
      status: 'APPROVED' | 'REJECTED',
      reason?: string
    ) => {
      try {
        setUpdating(studentId);

        const response = await fetch(`/api/manager/users/${studentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, reason }),
        });

        if (response.ok) {
          // Remove from local list and update count
          setPendingStudents(prev => prev.filter(s => s.id !== studentId));
          setLocalPendingCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Failed to update student status:', error);
      } finally {
        setUpdating(null);
      }
    };

    const handleApprove = (student: PendingStudent) => {
      updateStudentStatus(student.id, 'APPROVED', 'Approved by manager');
    };

    const handleReject = (student: PendingStudent) => {
      if (
        confirm(
          `Are you sure you want to reject ${student.name}'s application?`
        )
      ) {
        updateStudentStatus(
          student.id,
          'REJECTED',
          'Application rejected by manager'
        );
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const vietnamDate = new Date(
        date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
      );

      const day = vietnamDate.getDate().toString().padStart(2, '0');
      const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
      const year = vietnamDate.getFullYear();

      return `${day}/${month}/${year}`;
    };

    if (loading) {
      return (
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='animate-pulse'>
            <div className='h-6 bg-gray-300 rounded w-1/2 mb-4'></div>
            <div className='space-y-3'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-gray-300 rounded-full'></div>
                  <div className='flex-1'>
                    <div className='h-4 bg-gray-300 rounded w-3/4'></div>
                    <div className='h-3 bg-gray-300 rounded w-1/2 mt-1'></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <Clock className='w-5 h-5 text-orange-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              Pending Approvals
            </h3>
            {localPendingCount > 0 && (
              <span className='bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full'>
                {localPendingCount}
              </span>
            )}
          </div>
          <Link
            href='/manager/students?status=PENDING'
            className='text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1'
          >
            <span>View All</span>
            <ArrowRight className='w-4 h-4' />
          </Link>
        </div>

        {/* Content */}
        {localPendingCount === 0 ? (
          <div className='text-center py-8'>
            <UserCheck className='w-12 h-12 text-green-500 mx-auto mb-3' />
            <p className='text-gray-600'>No pending approvals</p>
            <p className='text-sm text-gray-500'>All students are processed!</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {pendingStudents.map(student => (
              <div
                key={student.id}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div className='flex items-center space-x-3 flex-1 min-w-0'>
                  <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-orange-700 font-semibold text-xs'>
                      {student.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-gray-900 text-sm truncate'>
                      {student.name}
                    </p>
                    <p className='text-xs text-gray-600 truncate'>
                      {student.email}
                    </p>
                    <div className='flex items-center space-x-2 text-xs text-gray-500 mt-1'>
                      <span>Applied: {formatDate(student.createdAt)}</span>
                      {student.studentId && (
                        <span>• ID: {student.studentId}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center space-x-1 ml-2'>
                  <Link href={`/manager/students`}>
                    <button
                      className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
                      title='View Details'
                    >
                      <Eye className='w-3.5 h-3.5' />
                    </button>
                  </Link>

                  <button
                    onClick={() => handleApprove(student)}
                    disabled={updating === student.id}
                    className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50'
                    title='Approve'
                  >
                    {updating === student.id ? (
                      <RefreshCw className='w-3.5 h-3.5 animate-spin' />
                    ) : (
                      <UserCheck className='w-3.5 h-3.5' />
                    )}
                  </button>

                  <button
                    onClick={() => handleReject(student)}
                    disabled={updating === student.id}
                    className='p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50'
                    title='Reject'
                  >
                    <XCircle className='w-3.5 h-3.5' />
                  </button>
                </div>
              </div>
            ))}

            {localPendingCount > pendingStudents.length && (
              <div className='text-center py-2'>
                <Link
                  href='/manager/students?status=PENDING'
                  className='text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center space-x-1'
                >
                  <span>
                    View {localPendingCount - pendingStudents.length} more
                    pending
                  </span>
                  <ArrowRight className='w-4 h-4' />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PendingApprovalsWidget.displayName = 'PendingApprovalsWidget';

export default PendingApprovalsWidget;
