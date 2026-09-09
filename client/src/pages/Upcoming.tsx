import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, projectAPI } from '../services/api';
import { Task } from '../types';
import { QuickAddTask } from '../components/tasks/QuickAddTask';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDetails } from '../components/tasks/TaskDetails';
import { CalendarDays, Loader2 } from 'lucide-react';

export default function Upcoming() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: taskData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'upcoming'],
    queryFn: () => taskAPI.getTasks({ filter: 'upcoming' }),
  });

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
  });

  const tasks = taskData?.tasks || [];
  const projects = projectData?.projects || [];

  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) => taskAPI.createTask(newTask),
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Upcoming</h1>
            <p className="text-xs text-slate-400">Stay ahead with your scheduled future tasks.</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Quick Add */}
      <QuickAddTask
        onAddTask={async (data) => {
          await createTaskMutation.mutateAsync(data);
        }}
        projects={projects}
        placeholder="Schedule a future task..."
      />

      {/* Tasks List */}
      {tasksLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading upcoming tasks...</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onSelectTask={(task) => setSelectedTask(task)}
          onDeleteTask={(task) => deleteTaskMutation.mutate(task._id)}
          emptyTitle="No upcoming tasks scheduled 📅"
          emptySubtitle="Your upcoming schedule is clear. Plan ahead by adding future tasks."
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
