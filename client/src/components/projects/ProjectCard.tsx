import { Project } from '../../types';
import { Folder, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const total = project.totalTasks || 0;
  const completed = project.completedTasks || 0;
  const progress = project.progress || 0;

  return (
    <Link
      to={`/projects/${project._id}`}
      className={clsx(
        'group block p-4 rounded-xl border border-slate-700/60 bg-slate-900/80 hover:bg-slate-900 hover:border-slate-600 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${project.color || '#8b5cf6'}20`,
              color: project.color || '#8b5cf6',
            }}
          >
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-violet-400 transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-xs text-slate-400 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </div>

      {/* Progress */}
      <div className="space-y-1.5 mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span>
              {completed} of {total} completed
            </span>
          </div>
          <span className="font-medium text-slate-300">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: project.color || '#8b5cf6',
            }}
          />
        </div>
      </div>
    </Link>
  );
}
