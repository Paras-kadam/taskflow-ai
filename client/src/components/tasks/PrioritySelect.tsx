import { TaskPriority } from '../../types';
import { Flag } from 'lucide-react';
import clsx from 'clsx';

interface PrioritySelectProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  className?: string;
}

export const priorityConfig: Record<
  TaskPriority,
  { label: string; color: string; bg: string; border: string; flagColor: string }
> = {
  urgent: {
    label: 'Urgent',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    flagColor: 'text-red-500 fill-red-500',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    flagColor: 'text-orange-500 fill-orange-500',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    flagColor: 'text-yellow-500 fill-yellow-500',
  },
  low: {
    label: 'Low',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    flagColor: 'text-blue-400',
  },
  none: {
    label: 'No Priority',
    color: 'text-slate-400',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
    flagColor: 'text-slate-500',
  },
};

export function PrioritySelect({ value, onChange, className }: PrioritySelectProps) {
  const priorities: TaskPriority[] = ['none', 'low', 'medium', 'high', 'urgent'];

  return (
    <div className={clsx('flex items-center gap-1.5 flex-wrap', className)}>
      {priorities.map((p) => {
        const config = priorityConfig[p];
        const isSelected = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
              isSelected
                ? `${config.bg} ${config.color} ${config.border} ring-1 ring-violet-500/30 font-semibold`
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <Flag className={clsx('w-3.5 h-3.5', config.flagColor)} />
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
