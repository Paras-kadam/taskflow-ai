import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, projectAPI, tagAPI } from '../services/api';
import { Task } from '../types';
import { QuickAddTask } from '../components/tasks/QuickAddTask';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDetails } from '../components/tasks/TaskDetails';
import {
  ListTodo,
  Search,
  X,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import clsx from 'clsx';

export default function AllTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || 'all');
  const [showFilters, setShowFilters] = useState(false);

  // Sync tag param
  useEffect(() => {
    const tagFromUrl = searchParams.get('tag');
    if (tagFromUrl) {
      setSelectedTag(tagFromUrl);
      setShowFilters(true);
    }
  }, [searchParams]);

  // Queries
  const { data: taskData, isLoading: tasksLoading } = useQuery({
    queryKey: [
      'tasks',
      'all',
      selectedStatus,
      selectedPriority,
      selectedProjectId,
      selectedTag,
      search,
    ],
    queryFn: () =>
      taskAPI.getTasks({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
        tag: selectedTag !== 'all' ? selectedTag : undefined,
        search: search.trim() || undefined,
      }),
  });

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
  });

  const { data: tagData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagAPI.getTags(),
  });

  const tasks = taskData?.tasks || [];
  const projects = projectData?.projects || [];
  const tags = tagData?.tags || [];

  // Mutations
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

  const clearAllFilters = () => {
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedProjectId('all');
    setSelectedTag('all');
    setSearch('');
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedStatus !== 'all' ||
    selectedPriority !== 'all' ||
    selectedProjectId !== 'all' ||
    selectedTag !== 'all' ||
    search.trim() !== '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">All Tasks</h1>
            <p className="text-xs text-slate-400">
              Browse, filter, and search across every project and category.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            showFilters || hasActiveFilters
              ? 'bg-violet-600/20 border-violet-500 text-violet-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-violet-400 ml-1" />
          )}
        </button>
      </div>

      {/* Filter Controls Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Filter Options
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Status */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all">All Statuses</option>
                <option value="inbox">Inbox</option>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all">All Projects</option>
                <option value="null">No Project (Inbox)</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tag</label>
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  if (e.target.value === 'all') {
                    searchParams.delete('tag');
                    setSearchParams(searchParams);
                  } else {
                    setSearchParams({ tag: e.target.value });
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all">All Tags</option>
                {tags.map((t) => (
                  <option key={t._id} value={t.name}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, description, notes, or tags..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Add */}
      <QuickAddTask
        onAddTask={async (data) => {
          await createTaskMutation.mutateAsync(data);
        }}
        projects={projects}
        placeholder="Add a new task..."
      />

      {/* Task List */}
      {tasksLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading tasks...</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onSelectTask={(task) => setSelectedTask(task)}
          onDeleteTask={(task) => deleteTaskMutation.mutate(task._id)}
          emptyTitle="No tasks matched your criteria"
          emptySubtitle="Try resetting filters or adjusting search queries."
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
