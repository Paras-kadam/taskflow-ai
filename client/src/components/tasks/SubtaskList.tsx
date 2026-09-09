import { useState } from 'react';
import { Subtask } from '../../types';
import { notificationSoundService } from '../../services/notificationSoundService';
import { useAuthStore } from '../../stores/authStore';
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface SubtaskListProps {
  subtasks: Subtask[];
  onChange?: (subtasks: Subtask[]) => void;
  onToggle?: (subtaskId: string) => void;
  onDelete?: (subtaskId: string) => void;
  onAdd?: (title: string) => void;
  editable?: boolean;
}

export function SubtaskList({
  subtasks = [],
  onChange,
  onToggle,
  onDelete,
  onAdd,
  editable = true,
}: SubtaskListProps) {
  const { user } = useAuthStore();
  const [newTitle, setNewTitle] = useState('');

  const total = subtasks.length;
  const completedCount = subtasks.filter((s) => s.completed).length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const handleToggle = (index: number, subtaskId?: string) => {
    const isNowCompleted = !subtasks[index]?.completed;
    if (isNowCompleted) {
      notificationSoundService.playCompletionSound(user?.notificationSettings);
    }

    if (onToggle && subtaskId) {
      onToggle(subtaskId);
      return;
    }

    if (onChange) {
      const updated = subtasks.map((st, i) =>
        i === index ? { ...st, completed: !st.completed } : st
      );
      onChange(updated);
    }
  };

  const handleDelete = (index: number, subtaskId?: string) => {
    if (onDelete && subtaskId) {
      onDelete(subtaskId);
      return;
    }

    if (onChange) {
      const updated = subtasks.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (onAdd) {
      onAdd(newTitle.trim());
      setNewTitle('');
      return;
    }

    if (onChange) {
      const newSubtask: Subtask = {
        _id: Math.random().toString(36).substring(2, 9),
        title: newTitle.trim(),
        completed: false,
      };
      onChange([...subtasks, newSubtask]);
      setNewTitle('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">Subtasks</span>
            <span className="text-slate-300">
              {completedCount} / {total} completed ({percentage}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-300 rounded-full',
                percentage === 100 ? 'bg-green-500' : 'bg-violet-500'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask Items */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {subtasks.map((st, index) => (
          <div
            key={st._id || index}
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition-colors group"
          >
            <button
              type="button"
              onClick={() => handleToggle(index, st._id)}
              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
            >
              {st.completed ? (
                <CheckSquare className="w-4 h-4 text-violet-400 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-400 flex-shrink-0" />
              )}
              <span
                className={clsx(
                  'text-xs truncate transition-all',
                  st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                )}
              >
                {st.title}
              </span>
            </button>

            {editable && (
              <button
                type="button"
                onClick={() => handleDelete(index, st._id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                title="Delete subtask"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Subtask Input */}
      {editable && (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add subtask..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
