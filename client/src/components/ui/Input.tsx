import { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, multiline = false, ...props }, ref) => {
    const inputStyles = cn(
      'flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-500',
      error && 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      multiline ? 'min-h-[80px]' : 'h-10',
      className
    );

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}
          
          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              className={inputStyles}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              className={inputStyles}
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {rightIcon && (
            <div className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
