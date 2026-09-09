import { Task, ProjectSummary } from '../../types';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Clock,
  CheckSquare,
  Repeat,
  Bell,
  Trash2,
  Flag,
  Lock,
  Copy,
  Archive,
} from 'lucide-react';
import { priorityConfig } from './PrioritySelect';
import { notificationSoundService } from '../../services/notificationSoundService';
import { useAuthStore } from '../../stores/authStore';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onClick: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  className?: string;
}

export function TaskCard({
  task,
  onToggleComplete,
  onClick,
  onDelete,
  onDuplicate,
  onArchive,
  className,
}: TaskCardProps) {
  const { user } = useAuthStore();
  const isCompleted = task.status === 'completed';
  const priority = priorityConfig[task.priority || 'none'];

  // Project data helper
  const project = typeof task.projectId === 'object' && task.projectId !== null
    ? (task.projectId as ProjectSummary)
    : null;

  // Format Due Date
  const formatDueDate = () => {
    if (!task.dueDate) return null;
    const date = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);

    if (isToday(date)) {
      return { text: 'Today', isToday: true, isOverdue: false };
    }
    if (isTomorrow(date)) {
      return { text: 'Tomorrow', isToday: false, isOverdue: false };
    }
    return {
      text: format(date, 'MMM d'),
      isToday: false,
      isOverdue: task.isOverdue,
    };
  };

  const dueInfo = formatDueDate();
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      onClick={() => onClick(task)}
      className={clsx(
        'group flex items-start gap-3 p-3.5 bg-slate-900 border rounded-xl hover:border-slate-700 transition-all cursor-pointer select-none',
        isCompleted
          ? 'opacity-60 bg-slate-900/50 border-slate-800'
          : 'border-slate-800 hover:bg-slate-850 hover:shadow-md hover:shadow-black/20',
        className
      )}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isCompleted) {
            notificationSoundService.playCompletionSound(user?.notificationSettings);
          }
          onToggleComplete(task);
        }}
        className="mt-0.5 text-slate-500 hover:text-violet-400 transition-colors flex-shrink-0"
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-violet-500 fill-violet-500/20" />
        ) : (
          <Circle className="w-5 h-5 hover:text-violet-400" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        {/* Title & Priority Flag */}
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'text-sm font-medium tracking-tight truncate',
              isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
            )}
          >
            {task.title}
          </span>

          {task.priority && task.priority !== 'none' && (
            <Flag className={clsx('w-3.5 h-3.5 flex-shrink-0', priority.flagColor)} />
          )}
        </div>

        {/* Description snippet */}
        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {task.description}
          </p>
        )}

        {/* Badges / Meta Info */}
        <div className="flex items-center gap-2 flex-wrap mt-2 text-xs">
          {/* Due date badge */}
          {dueInfo && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px]',
                task.isOverdue
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : dueInfo.isToday
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-800 text-slate-400'
              )}
            >
              <Clock className="w-3 h-3" />
              {task.isOverdue ? 'Overdue' : dueInfo.text}
              {task.dueTime && ` ${task.dueTime}`}
            </span>
          )}

          {/* Project badge */}
          {project && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: project.color || '#8b5cf6' }}
              />
              {project.name}
            </span>
          )}

          {/* Blocked dependency badge */}
          {task.isBlocked && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[11px] font-medium"
              title="Blocked by uncompleted dependencies"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              Blocked
            </span>
          )}

          {/* Subtasks progress badge */}
          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px]">
              <CheckSquare className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {/* Recurring task icon */}
          {task.recurrence && task.recurrence.type !== 'none' && (
            <span className="p-1 rounded bg-slate-800 text-violet-400" title={`Repeats ${task.recurrence.type}`}>
              <Repeat className="w-3 h-3" />
            </span>
          )}

          {/* Reminder icon */}
          {task.reminder && task.reminder !== 'none' && (
            <span className="p-1 rounded bg-slate-800 text-slate-400" title="Reminder set">
              <Bell className="w-3 h-3" />
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-300 text-[10px]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons (visible on hover) */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        {onDuplicate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(task);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Duplicate task"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
        {onArchive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(task);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={task.status === 'archived' ? 'Unarchive task' : 'Archive task'}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
