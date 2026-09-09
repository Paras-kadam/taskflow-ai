import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, projectAPI } from '../services/api';
import { Task, TaskStatus } from '../types';
import { TaskDetails } from '../components/tasks/TaskDetails';
import { priorityConfig } from '../components/tasks/PrioritySelect';
import {
  FolderKanban,
  Plus,
  Clock,
  Loader2,
  Flag,
} from 'lucide-react';
import clsx from 'clsx';

const columns: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'inbox', label: 'Inbox', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { id: 'todo', label: 'To Do', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'in-progress', label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'completed', label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10' },
];

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingToStatus, setAddingToStatus] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const { data: taskData, isLoading } = useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: () => taskAPI.getTasks(),
  });

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
  });

  const tasks = taskData?.tasks || [];
  const projects = projectData?.projects || [];

  // Mutations
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

  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) => taskAPI.createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setAddingToStatus(null);
      setNewTitle('');
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

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDrop = async (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverColumn(null);

    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === columnId) return;

    // Optimistically update
    updateTaskMutation.mutate({ id: taskId, data: { status: columnId } });
  };

  const handleQuickAdd = async (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    await createTaskMutation.mutateAsync({
      title: newTitle.trim(),
      status,
    });
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Kanban Board</h1>
            <p className="text-xs text-slate-400">
              Drag and drop cards across columns to progress your workflow.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading board...</p>
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            const isTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={clsx(
                  'rounded-2xl border bg-slate-900/90 p-3.5 flex flex-col min-h-[550px] transition-all duration-200',
                  isTarget
                    ? 'border-violet-500 bg-violet-950/20 ring-2 ring-violet-500/30'
                    : 'border-slate-800'
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-xs font-bold tracking-wider uppercase', col.color)}>
                      {col.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAddingToStatus(col.id);
                      setNewTitle('');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title={`Add task to ${col.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Quick Add Input */}
                {addingToStatus === col.id && (
                  <div className="mb-3 p-2.5 rounded-xl bg-slate-800 border border-slate-700 space-y-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Task title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(col.id);
                        if (e.key === 'Escape') setAddingToStatus(null);
                      }}
                      className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAddingToStatus(null)}
                        className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(col.id)}
                        disabled={!newTitle.trim()}
                        className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white text-[11px] font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Task Cards in this column */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {columnTasks.map((task) => {
                    const priority = priorityConfig[task.priority || 'none'];
                    const project =
                      typeof task.projectId === 'object' && task.projectId !== null
                        ? task.projectId
                        : null;

                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onClick={() => setSelectedTask(task)}
                        className={clsx(
                          'p-3 rounded-xl border bg-slate-850 hover:bg-slate-800 border-slate-750 hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing shadow-sm group',
                          draggedTaskId === task._id && 'opacity-40 scale-95'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-200 leading-snug line-clamp-2">
                            {task.title}
                          </p>
                          {task.priority && task.priority !== 'none' && (
                            <Flag
                              className={clsx('w-3 h-3 flex-shrink-0 mt-0.5', priority.flagColor)}
                            />
                          )}
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {task.description}
                          </p>
                        )}

                        {/* Card metadata badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-3 text-[10px]">
                          {project && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: project.color || '#8b5cf6' }}
                              />
                              {project.name}
                            </span>
                          )}

                          {task.dueDate && (
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium',
                                task.isOverdue
                                  ? 'bg-red-500/15 text-red-300'
                                  : 'bg-slate-800 text-slate-400'
                              )}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {task.dueDate.split('T')[0]}
                            </span>
                          )}

                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="py-12 text-center text-slate-600 text-xs italic border border-dashed border-slate-800 rounded-xl">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
