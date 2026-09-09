import { useState, useRef, useEffect, ReactNode } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ children, content, position = 'top', delay = 300 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const positions = {
          top: { top: rect.top - 8, left: rect.left + rect.width / 2 },
          bottom: { top: rect.bottom + 8, left: rect.left + rect.width / 2 },
          left: { top: rect.top + rect.height / 2, left: rect.left - 8 },
          right: { top: rect.top + rect.height / 2, left: rect.right + 8 },
        };
        setCoords(positions[position]);
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          className={clsx(
            'fixed z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none',
            position === 'top' && '-translate-x-1/2 -translate-y-full',
            position === 'bottom' && '-translate-x-1/2',
            position === 'left' && '-translate-x-full -translate-y-1/2',
            position === 'right' && '-translate-y-1/2'
          )}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
