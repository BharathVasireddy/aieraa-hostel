'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  RefreshCw,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Package,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  image?: string;
}

interface AvailabilityModalProps {
  menuItem: MenuItem;
  onClose: () => void;
  onSave: () => void;
}

type AvailabilityMode = 'recurring' | 'dateRange' | 'specificDates';

interface RecurringPattern {
  days: string[]; // ['0', '1', '2', '3', '4', '5', '6'] for Sun-Sat
  startDate: string;
  endDate: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface SpecificDates {
  dates: string[];
}

export default function AvailabilityModal({
  menuItem,
  onClose,
  onSave,
}: AvailabilityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AvailabilityMode>('recurring');

  // Recurring pattern state
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>({
    days: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 30 days from now
  });

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 7 days from now
  });

  // Specific dates state
  const [specificDates, setSpecificDates] = useState<SpecificDates>({
    dates: [],
  });

  const [newDate, setNewDate] = useState('');

  const dayLabels = [
    { value: '0', label: 'Sunday', short: 'Sun' },
    { value: '1', label: 'Monday', short: 'Mon' },
    { value: '2', label: 'Tuesday', short: 'Tue' },
    { value: '3', label: 'Wednesday', short: 'Wed' },
    { value: '4', label: 'Thursday', short: 'Thu' },
    { value: '5', label: 'Friday', short: 'Fri' },
    { value: '6', label: 'Saturday', short: 'Sat' },
  ];

  const toggleRecurringDay = (dayValue: string) => {
    setRecurringPattern(prev => ({
      ...prev,
      days: prev.days.includes(dayValue)
        ? prev.days.filter(d => d !== dayValue)
        : [...prev.days, dayValue],
    }));
  };

  const addSpecificDate = () => {
    if (newDate && !specificDates.dates.includes(newDate)) {
      setSpecificDates(prev => ({
        dates: [...prev.dates, newDate].sort(),
      }));
      setNewDate('');
    }
  };

  const removeSpecificDate = (dateToRemove: string) => {
    setSpecificDates(prev => ({
      dates: prev.dates.filter(date => date !== dateToRemove),
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const validateForm = (): string | null => {
    if (mode === 'recurring') {
      if (recurringPattern.days.length === 0) {
        return 'Please select at least one day for recurring pattern';
      }
      if (!recurringPattern.startDate || !recurringPattern.endDate) {
        return 'Please set both start and end dates for recurring pattern';
      }
      if (
        new Date(recurringPattern.startDate) >
        new Date(recurringPattern.endDate)
      ) {
        return 'End date must be after start date';
      }
    } else if (mode === 'dateRange') {
      if (!dateRange.startDate || !dateRange.endDate) {
        return 'Please set both start and end dates';
      }
      if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
        return 'End date must be after start date';
      }
    } else if (mode === 'specificDates') {
      if (specificDates.dates.length === 0) {
        return 'Please select at least one specific date';
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        menuItemId: menuItem.id,
        mode,
        isAvailable: true,
      };

      if (mode === 'recurring') {
        payload.recurringPattern = recurringPattern;
      } else if (mode === 'dateRange') {
        payload.dateRange = dateRange;
      } else if (mode === 'specificDates') {
        payload.specificDates = specificDates;
      }

      const response = await fetch(
        `/api/manager/menu/${menuItem.id}/availability`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save availability');
      }

      onSave();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save availability'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div className='w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center'>
              {menuItem.image ? (
                <img
                  src={menuItem.image}
                  alt={menuItem.name}
                  className='w-full h-full object-cover'
                />
              ) : (
                <Package className='w-6 h-6 text-gray-400' />
              )}
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                Set Availability
              </h2>
              <p className='text-gray-600'>{menuItem.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2'>
              <AlertCircle className='w-5 h-5 text-red-500' />
              <p className='text-red-700'>{error}</p>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className='p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Availability Type
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <button
              onClick={() => setMode('recurring')}
              className={`p-4 rounded-lg border-2 transition-colors text-center ${
                mode === 'recurring'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className='w-6 h-6 mx-auto mb-2' />
              <p className='font-medium'>Recurring Days</p>
              <p className='text-xs text-gray-500'>
                All Mondays, Tuesdays, etc.
              </p>
            </button>

            <button
              onClick={() => setMode('dateRange')}
              className={`p-4 rounded-lg border-2 transition-colors text-center ${
                mode === 'dateRange'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className='w-6 h-6 mx-auto mb-2' />
              <p className='font-medium'>Date Range</p>
              <p className='text-xs text-gray-500'>From start to end date</p>
            </button>

            <button
              onClick={() => setMode('specificDates')}
              className={`p-4 rounded-lg border-2 transition-colors text-center ${
                mode === 'specificDates'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Plus className='w-6 h-6 mx-auto mb-2' />
              <p className='font-medium'>Specific Dates</p>
              <p className='text-xs text-gray-500'>Individual dates only</p>
            </button>
          </div>
        </div>

        {/* Content based on mode */}
        <div className='p-6'>
          {mode === 'recurring' && (
            <div className='space-y-6'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 mb-3'>
                  Select Days
                </h4>
                <div className='grid grid-cols-7 gap-2'>
                  {dayLabels.map(day => (
                    <button
                      key={day.value}
                      onClick={() => toggleRecurringDay(day.value)}
                      className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                        recurringPattern.days.includes(day.value)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className='text-center'>
                        <p className='font-bold'>{day.short}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className='text-sm text-gray-500 mt-2'>
                  Item will be available on selected days within the date range
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Start Date
                  </label>
                  <input
                    type='date'
                    value={recurringPattern.startDate}
                    onChange={e =>
                      setRecurringPattern(prev => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    End Date
                  </label>
                  <input
                    type='date'
                    value={recurringPattern.endDate}
                    onChange={e =>
                      setRecurringPattern(prev => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    min={recurringPattern.startDate}
                  />
                </div>
              </div>

              {recurringPattern.days.length > 0 && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-sm text-blue-700'>
                    <strong>Preview:</strong> Item will be available on{' '}
                    {recurringPattern.days
                      .map(
                        dayValue =>
                          dayLabels.find(d => d.value === dayValue)?.label
                      )
                      .join(', ')}{' '}
                    from {formatDate(recurringPattern.startDate)} to{' '}
                    {formatDate(recurringPattern.endDate)}
                  </p>
                </div>
              )}
            </div>
          )}

          {mode === 'dateRange' && (
            <div className='space-y-6'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 mb-3'>
                  Date Range
                </h4>
                <p className='text-sm text-gray-600 mb-4'>
                  Item will be available every day within this date range
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Start Date
                  </label>
                  <input
                    type='date'
                    value={dateRange.startDate}
                    onChange={e =>
                      setDateRange(prev => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    End Date
                  </label>
                  <input
                    type='date'
                    value={dateRange.endDate}
                    onChange={e =>
                      setDateRange(prev => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    min={dateRange.startDate}
                  />
                </div>
              </div>

              {dateRange.startDate && dateRange.endDate && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-sm text-blue-700'>
                    <strong>Preview:</strong> Item will be available every day
                    from {formatDate(dateRange.startDate)} to{' '}
                    {formatDate(dateRange.endDate)}
                  </p>
                </div>
              )}
            </div>
          )}

          {mode === 'specificDates' && (
            <div className='space-y-6'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 mb-3'>
                  Specific Dates
                </h4>
                <p className='text-sm text-gray-600 mb-4'>
                  Item will be available only on the dates you specify
                </p>
              </div>

              <div className='space-y-4'>
                <div className='flex space-x-2'>
                  <input
                    type='date'
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <button
                    onClick={addSpecificDate}
                    disabled={!newDate || specificDates.dates.includes(newDate)}
                    className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
                  >
                    <Plus className='w-4 h-4' />
                    <span>Add</span>
                  </button>
                </div>

                {specificDates.dates.length > 0 && (
                  <div>
                    <h5 className='font-medium text-gray-900 mb-2'>
                      Selected Dates:
                    </h5>
                    <div className='space-y-2 max-h-32 overflow-y-auto'>
                      {specificDates.dates.map(date => (
                        <div
                          key={date}
                          className='flex items-center justify-between p-2 bg-gray-50 rounded-lg'
                        >
                          <span className='text-sm text-gray-700'>
                            {formatDate(date)}
                          </span>
                          <button
                            onClick={() => removeSpecificDate(date)}
                            className='p-1 text-red-600 hover:bg-red-50 rounded transition-colors'
                          >
                            <Minus className='w-4 h-4' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {specificDates.dates.length > 0 && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <p className='text-sm text-blue-700'>
                      <strong>Preview:</strong> Item will be available on{' '}
                      {specificDates.dates.length} specific date
                      {specificDates.dates.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end space-x-4 p-6 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className='flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50'
          >
            {loading ? (
              <>
                <RefreshCw className='w-4 h-4 animate-spin' />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className='w-4 h-4' />
                <span>Save Availability</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
