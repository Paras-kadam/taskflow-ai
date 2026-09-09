import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export function Skeleton({ variant = 'text', width, height, className, count = 1 }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-700/50 rounded';
  const items = Array.from({ length: count });

  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'rect':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded h-4 w-full';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={clsx(baseClasses, getVariantClasses(), className, i > 0 && 'mt-2')}
          style={style}
        />
      ))}
    </>
  );
}
