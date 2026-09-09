import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { Task } from '../../types';
import { Plus, Clock } from 'lucide-react';
import clsx from 'clsx';

interface CalendarWeekProps {
  currentDate: Date;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onSelectDate: (date: Date) => void;
}

export function CalendarWeek({
  currentDate,
  tasks,
  onSelectTask,
  onSelectDate,
}: CalendarWeekProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(weekStart);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      return isSameDay(new Date(t.dueDate), day);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* 7 Columns for the week */}
      <div className="grid grid-cols-7 divide-x divide-slate-800 min-h-[500px]">
        {days.map((day) => {
          const isCurrentDay = isToday(day);
          const dayTasks = getTasksForDay(day);

          return (
            <div
              key={day.toISOString()}
              className={clsx(
                'flex flex-col p-3 transition-colors',
                isCurrentDay ? 'bg-violet-950/15' : 'bg-slate-900/50'
              )}
            >
              {/* Day column header */}
              <div className="flex flex-col items-center pb-3 mb-3 border-b border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {format(day, 'EEE')}
                </span>
                <span
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1',
                    isCurrentDay
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-200'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className="mt-2 text-[11px] text-slate-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              {/* Day tasks cards */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayTasks.map((task) => {
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task._id}
                      onClick={() => onSelectTask(task)}
                      className={clsx(
                        'p-2.5 rounded-xl border transition-all cursor-pointer group',
                        isCompleted
                          ? 'bg-slate-800/30 border-slate-800 text-slate-500 line-through'
                          : task.isOverdue
                          ? 'bg-red-500/10 border-red-500/20 text-red-300'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-200 hover:border-slate-600'
                      )}
                    >
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      {task.dueTime && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.dueTime}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {dayTasks.length === 0 && (
                  <p className="text-[11px] text-slate-600 text-center pt-8 italic">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
