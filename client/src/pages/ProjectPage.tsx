import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAPI, taskAPI } from '../services/api';
import { Task, Project } from '../types';
import { QuickAddTask } from '../components/tasks/QuickAddTask';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDetails } from '../components/tasks/TaskDetails';
import { ProjectForm } from '../components/projects/ProjectForm';
import {
  Folder,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectAPI.getProjectById(id!),
    enabled: !!id,
  });

  const project = data?.project;
  const tasks = data?.tasks || [];

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) =>
      taskAPI.createTask({ ...newTask, projectId: id, status: 'todo' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      taskAPI.updateTask(taskId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (selectedTask?._id === res.task._id) {
        setSelectedTask(res.task);
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskAPI.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTask(null);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (updateData: Partial<Project>) =>
      projectAPI.updateProject(id!, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectAPI.deleteProject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/inbox');
    },
  });

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTaskMutation.mutate({ taskId: task._id, data: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <h2 className="text-lg font-semibold text-slate-200">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This project may have been deleted or moved.</p>
        <button
          onClick={() => navigate('/inbox')}
          className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  const priorityDist = project.priorityDistribution || {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Project Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${project.color || '#8b5cf6'}20`,
                color: project.color || '#8b5cf6',
              }}
            >
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{project.name}</h1>
              {project.description && (
                <p className="text-xs text-slate-400 mt-1">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditProjectOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Edit project"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete project "${project.name}"? Tasks inside will be moved to Inbox.`)) {
                  deleteProjectMutation.mutate();
                }
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Progress</span>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{project.progress || 0}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Total Tasks</span>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{project.totalTasks || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Completed</span>
            <p className="text-xl font-bold text-green-400 mt-0.5">{project.completedTasks || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Remaining</span>
            <p className="text-xl font-bold text-violet-400 mt-0.5">{project.remainingTasks || 0}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${project.progress || 0}%`,
              backgroundColor: project.color || '#8b5cf6',
            }}
          />
        </div>

        {/* Priority Distribution Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-500 text-[11px] font-medium mr-1">Priorities:</span>
          {priorityDist.urgent > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[11px]">
              {priorityDist.urgent} Urgent
            </span>
          )}
          {priorityDist.high > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px]">
              {priorityDist.high} High
            </span>
          )}
          {priorityDist.medium > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[11px]">
              {priorityDist.medium} Medium
            </span>
          )}
          {priorityDist.low > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px]">
              {priorityDist.low} Low
            </span>
          )}
          {tasks.length === 0 && (
            <span className="text-slate-500 text-xs">No tasks yet</span>
          )}
        </div>
      </div>

      {/* Quick Add Task in this Project */}
      <QuickAddTask
        onAddTask={async (newTask) => {
          await createTaskMutation.mutateAsync(newTask);
        }}
        defaultProjectId={id}
        placeholder={`Add task to ${project.name}...`}
      />

      {/* Tasks List */}
      <TaskList
        tasks={tasks}
        onToggleComplete={handleToggleComplete}
        onSelectTask={(t) => setSelectedTask(t)}
        onDeleteTask={(t) => deleteTaskMutation.mutate(t._id)}
        emptyTitle={`No tasks in ${project.name}`}
        emptySubtitle="Get started by adding the first milestone or task above."
      />

      {/* Task Details Drawer */}
      <TaskDetails
        task={selectedTask}
        projects={project ? [project] : []}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={async (taskId, updateData) => {
          await updateTaskMutation.mutateAsync({ taskId, data: updateData });
        }}
        onDelete={async (taskId) => {
          await deleteTaskMutation.mutateAsync(taskId);
        }}
      />

      {/* Edit Project Modal */}
      <ProjectForm
        project={project}
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        onSubmit={async (updateData) => {
          await updateProjectMutation.mutateAsync(updateData);
        }}
      />
    </div>
  );
}
