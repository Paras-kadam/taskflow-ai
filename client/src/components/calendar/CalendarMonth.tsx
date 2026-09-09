import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { Task } from '../../types';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

interface CalendarMonthProps {
  currentDate: Date;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onSelectDate: (date: Date) => void;
}

export function CalendarMonth({
  currentDate,
  tasks,
  onSelectTask,
  onSelectDate,
}: CalendarMonthProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map tasks to days
  const getTasksForDay = (day: Date) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      return isSameDay(taskDate, day);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60">
        {weekDayNames.map((name) => (
          <div
            key={name}
            className="py-2.5 text-center text-xs font-semibold text-slate-400 tracking-wider"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const dayTasks = getTasksForDay(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={clsx(
                'min-h-[110px] p-2 transition-colors relative group cursor-pointer flex flex-col',
                isCurrentMonth ? 'bg-slate-900/50 hover:bg-slate-850' : 'bg-slate-950/40 text-slate-600',
                isCurrentDay && 'bg-violet-950/20'
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                    isCurrentDay
                      ? 'bg-violet-600 text-white'
                      : isCurrentMonth
                      ? 'text-slate-200'
                      : 'text-slate-600'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {/* Quick Add button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(day);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-violet-300 hover:bg-slate-800 rounded transition-all"
                  title="Add task on this date"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks within this day */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                {dayTasks.slice(0, 3).map((task) => {
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className={clsx(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium truncate cursor-pointer transition-colors',
                        isCompleted
                          ? 'bg-slate-800/40 text-slate-500 line-through'
                          : task.isOverdue
                          ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      )}
                    >
                      {task.priority && task.priority !== 'none' && (
                        <span
                          className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', {
                            'bg-red-500': task.priority === 'urgent',
                            'bg-orange-500': task.priority === 'high',
                            'bg-yellow-500': task.priority === 'medium',
                            'bg-blue-400': task.priority === 'low',
                          })}
                        />
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-slate-400 px-1 font-medium">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
