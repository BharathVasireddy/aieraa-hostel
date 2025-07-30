'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

export interface Column<T> {
  id: string;
  header: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode;
}

export interface AnimatedDataTableProps<T> {
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
  // Animation-specific props
  enableAnimations?: boolean;
  enableKeyboardNavigation?: boolean;
  animationDelay?: number;
  staggerDelay?: number;
  showGradients?: boolean;
}

// Animated row component
const AnimatedTableRow = ({ 
  children, 
  delay = 0, 
  index, 
  onMouseEnter, 
  onClick,
  className = '',
  isSelected = false 
}: {
  children: React.ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: () => void;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.3 });
  
  return (
    <motion.tr
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={inView ? { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
      } : { 
        opacity: 0, 
        y: 20, 
        scale: 0.95 
      }}
      transition={{ 
        duration: 0.4, 
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      whileHover={{
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.tr>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AnimatedDataTable<T extends Record<string, any>>({
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
  enableAnimations = true,
  enableKeyboardNavigation = true,
  animationDelay = 0.05,
  staggerDelay: _staggerDelay = 0.1,
  showGradients = true,
}: AnimatedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  // Filtering and searching
  const filteredData = useMemo(() => {
    let filtered = [...data];

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
    if (!sortConfig) {return filteredData;}

    return [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.id === sortConfig.key);
      if (!column) {return 0;}

      const aVal =
        typeof column.accessor === 'function'
          ? column.accessor(a)
          : a[column.accessor];
      const bVal =
        typeof column.accessor === 'function'
          ? column.accessor(b)
          : b[column.accessor];

      if (aVal < bVal) {return sortConfig.direction === 'asc' ? -1 : 1;}
      if (aVal > bVal) {return sortConfig.direction === 'asc' ? 1 : -1;}
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) {return sortedData;}

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sorting
  const handleSort = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) {return;}

    setSortConfig(current => {
      if (current?.key === columnId) {
        return current.direction === 'asc'
          ? { key: columnId, direction: 'desc' }
          : null;
      }
      return { key: columnId, direction: 'asc' };
    });
  };

  // Get cell value
  const getCellValue = (row: T, column: Column<T>) => {
    const value =
      typeof column.accessor === 'function'
        ? column.accessor(row)
        : row[column.accessor];
    
    return column.render ? column.render(value, row) : value;
  };

  // Handle scroll for gradients
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!showGradients) {return;}
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  }, [showGradients]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation || !enableAnimations) {return;}

    const handleKeyDown = (e: KeyboardEvent) => {
      const dataLength = paginatedData.length;
      if (dataLength === 0) {return;}

      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedRowIndex((prev) => Math.min(prev + 1, dataLength - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedRowIndex >= 0 && selectedRowIndex < dataLength) {
          e.preventDefault();
          onRowClick?.(paginatedData[selectedRowIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedData, selectedRowIndex, onRowClick, enableKeyboardNavigation, enableAnimations]);

  // Auto-scroll to selected row
  useEffect(() => {
    if (!keyboardNav || selectedRowIndex < 0 || !tableRef.current || !enableAnimations) {return;}

    const container = tableRef.current;
    const selectedRow = container.querySelector(`[data-index="${selectedRowIndex}"]`);
    if (selectedRow) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const rowTop = (selectedRow as HTMLElement).offsetTop;
      const rowBottom = rowTop + (selectedRow as HTMLElement).offsetHeight;

      if (rowTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: rowTop - extraMargin, behavior: 'smooth' });
      } else if (rowBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: rowBottom - containerHeight + extraMargin,
          behavior: 'smooth',
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedRowIndex, keyboardNav, enableAnimations]);

  if (loading) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-8'>
        <div className='animate-pulse space-y-4'>
          <div className='h-4 bg-gray-200 rounded w-1/4'></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='h-12 bg-gray-200 rounded'></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className='bg-white rounded-lg border border-gray-200 shadow-sm relative'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Table Header Controls */}
      {(searchable || filterable) && (
        <motion.div 
          className='p-4 border-b border-gray-200'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className='flex items-center justify-between'>
            {searchable && (
              <div className='relative flex-1 max-w-md'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200'
                  placeholder='Search...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {filterable && (
              <motion.button 
                className='ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter className='h-4 w-4 mr-2' />
                Filter
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Table Container with Gradients */}
      <div className='relative'>
        <div 
          ref={tableRef}
          className='overflow-x-auto max-h-[600px] overflow-y-auto'
          onScroll={handleScroll}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb',
          }}
        >
          <table className='min-w-full divide-y divide-gray-200'>
            <motion.thead 
              className='bg-gray-50 sticky top-0 z-10'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <tr>
                {columns.map((column, index) => (
                  <motion.th
                    key={column.id}
                    scope='col'
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.id)}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={column.sortable ? { backgroundColor: '#f3f4f6' } : undefined}
                  >
                    <div className='flex items-center space-x-1'>
                      <span>{column.header}</span>
                      {column.sortable && (
                        <div className='flex flex-col'>
                          <ChevronUp
                            className={`h-3 w-3 transition-colors ${
                              sortConfig?.key === column.id &&
                              sortConfig.direction === 'asc'
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <ChevronDown
                            className={`h-3 w-3 -mt-1 transition-colors ${
                              sortConfig?.key === column.id &&
                              sortConfig.direction === 'desc'
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </motion.th>
                ))}
                {actions && (
                  <motion.th 
                    scope='col' 
                    className='relative px-6 py-3'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + columns.length * 0.05 }}
                  >
                    <span className='sr-only'>Actions</span>
                  </motion.th>
                )}
              </tr>
            </motion.thead>

            <tbody className='bg-white divide-y divide-gray-200'>
              {paginatedData.length > 0 ? 
                paginatedData.map((row, rowIndex) => {
                  if (enableAnimations) {
                    return (
                      <AnimatedTableRow
                        key={rowIndex}
                        delay={rowIndex * animationDelay}
                        index={rowIndex}
                        onMouseEnter={() => setSelectedRowIndex(rowIndex)}
                        onClick={() => onRowClick?.(row)}
                        isSelected={selectedRowIndex === rowIndex}
                        className='hover:bg-gray-50'
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
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.view?.(row);
                                  }}
                                  className='text-green-600 hover:text-green-900 p-1 rounded'
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Eye className='h-4 w-4' />
                                </motion.button>
                              )}
                              {actions.edit && (
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.edit?.(row);
                                  }}
                                  className='text-blue-600 hover:text-blue-900 p-1 rounded'
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Edit className='h-4 w-4' />
                                </motion.button>
                              )}
                              {actions.delete && (
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.delete?.(row);
                                  }}
                                  className='text-red-600 hover:text-red-900 p-1 rounded'
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </motion.button>
                              )}
                            </div>
                          </td>
                        )}
                      </AnimatedTableRow>
                    );
                  } else {
                    return (
                      <tr
                        key={rowIndex}
                        className='hover:bg-gray-50 cursor-pointer'
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.view?.(row);
                                  }}
                                  className='text-green-600 hover:text-green-900 p-1 rounded'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                              )}
                              {actions.edit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.edit?.(row);
                                  }}
                                  className='text-blue-600 hover:text-blue-900 p-1 rounded'
                                >
                                  <Edit className='h-4 w-4' />
                                </button>
                              )}
                              {actions.delete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.delete!(row);
                                  }}
                                  className='text-red-600 hover:text-red-900 p-1 rounded'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }
                })
              : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className='px-6 py-12 text-center'
                  >
                    <div className='flex flex-col items-center'>
                      {emptyState?.icon && (
                        <emptyState.icon className='h-12 w-12 text-gray-400 mb-4' />
                      )}
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        {emptyState?.title ?? 'No data available'}
                      </h3>
                      <p className='text-gray-500'>
                        {emptyState?.description ?? 'No items to display'}
                      </p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Gradient Overlays */}
        {showGradients && enableAnimations && (
          <>
            <div
              className='absolute top-0 left-0 right-0 h-[50px] bg-gradient-to-b from-white to-transparent pointer-events-none transition-opacity duration-300 ease'
              style={{ opacity: topGradientOpacity }}
            />
            <div
              className='absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-300 ease'
              style={{ opacity: bottomGradientOpacity }}
            />
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <motion.div 
          className='px-6 py-3 flex items-center justify-between border-t border-gray-200'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className='flex-1 flex justify-between sm:hidden'>
            <motion.button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              whileHover={currentPage !== 1 ? { scale: 1.02 } : undefined}
              whileTap={currentPage !== 1 ? { scale: 0.98 } : undefined}
            >
              Previous
            </motion.button>
            <motion.button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              whileHover={currentPage !== totalPages ? { scale: 1.02 } : undefined}
              whileTap={currentPage !== totalPages ? { scale: 0.98 } : undefined}
            >
              Next
            </motion.button>
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
                of{' '}
                <span className='font-medium'>{sortedData.length}</span>{' '}
                {paginationLabel}
              </p>
            </div>
            <div>
              <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                <motion.button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  whileHover={currentPage !== 1 ? { backgroundColor: '#f9fafb' } : undefined}
                >
                  <ChevronLeft className='h-5 w-5' />
                </motion.button>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <motion.button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                      whileHover={page !== currentPage ? { backgroundColor: '#f9fafb' } : undefined}
                      whileTap={{ scale: 0.95 }}
                    >
                      {page}
                    </motion.button>
                  );
                })}
                <motion.button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  whileHover={currentPage !== totalPages ? { backgroundColor: '#f9fafb' } : undefined}
                >
                  <ChevronRight className='h-5 w-5' />
                </motion.button>
              </nav>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 