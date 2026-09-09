import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAPI, tagAPI } from '../../services/api';
import { useUiStore } from '../../stores/uiStore';
import { useFocusStore } from '../../stores/focusStore';
import { ProjectForm } from '../projects/ProjectForm';
import clsx from 'clsx';
import {
  Inbox,
  CalendarDays,
  CalendarRange,
  ListTodo,
  CheckCircle2,
  FolderKanban,
  Timer,
  BarChart3,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sun,
  Hash,
} from 'lucide-react';

const mainNav = [
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarDays },
  { to: '/calendar', label: 'Calendar', icon: CalendarRange },
  { to: '/all-tasks', label: 'All Tasks', icon: ListTodo },
  { to: '/completed', label: 'Completed', icon: CheckCircle2 },
];

const bottomNav = [
  { to: '/kanban', label: 'Kanban', icon: FolderKanban },
  { to: '/focus', label: 'Focus Mode', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUiStore();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const queryClient = useQueryClient();

  const focusStatus = useFocusStore((s) => s.status);
  const focusRemainingSeconds = useFocusStore((s) => s.remainingSeconds);

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
  });

  const { data: tagData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagAPI.getTags(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: any) => projectAPI.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const projects = projectData?.projects || [];
  const tags = tagData?.tags || [];

  return (
    <>
      <aside
        className={clsx(
          'h-full flex flex-col bg-slate-900 dark:bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold text-white tracking-tight truncate">
                TaskFlow <span className="text-violet-400">AI</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors hidden lg:flex"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  sidebarCollapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-violet-600/15 text-violet-400 border-l-2 border-violet-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}

          {/* Projects Section */}
          <div className="pt-5">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Projects
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(true)}
                  className="p-1 rounded text-slate-500 hover:text-violet-400 hover:bg-slate-800 transition-colors"
                  title="Create Project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex justify-center mb-2">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-slate-800 transition-colors"
                  title="Create Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Projects List */}
            <div className="space-y-0.5">
              {projects.map((p) => (
                <NavLink
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      sidebarCollapsed && 'justify-center px-2',
                      isActive
                        ? 'bg-violet-600/15 text-violet-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color || '#8b5cf6' }}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate flex-1">{p.name}</span>
                      {(p.remainingTasks || 0) > 0 && (
                        <span className="text-[10px] text-slate-500">
                          {p.remainingTasks}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {!sidebarCollapsed && projects.length === 0 && (
                <p className="px-3 text-[11px] text-slate-600 italic">No projects yet</p>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="pt-4">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tags
                </span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex justify-center mb-2">
                <Hash className="w-4 h-4 text-slate-500" />
              </div>
            )}

            {/* Tags List */}
            <div className="space-y-0.5">
              {tags.map((tag) => (
                <NavLink
                  key={tag._id}
                  to={`/all-tasks?tag=${encodeURIComponent(tag.name)}`}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      sidebarCollapsed && 'justify-center px-2',
                      isActive
                        ? 'bg-violet-600/15 text-violet-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )
                  }
                >
                  <Hash className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate flex-1">{tag.name}</span>
                      {tag.taskCount !== undefined && tag.taskCount > 0 && (
                        <span className="text-[10px] text-slate-500">{tag.taskCount}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {!sidebarCollapsed && tags.length === 0 && (
                <p className="px-3 text-[11px] text-slate-600 italic">No tags yet</p>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-slate-700/50 py-3 px-2 space-y-0.5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  sidebarCollapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-violet-600/15 text-violet-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.to === '/focus' && (focusStatus === 'running' || focusStatus === 'paused') && (
                    <span
                      className={clsx(
                        'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold',
                        focusStatus === 'running'
                          ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                          : 'bg-amber-500/20 text-amber-400'
                      )}
                    >
                      {formatFocusTime(focusRemainingSeconds)}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Add Project Modal */}
      <ProjectForm
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSubmit={async (data) => {
          await createProjectMutation.mutateAsync(data);
        }}
      />
    </>
  );
}
