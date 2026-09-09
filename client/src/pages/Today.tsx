import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, projectAPI } from '../services/api';
import { Task } from '../types';
import { QuickAddTask } from '../components/tasks/QuickAddTask';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDetails } from '../components/tasks/TaskDetails';
import { format } from 'date-fns';
import { Sun, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function Today() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');

  const { data: taskData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => taskAPI.getTasks({ filter: 'today' }),
  });

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
  });

  const tasks = taskData?.tasks || [];
  const projects = projectData?.projects || [];

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter((t) => t.isOverdue).length;

  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) =>
      taskAPI.createTask({ ...newTask, dueDate: todayStr }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTaskMutation.mutate({ id: task._id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Today</h1>
            <p className="text-xs text-slate-400">{todayFormatted}</p>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            {completedCount} of {tasks.length} done
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {overdueCount} overdue
            </span>
          )}
        </div>
      </div>

      {/* Quick Add */}
      <QuickAddTask
        onAddTask={async (data) => {
          await createTaskMutation.mutateAsync(data);
        }}
        projects={projects}
        defaultDueDate={todayStr}
        placeholder="Add task for today..."
      />

      {/* Task List */}
      {tasksLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading today's tasks...</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onSelectTask={(task) => setSelectedTask(task)}
          onDeleteTask={(task) => deleteTaskMutation.mutate(task._id)}
          emptyTitle="You're all caught up for today! 🎉"
          emptySubtitle="No remaining tasks due today. Enjoy your day or plan ahead."
        />
      )}

      {/* Task Details */}
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
