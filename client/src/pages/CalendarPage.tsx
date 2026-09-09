import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, projectAPI } from '../services/api';
import { Task } from '../types';
import { CalendarMonth } from '../components/calendar/CalendarMonth';
import { CalendarWeek } from '../components/calendar/CalendarWeek';
import { CalendarDay } from '../components/calendar/CalendarDay';
import { TaskDetails } from '../components/tasks/TaskDetails';
import { QuickAddTask } from '../components/tasks/QuickAddTask';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import clsx from 'clsx';

type CalendarViewMode = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | undefined>();

  const { data: taskData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'calendar'],
    queryFn: () => taskAPI.getTasks(),
  });

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
  });

  const tasks = taskData?.tasks || [];
  const projects = projectData?.projects || [];

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) => taskAPI.createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsQuickAddOpen(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      taskAPI.updateTask(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (selectedTask?._id === res.task._id) {
        setSelectedTask(res.task);
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskAPI.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedTask(null);
    },
  });

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectDate = (date: Date) => {
    setQuickAddDate(format(date, 'yyyy-MM-dd'));
    setIsQuickAddOpen(true);
  };

  // Header Title
  const getHeaderTitle = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'week') return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{getHeaderTitle()}</h1>
            <p className="text-xs text-slate-400">Plan and track your milestones across time.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            Today
          </button>

          {/* Prev / Next */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handlePrevious}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Switcher: Month / Week / Day */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs font-medium">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'px-3 py-1 rounded capitalize transition-colors',
                  viewMode === mode
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => {
              setQuickAddDate(format(currentDate, 'yyyy-MM-dd'));
              setIsQuickAddOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Quick Add modal/section if opened */}
      {isQuickAddOpen && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              New task for {quickAddDate}
            </span>
            <button
              onClick={() => setIsQuickAddOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>
          <QuickAddTask
            onAddTask={async (data) => {
              await createTaskMutation.mutateAsync(data);
            }}
            projects={projects}
            defaultDueDate={quickAddDate}
            placeholder="What needs to be done on this date?"
          />
        </div>
      )}

      {/* Main View rendering */}
      {tasksLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading calendar...</p>
        </div>
      ) : (
        <>
          {viewMode === 'month' && (
            <CalendarMonth
              currentDate={currentDate}
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
              onSelectDate={handleSelectDate}
            />
          )}

          {viewMode === 'week' && (
            <CalendarWeek
              currentDate={currentDate}
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
              onSelectDate={handleSelectDate}
            />
          )}

          {viewMode === 'day' && (
            <CalendarDay
              currentDate={currentDate}
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
              onSelectDate={handleSelectDate}
              onToggleComplete={(t) => {
                const newStatus = t.status === 'completed' ? 'todo' : 'completed';
                updateTaskMutation.mutate({ id: t._id, data: { status: newStatus } });
              }}
            />
          )}
        </>
      )}

      {/* Task Details Drawer */}
      <TaskDetails
        task={selectedTask}
        projects={projects}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={async (id, data) => {
          await updateTaskMutation.mutateAsync({ id, data });
        }}
        onDelete={async (id) => {
          await deleteTaskMutation.mutateAsync(id);
        }}
      />
    </div>
  );
}
