import { useState } from 'react';
import { Project } from '../../types';
import { X, Folder, Palette, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ProjectFormProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project>) => Promise<void>;
}

const colorPresets = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export function ProjectForm({ project, isOpen, onClose, onSubmit }: ProjectFormProps) {
  if (!isOpen) return null;

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || '#8b5cf6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/70 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Folder className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. College, Work, Personal"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-violet-400" />
              Project Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-transform',
                    color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-medium transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{project ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
