import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error';
  inputSize?: 'sm' | 'md';
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', inputSize = 'md', className, ...props }, ref) => {
    const baseClasses = 'input';
    
    const variantClasses = {
      default: '',
      error: 'input-error',
    };

    const sizeClasses = {
      sm: 'input-sm',
      md: '',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[inputSize],
      className
    );

    return (
      <input
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error';
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant = 'default', className, ...props }, ref) => {
    const baseClasses = 'input resize-none';
    
    const variantClasses = {
      default: '',
      error: 'input-error',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      className
    );

    return (
      <textarea
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export interface FormFieldProps {
  label?: string;
  error?: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  help,
  required,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
      {help && !error && (
        <p className="text-sm text-neutral-500">{help}</p>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';

export { Input, Textarea, FormField }; 