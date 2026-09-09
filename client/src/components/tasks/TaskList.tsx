import { useState } from 'react';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { CheckCircle2, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onDuplicateTask?: (task: Task) => void;
  onArchiveTask?: (task: Task) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  className?: string;
}

export function TaskList({
  tasks,
  onToggleComplete,
  onSelectTask,
  onDeleteTask,
  onDuplicateTask,
  onArchiveTask,
  emptyTitle = "You're all caught up 🎉",
  emptySubtitle = 'No tasks found. Relax or add a new task to get ahead.',
  className,
}: TaskListProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'dueDate' | 'priority' | 'title'>('order');

  const filteredTasks = tasks.filter((t) => {
    if (filterTab === 'active') return t.status !== 'completed';
    if (filterTab === 'completed') return t.status === 'completed';
    return true;
  });

  const priorityWeight: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return (priorityWeight[b.priority || 'none'] || 0) - (priorityWeight[a.priority || 'none'] || 0);
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return a.order - b.order;
  });

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7 text-violet-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">{emptyTitle}</h3>
        <p className="text-xs text-slate-400 max-w-sm">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {/* List Toolbar */}
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={clsx(
                'px-2.5 py-1 rounded-md capitalize font-medium transition-colors',
                filterTab === tab
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none text-xs"
          >
            <option value="order">Custom Order</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-2">
        {sortedTasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onToggleComplete={onToggleComplete}
            onClick={onSelectTask}
            onDelete={onDeleteTask}
            onDuplicate={onDuplicateTask}
            onArchive={onArchiveTask}
          />
        ))}
      </div>
    </div>
  );
}
