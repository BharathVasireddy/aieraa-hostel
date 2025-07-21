import React, { useState, useTransition } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface OptimisticButtonProps {
  children: React.ReactNode;
  onClick: () => Promise<void> | void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  showFeedback?: boolean;
  className?: string;
}

/**
 * Button that provides instant visual feedback and handles async operations optimistically
 * This follows the pattern used by modern apps where users get immediate feedback
 */
export const OptimisticButton: React.FC<OptimisticButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  successMessage,
  errorMessage,
  showFeedback = true,
  className = '',
}) => {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-gray-300',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 disabled:bg-gray-300',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const handleClick = async () => {
    if (disabled || isPending) return;

    // Start transition for non-blocking UI updates
    startTransition(async () => {
      try {
        // Provide instant feedback
        setStatus('idle');

        // Execute the actual operation
        await onClick();

        // Show success feedback
        if (showFeedback) {
          setStatus('success');
          setTimeout(() => setStatus('idle'), 2000);
        }
      } catch (error) {
        // Show error feedback
        if (showFeedback) {
          setStatus('error');
          setTimeout(() => setStatus('idle'), 3000);
        }
        console.error('Button action failed:', error);
      }
    });
  };

  const isDisabled = disabled || isPending;

  const renderContent = () => {
    if (isPending) {
      return (
        <>
          <Loader2 className='w-4 h-4 animate-spin mr-2' />
          Loading...
        </>
      );
    }

    if (status === 'success' && successMessage) {
      return (
        <>
          <Check className='w-4 h-4 mr-2' />
          {successMessage}
        </>
      );
    }

    if (status === 'error' && errorMessage) {
      return (
        <>
          <AlertCircle className='w-4 h-4 mr-2' />
          {errorMessage}
        </>
      );
    }

    return children;
  };

  const currentVariant =
    status === 'success' ? 'success' : status === 'error' ? 'danger' : variant;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[currentVariant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}
        ${className}
      `}
    >
      {renderContent()}
    </button>
  );
};

/**
 * Hook for optimistic UI updates
 * Allows components to show expected results immediately while syncing in background
 */
export function useOptimisticAction<T>(
  initialState: T,
  action: (currentState: T, optimisticValue: T) => Promise<T>
) {
  const [optimisticState, setOptimisticState] = useState<T>(initialState);
  const [actualState, setActualState] = useState<T>(initialState);
  const [isPending, startTransition] = useTransition();

  const executeOptimistic = (optimisticValue: T) => {
    // Immediately update UI with optimistic value
    setOptimisticState(optimisticValue);

    // Start background sync
    startTransition(async () => {
      try {
        const result = await action(actualState, optimisticValue);
        setActualState(result);
        setOptimisticState(result);
      } catch (error) {
        // Revert to actual state on error
        setOptimisticState(actualState);
        throw error;
      }
    });
  };

  return {
    state: optimisticState,
    isPending,
    executeOptimistic,
  };
}

/**
 * Component for optimistic list updates (add/remove items instantly)
 */
interface OptimisticListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onAdd?: (item: T) => Promise<void>;
  onRemove?: (item: T) => Promise<void>;
  onUpdate?: (item: T) => Promise<void>;
  className?: string;
}

export function OptimisticList<T>({
  items,
  renderItem,
  keyExtractor,
  onAdd,
  onRemove,
  onUpdate,
  className = '',
}: OptimisticListProps<T>) {
  const { state: optimisticItems, executeOptimistic } = useOptimisticAction(
    items,
    async (currentState, newState) => {
      // This would typically sync with your backend
      return newState;
    }
  );

  const handleAdd = (item: T) => {
    executeOptimistic([...optimisticItems, item]);
    onAdd?.(item);
  };

  const handleRemove = (item: T) => {
    const newItems = optimisticItems.filter(
      i => keyExtractor(i) !== keyExtractor(item)
    );
    executeOptimistic(newItems);
    onRemove?.(item);
  };

  const handleUpdate = (item: T) => {
    const newItems = optimisticItems.map(i =>
      keyExtractor(i) === keyExtractor(item) ? item : i
    );
    executeOptimistic(newItems);
    onUpdate?.(item);
  };

  return (
    <div className={className}>
      {optimisticItems.map((item, index) => (
        <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}
