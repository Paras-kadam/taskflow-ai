import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl bg-white dark:bg-slate-900 transition-all';
    
    const variants = {
      default: 'border border-slate-200 dark:border-slate-800 shadow-sm',
      elevated: 'shadow-md border border-slate-100 dark:border-slate-800 dark:shadow-slate-900/50',
      outlined: 'border-2 border-slate-200 dark:border-slate-800',
    };
    
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    };

    const hoverStyles = hover ? 'hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/50 cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
