import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, projectAPI } from '../services/api';
import { Task } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetails } from '../components/tasks/TaskDetails';
import { CheckCircle2, Trash2, Loader2 } from 'lucide-react';

export default function Completed() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: taskData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'completed'],
    queryFn: () => taskAPI.getTasks({ filter: 'completed' }),
  });

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
  });

  const tasks = taskData?.tasks || [];
  const projects = projectData?.projects || [];

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      taskAPI.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  const handleRestore = (task: Task) => {
    updateTaskMutation.mutate({ id: task._id, data: { status: 'todo' } });
  };

  const handleClearAll = async () => {
    if (!confirm(`Delete all ${tasks.length} completed tasks permanently?`)) return;
    for (const t of tasks) {
      await taskAPI.deleteTask(t._id);
    }
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Completed</h1>
            <p className="text-xs text-slate-400">
              Celebrate your wins and review finished tasks.
            </p>
          </div>
        </div>

        {tasks.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>

      {/* Task List */}
      {tasksLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading completed tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">No completed tasks yet</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            When you complete tasks, they will appear here so you can review your accomplishments.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onToggleComplete={handleRestore}
              onClick={(t) => setSelectedTask(t)}
              onDelete={(t) => deleteTaskMutation.mutate(t._id)}
            />
          ))}
        </div>
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
