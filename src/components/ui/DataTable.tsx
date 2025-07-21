'use client';

import { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  paginationLabel?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: {
    view?: (row: T) => void;
    edit?: (row: T) => void;
    delete?: (row: T) => void;
    custom?: Array<{
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
      onClick: (row: T) => void;
      variant?: 'default' | 'danger';
    }>;
  };
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  filterable = false,
  pagination = false,
  pageSize = 10,
  paginationLabel = 'results',
  loading = false,
  onRowClick,
  actions,
  emptyState,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Filtering and searching
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search functionality
    if (searchTerm && searchable) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value =
            typeof column.accessor === 'function'
              ? column.accessor(row)
              : row[column.accessor];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    return filtered;
  }, [data, searchTerm, columns, searchable]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.id === sortConfig.key);
      if (!column) return 0;

      const aVal =
        typeof column.accessor === 'function'
          ? column.accessor(a)
          : a[column.accessor];
      const bVal =
        typeof column.accessor === 'function'
          ? column.accessor(b)
          : b[column.accessor];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === columnId) {
        return current.direction === 'asc'
          ? { key: columnId, direction: 'desc' }
          : null;
      }
      return { key: columnId, direction: 'asc' };
    });
  };

  const getCellValue = (row: T, column: Column<T>) => {
    const value =
      typeof column.accessor === 'function'
        ? column.accessor(row)
        : row[column.accessor];

    return column.render ? column.render(value, row) : value;
  };

  if (loading) {
    return (
      <div className='bg-white rounded-lg border border-gray-200'>
        <div className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-1/4'></div>
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 bg-gray-200 rounded'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
      {/* Table Header Controls */}
      {(searchable || filterable) && (
        <div className='p-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            {searchable && (
              <div className='relative flex-1 max-w-md'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500'
                  placeholder='Search...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {filterable && (
              <button className='ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'>
                <Filter className='h-4 w-4 mr-2' />
                Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              {columns.map(column => (
                <th
                  key={column.id}
                  scope='col'
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className='flex items-center space-x-1'>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className='flex flex-col'>
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortConfig?.key === column.id &&
                            sortConfig.direction === 'asc'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 -mt-1 ${
                            sortConfig?.key === column.id &&
                            sortConfig.direction === 'desc'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th scope='col' className='relative px-6 py-3'>
                  <span className='sr-only'>Actions</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className='bg-white divide-y divide-gray-200'>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className='px-6 py-12 text-center'
                >
                  <div className='flex flex-col items-center'>
                    {emptyState?.icon && (
                      <emptyState.icon className='h-12 w-12 text-gray-400 mb-4' />
                    )}
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      {emptyState?.title || 'No data available'}
                    </h3>
                    <p className='text-gray-500'>
                      {emptyState?.description ||
                        'There are no records to display.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(column => (
                    <td
                      key={column.id}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                            ? 'text-right'
                            : ''
                      }`}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}

                  {actions && (
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex items-center justify-end space-x-2'>
                        {actions.view && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              actions.view!(row);
                            }}
                            className='text-green-600 hover:text-green-900 p-1 rounded'
                            title='View'
                          >
                            <Eye className='h-4 w-4' />
                          </button>
                        )}
                        {actions.edit && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              actions.edit!(row);
                            }}
                            className='text-blue-600 hover:text-blue-900 p-1 rounded'
                            title='Edit'
                          >
                            <Edit className='h-4 w-4' />
                          </button>
                        )}
                        {actions.delete && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              actions.delete!(row);
                            }}
                            className='text-red-600 hover:text-red-900 p-1 rounded'
                            title='Delete'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        )}
                        {actions.custom?.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={e => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={`p-1 rounded ${
                              action.variant === 'danger'
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title={action.label}
                          >
                            {action.icon && <action.icon className='h-4 w-4' />}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
          <div className='flex-1 flex justify-between sm:hidden'>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(prev => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </button>
          </div>

          <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm text-gray-700'>
                Showing{' '}
                <span className='font-medium'>
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className='font-medium'>
                  {Math.min(currentPage * pageSize, sortedData.length)}
                </span>{' '}
                of <span className='font-medium'>{sortedData.length}</span>{' '}
                {paginationLabel}
              </p>
            </div>

            <div>
              <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <ChevronLeft className='h-5 w-5' />
                </button>

                {/* Page numbers */}
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === currentPage;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        isCurrentPage
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <ChevronRight className='h-5 w-5' />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
