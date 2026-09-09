import { isSameDay, format } from 'date-fns';
import { Task } from '../../types';
import { Clock, Plus, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

interface CalendarDayProps {
  currentDate: Date;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onSelectDate: (date: Date) => void;
  onToggleComplete?: (task: Task) => void;
}

export function CalendarDay({
  currentDate,
  tasks,
  onSelectTask,
  onSelectDate,
  onToggleComplete,
}: CalendarDayProps) {
  const dayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return isSameDay(new Date(t.dueDate), currentDate);
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'} scheduled for this day
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectDate(currentDate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task List for the day */}
      <div className="space-y-3 max-w-2xl">
        {dayTasks.map((task) => {
          const isCompleted = task.status === 'completed';

          return (
            <div
              key={task._id}
              onClick={() => onSelectTask(task)}
              className={clsx(
                'flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer',
                isCompleted
                  ? 'bg-slate-800/30 border-slate-800 text-slate-500'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-200 hover:border-slate-600'
              )}
            >
              <div className="flex items-center gap-3">
                {onToggleComplete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(task);
                    }}
                    className="text-slate-500 hover:text-violet-400"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-violet-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                )}
                <div>
                  <h4 className={clsx('text-sm font-medium', isCompleted && 'line-through text-slate-500')}>
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                  )}
                </div>
              </div>

              {task.dueTime && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span>{task.dueTime}</span>
                </div>
              )}
            </div>
          );
        })}

        {dayTasks.length === 0 && (
          <div className="py-16 text-center text-slate-500 text-xs">
            No tasks scheduled for this day. Click "+ Add Task" to schedule one.
          </div>
        )}
      </div>
    </div>
  );
}
