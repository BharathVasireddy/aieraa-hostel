'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/UserProvider';
import { signOut, getSession } from 'next-auth/react';
import AnimatedDataTable, { Column } from '@/components/ui/AnimatedDataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  role: string;
  studentId?: string;
  phone?: string;
  course?: string;
  room?: string;
  createdAt: string;
  lastLoginAt?: string;
  university?: {
    name: string;
    code: string;
  };
  orderStats?: {
    totalOrders: number;
    totalSpent: number;
  };
}

interface StudentsResponse {
  users: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total: number;
    pending: number;
    approved: number;
    suspended: number;
    rejected: number;
  };
}

export default function ManagerStudentsPage() {
  const { user } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    suspended: 0,
    rejected: 0,
  });
  const [selectedUser, setSelectedUser] = useState<Student | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch summary data (always all students - static)
  const fetchSummary = useCallback(async () => {
    if (!user?.universityId) {return;}

    try {
      const response = await fetch(`/api/manager/users?role=STUDENT&limit=1`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data: StudentsResponse = await response.json();
        setSummary(
          data.summary || {
            total: 0,
            pending: 0,
            approved: 0,
            suspended: 0,
            rejected: 0,
          }
        );
        // Updated summary with static data
      }
    } catch (error) {
    }
  }, [user?.universityId]);

  // Fetch filtered students data (changes based on filter)
  const fetchStudents = useCallback(
    async (status = 'ALL') => {
      if (!user?.universityId) {
        // If user exists but no universityId, show refresh option
        if (user && !user.universityId) {
          // User exists but no universityId - session may be outdated
        }
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams({
          role: 'STUDENT',
          limit: '100',
        });

        if (status !== 'ALL') {
          params.append('status', status);
        }

        const url = `/api/manager/users?${params}`;

        const response = await fetch(url);


        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data: StudentsResponse = await response.json();

        setStudents(data.users || []);
        // setSummary(data.summary || { // This line is now handled by fetchSummary
        //   total: 0,
        //   pending: 0,
        //   approved: 0,
        //   suspended: 0,
        //   rejected: 0
        // })
      } catch (error) {
        // Set empty data on error
        setStudents([]);
        // setSummary({ // This line is now handled by fetchSummary
        //   total: 0,
        //   pending: 0,
        //   approved: 0,
        //   suspended: 0,
        //   rejected: 0
        // })
      } finally {
        setLoading(false);
      }
    },
    [user?.universityId, user]
  );

  const handleRefreshSession = async () => {
    try {
      const newSession = await getSession();

      // Force a page reload to get fresh user data
      window.location.reload();
    } catch (error) {
    }
  };

  const handleForceLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const updateUserStatus = async (
    userId: string,
    status: 'APPROVED' | 'SUSPENDED' | 'REJECTED',
    reason?: string
  ) => {
    try {
      setUpdating(userId);

      const response = await fetch(`/api/manager/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Refresh both the filtered students list and the summary
        await Promise.all([fetchStudents(selectedStatus), fetchSummary()]);
        return data;
      } else {
        throw new Error(data.error || 'Failed to update user status');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleApprove = (student: Student) => {
    if (confirm(`Approve ${student.name} for ${user?.university?.name}?`)) {
      updateUserStatus(student.id, 'APPROVED');
    }
  };

  const handleSuspend = (student: Student) => {
    const reason = prompt(`Suspend ${student.name}? Please provide a reason:`);
    if (reason !== null) {
      updateUserStatus(student.id, 'SUSPENDED', reason || 'No reason provided');
    }
  };

  const handleReject = (student: Student) => {
    if (
      confirm(`Are you sure you want to reject ${student.name}&apos;s application?`)
    ) {
      updateUserStatus(
        student.id,
        'REJECTED',
        'Application rejected by manager'
      );
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedUser(student);
    setShowUserModal(true);
  };

  useEffect(() => {
    void fetchStudents();
    void fetchSummary(); // Fetch summary on mount
  }, [fetchStudents, fetchSummary]);

  // Show error state if user doesn't have universityId
  if (user && !user.universityId) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center'>
          <div className='mb-4'>
            <AlertCircle className='w-16 h-16 text-orange-500 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Session Issue Detected
            </h2>
            <p className='text-gray-600 mb-4'>
              Your session doesn't include university information. This usually
              happens when your account was recently updated.
            </p>
            <div className='text-sm text-gray-500 mb-6'>
              User: <strong>{user.name}</strong> ({user.email})<br />
              Role: <strong>{user.role}</strong>
            </div>
          </div>

          <div className='space-y-3'>
            <button
              onClick={() => void handleRefreshSession()}
              className='w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Refresh Session
            </button>

            <button
              onClick={() => void handleForceLogout()}
              className='w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
            >
              <LogOut className='w-4 h-4 mr-2' />
              Logout & Login Again
            </button>
          </div>

          <p className='text-xs text-gray-500 mt-4'>
            This will refresh your session data and university association.
          </p>
        </div>
      </div>
    );
  }

  const columns: Column<Student>[] = [
    {
      id: 'name',
      header: 'Student',
      accessor: 'name',
      width: '25%',
      sortable: true,
      render: (value, row) => (
        <div className='flex items-center space-x-3'>
          <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
            <span className='text-green-700 font-semibold text-xs'>
              {row.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()}
            </span>
          </div>
          <div className='min-w-0 flex-1'>
            <p className='font-medium text-gray-900 text-sm truncate'>
              {value}
            </p>
            <p className='text-sm text-gray-600 truncate'>{row.email}</p>
            {row.studentId && (
              <p className='text-xs text-gray-500'>ID: {row.studentId}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      width: '12%',
      sortable: true,
      render: value => <StatusBadge status={value} size='md' />,
    },
    {
      id: 'housing',
      header: 'Room',
      accessor: 'room',
      width: '12%',
      render: (value, row) => (
        <div className='text-sm'>
          {row.room ? (
            <p className='text-gray-900'>{row.room}</p>
          ) : (
            <p className='text-gray-400 text-sm'>-</p>
          )}
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      accessor: 'phone',
      width: '18%',
      render: (value, row) => (
        <div className='text-sm'>
          {row.phone && <p className='text-gray-900'>{row.phone}</p>}
          <p className='text-gray-600 truncate'>{row.email}</p>
        </div>
      ),
    },
    {
      id: 'registered',
      header: 'Registered',
      accessor: 'createdAt',
      width: '13%',
      sortable: true,
      render: value => {
        const date = new Date(value);

        // Convert to Vietnam timezone
        const vietnamDate = new Date(
          date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
        );

        const day = vietnamDate.getDate().toString().padStart(2, '0');
        const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
        const year = vietnamDate.getFullYear();
        const hours = vietnamDate.getHours().toString().padStart(2, '0');
        const minutes = vietnamDate.getMinutes().toString().padStart(2, '0');

        return (
          <div className='text-sm text-gray-600'>
            <div>
              {day}/{month}/{year}
            </div>
            <div className='text-xs text-gray-500'>
              {hours}:{minutes}
            </div>
          </div>
        );
      },
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      accessor: 'lastLoginAt',
      width: '13%',
      render: value => {
        if (!value) {
          return (
            <div className='text-sm text-gray-600'>
              <div>Never</div>
            </div>
          );
        }

        const date = new Date(value);

        // Convert to Vietnam timezone
        const vietnamDate = new Date(
          date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
        );

        const day = vietnamDate.getDate().toString().padStart(2, '0');
        const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
        const year = vietnamDate.getFullYear();
        const hours = vietnamDate.getHours().toString().padStart(2, '0');
        const minutes = vietnamDate.getMinutes().toString().padStart(2, '0');

        return (
          <div className='text-sm text-gray-600'>
            <div>
              {day}/{month}/{year}
            </div>
            <div className='text-xs text-gray-500'>
              {hours}:{minutes}
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: 'id',
      width: '17%',
      render: (value, row) => (
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => handleViewDetails(row)}
            className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
            title='View Details'
          >
            <Eye className='w-4 h-4' />
          </button>

          {row.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleApprove(row)}
                disabled={updating === row.id}
                className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50'
                title='Approve'
              >
                <UserCheck className='w-4 h-4' />
              </button>
              <button
                onClick={() => handleReject(row)}
                disabled={updating === row.id}
                className='p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50'
                title='Reject'
              >
                <XCircle className='w-4 h-4' />
              </button>
            </>
          )}

          {row.status === 'APPROVED' && (
            <button
              onClick={() => handleSuspend(row)}
              disabled={updating === row.id}
              className='p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50'
              title='Suspend'
            >
              <UserX className='w-4 h-4' />
            </button>
          )}

          {row.status === 'SUSPENDED' && (
            <button
              onClick={() => handleApprove(row)}
              disabled={updating === row.id}
              className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50'
              title='Reactivate'
            >
              <UserCheck className='w-4 h-4' />
            </button>
          )}

          {row.status === 'REJECTED' && (
            <button
              onClick={() => handleApprove(row)}
              disabled={updating === row.id}
              className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50'
              title='Approve'
            >
              <UserCheck className='w-4 h-4' />
            </button>
          )}

          {updating === row.id && (
            <div className='p-1.5'>
              <RefreshCw className='w-4 h-4 text-gray-400 animate-spin' />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Student Management
          </h1>
          <p className='text-gray-600'>
            Manage student registrations and access for {user?.university?.name}
          </p>
        </div>
        <button
          onClick={() => fetchStudents(selectedStatus)}
          disabled={loading}
          className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <Users className='w-8 h-8 text-blue-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>
                Total Students
              </p>
              <p className='text-2xl font-bold text-gray-900'>
                {summary.total}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <Clock className='w-8 h-8 text-orange-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Pending</p>
              <p className='text-2xl font-bold text-orange-600'>
                {summary.pending}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <CheckCircle className='w-8 h-8 text-green-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Approved</p>
              <p className='text-2xl font-bold text-green-600'>
                {summary.approved}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <AlertCircle className='w-8 h-8 text-red-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Suspended</p>
              <p className='text-2xl font-bold text-red-600'>
                {summary.suspended}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <XCircle className='w-8 h-8 text-gray-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Rejected</p>
              <p className='text-2xl font-bold text-gray-600'>
                {summary.rejected}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className='bg-white rounded-lg border border-gray-200 p-4'>
        <div className='flex items-center space-x-4'>
          <span className='text-sm font-medium text-gray-700'>
            Filter by status:
          </span>
          {['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].map(
            status => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  void fetchStudents(status);
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            )
          )}
        </div>
      </div>

      {/* Students Table */}
      <AnimatedDataTable
        data={students}
        columns={columns}
        loading={loading}
        searchable={true}
        pagination={true}
        pageSize={20}
        paginationLabel='students'
        enableAnimations={true}
        enableKeyboardNavigation={true}
        animationDelay={0.04}
        staggerDelay={0.1}
        showGradients={true}
        emptyState={{
          title: 'No students found',
          description: 'No students match the current filter criteria.',
          icon: Users,
        }}
        onRowClick={(student) => {
          setSelectedUser(student);
          setShowUserModal(true);
        }}
      />

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen px-4'>
            <div
              className='fixed inset-0 bg-gray-600 bg-opacity-75'
              onClick={() => setShowUserModal(false)}
            />

            <div className='relative bg-white rounded-lg max-w-lg w-full p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Student Details
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <XCircle className='w-6 h-6' />
                </button>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-green-700 font-semibold'>
                      {selectedUser.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900'>
                      {selectedUser.name}
                    </h4>
                    <p className='text-sm text-gray-600'>
                      {selectedUser.email}
                    </p>
                    <StatusBadge status={selectedUser.status} size='sm' />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 text-sm'>
                  {selectedUser.studentId && (
                    <div>
                      <span className='font-medium text-gray-700'>
                        Student ID:
                      </span>
                      <p className='text-gray-900'>{selectedUser.studentId}</p>
                    </div>
                  )}

                  {selectedUser.course && (
                    <div>
                      <span className='font-medium text-gray-700'>Course:</span>
                      <p className='text-gray-900'>{selectedUser.course}</p>
                    </div>
                  )}

                  {selectedUser.room && (
                    <div>
                      <span className='font-medium text-gray-700'>Room:</span>
                      <p className='text-gray-900'>{selectedUser.room}</p>
                    </div>
                  )}

                  {selectedUser.phone && (
                    <div>
                      <span className='font-medium text-gray-700'>Phone:</span>
                      <p className='text-gray-900'>{selectedUser.phone}</p>
                    </div>
                  )}

                  <div>
                    <span className='font-medium text-gray-700'>
                      Registered:
                    </span>
                    <p className='text-gray-900'>
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className='flex space-x-3 pt-4'>
                  {selectedUser.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedUser);
                          setShowUserModal(false);
                        }}
                        className='flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedUser);
                          setShowUserModal(false);
                        }}
                        className='flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors'
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {selectedUser.status !== 'SUSPENDED' && (
                    <button
                      onClick={() => {
                        handleSuspend(selectedUser);
                        setShowUserModal(false);
                      }}
                      className='flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors'
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
