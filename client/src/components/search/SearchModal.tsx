import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { taskAPI, projectAPI } from '../../services/api';
import { useUiStore } from '../../stores/uiStore';
import { Task, Project } from '../../types';
import { Search, X, CheckCircle2, Circle, Folder, Clock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export function SearchModal() {
  const { searchOpen, toggleSearch } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [searchOpen]);

  // Global Keyboard shortcuts: "/" or "Ctrl+K" / "Cmd+K" to open, "Escape" to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      } else if (e.key === '/' && !isInput && !searchOpen) {
        e.preventDefault();
        toggleSearch();
      } else if (e.key === 'Escape' && searchOpen) {
        toggleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, toggleSearch]);

  // Query tasks
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => taskAPI.getTasks({ search: searchTerm }),
    enabled: searchOpen && searchTerm.trim().length > 0,
  });

  // Query projects
  const { data: projectData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects(),
    enabled: searchOpen,
  });

  if (!searchOpen) return null;

  const tasks = taskData?.tasks || [];
  const allProjects = projectData?.projects || [];
  const matchedProjects = searchTerm.trim()
    ? allProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSelectTask = (task: Task) => {
    toggleSearch();
    if (task.projectId && typeof task.projectId === 'object') {
      navigate(`/projects/${task.projectId._id}`);
    } else if (typeof task.projectId === 'string') {
      navigate(`/projects/${task.projectId}`);
    } else {
      navigate('/inbox');
    }
  };

  const handleSelectProject = (project: Project) => {
    toggleSearch();
    navigate(`/projects/${project._id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-20"
      onClick={toggleSearch}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, descriptions, tags, projects..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Projects matched */}
          {matchedProjects.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5 block">
                Projects
              </span>
              <div className="space-y-1">
                {matchedProjects.map((project) => (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => handleSelectProject(project)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${project.color || '#8b5cf6'}20`,
                          color: project.color || '#8b5cf6',
                        }}
                      >
                        <Folder className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-violet-300">
                        {project.name}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks matched */}
          {tasks.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5 block">
                Tasks ({tasks.length})
              </span>
              <div className="space-y-1">
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    type="button"
                    onClick={() => handleSelectTask(task)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={clsx(
                            'text-xs font-medium truncate',
                            task.status === 'completed'
                              ? 'line-through text-slate-500'
                              : 'text-slate-200 group-hover:text-violet-300'
                          )}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3 text-[11px] text-slate-500">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate.split('T')[0]}
                        </span>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-violet-400 text-[10px]">
                          #{task.tags[0]}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {searchTerm.trim().length > 0 && tasks.length === 0 && matchedProjects.length === 0 && !isLoading && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No results found for "<span className="text-slate-200">{searchTerm}</span>"
            </div>
          )}

          {/* Initial state before search */}
          {!searchTerm.trim() && (
            <div className="py-8 text-center text-slate-500 text-xs">
              Type anything to quickly search across tasks, tags, and projects.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
