import { useState, useRef, useEffect } from 'react';
import { Task, TaskPriority, Project } from '../../types';
import { Plus, Calendar, Flag, Folder, X, CornerDownLeft, Sparkles } from 'lucide-react';
import { aiAPI } from '../../services/api';
import { PrioritySelect } from './PrioritySelect';
import { DateTimePicker } from './DateTimePicker';
import clsx from 'clsx';

interface QuickAddTaskProps {
  onAddTask: (data: Partial<Task>) => Promise<void>;
  projects?: Project[];
  defaultProjectId?: string;
  defaultDueDate?: string;
  placeholder?: string;
  className?: string;
}

export function QuickAddTask({
  onAddTask,
  projects = [],
  defaultProjectId,
  defaultDueDate,
  placeholder = 'Add a task... Press Enter to save',
  className,
}: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [dueDate, setDueDate] = useState<string | undefined>(defaultDueDate);
  const [dueTime, setDueTime] = useState<string | undefined>();
  const [reminder, setReminder] = useState<string>('none');
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocusEvent = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (isInput) return;

      if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener('focus-quick-add', handleFocusEvent);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('focus-quick-add', handleFocusEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAIParse = async () => {
    if (!title.trim()) return;
    try {
      const res = await aiAPI.parseTask(title);
      setTitle(res.parsed.title);
      if (res.parsed.priority !== 'none') setPriority(res.parsed.priority);
      if (res.parsed.dueDate) setDueDate(res.parsed.dueDate.split('T')[0]);
      if (res.parsed.dueTime) setDueTime(res.parsed.dueTime);
      if (res.parsed.tags?.length > 0) {
        setTags(Array.from(new Set([...tags, ...res.parsed.tags])));
      }
    } catch (err) {
      console.error('AI parse error:', err);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalTitle = title.trim();
      let finalPriority = priority;
      let finalDueDate = dueDate;
      let finalDueTime = dueTime;
      let finalTags = [...tags];

      // Auto AI parse if user typed special cues
      if (
        finalTitle.includes('#') ||
        /\b(today|tomorrow|at \d|priority|urgent)\b/i.test(finalTitle)
      ) {
        try {
          const res = await aiAPI.parseTask(finalTitle);
          finalTitle = res.parsed.title;
          if (res.parsed.priority !== 'none') finalPriority = res.parsed.priority;
          if (res.parsed.dueDate) finalDueDate = res.parsed.dueDate.split('T')[0];
          if (res.parsed.dueTime) finalDueTime = res.parsed.dueTime;
          if (res.parsed.tags?.length > 0) {
            finalTags = Array.from(new Set([...finalTags, ...res.parsed.tags]));
          }
        } catch {
          // Fallback to direct input
        }
      }

      await onAddTask({
        title: finalTitle,
        priority: finalPriority,
        dueDate: finalDueDate,
        dueTime: finalDueTime,
        reminder,
        projectId: projectId || null,
        tags: finalTags,
        status: 'todo',
      });

      // Reset form
      setTitle('');
      setPriority('none');
      setDueDate(defaultDueDate);
      setDueTime(undefined);
      setReminder('none');
      setProjectId(defaultProjectId);
      setTags([]);
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setShowProjectPicker(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={clsx(
          'w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed text-sm font-medium transition-all text-left',
          'border-slate-700/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:border-violet-500/50',
          className
        )}
      >
        <Plus className="w-4 h-4 text-violet-400" />
        <span>{placeholder}</span>
        <span className="ml-auto text-xs text-slate-500 hidden sm:inline">Press "N"</span>
      </button>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-700 bg-slate-900 p-3.5 shadow-lg animate-in fade-in duration-150',
        className
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title Input */}
        <input
          ref={inputRef}
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title... (e.g. Complete Java DSA)"
          className="w-full bg-transparent text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {/* Tags preview */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-xs text-violet-300 border border-violet-500/20"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Date Picker Expandable */}
        {showDatePicker && (
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <DateTimePicker
              dueDate={dueDate}
              dueTime={dueTime}
              reminder={reminder}
              onDateChange={setDueDate}
              onTimeChange={setDueTime}
              onReminderChange={(r) => setReminder(r || 'none')}
            />
          </div>
        )}

        {/* Priority Picker Expandable */}
        {showPriorityPicker && (
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <PrioritySelect value={priority} onChange={setPriority} />
          </div>
        )}

        {/* Project Selector Expandable */}
        {showProjectPicker && projects.length > 0 && (
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setProjectId(undefined)}
              className={clsx(
                'px-2.5 py-1 text-xs rounded-lg border transition-colors',
                !projectId
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              )}
            >
              No Project
            </button>
            {projects.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => setProjectId(p._id)}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors',
                  projectId === p._id
                    ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.color || '#8b5cf6' }}
                />
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Quick Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {/* Due date trigger */}
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                dueDate
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{dueDate || 'Due date'}</span>
            </button>

            {/* Priority trigger */}
            <button
              type="button"
              onClick={() => setShowPriorityPicker(!showPriorityPicker)}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                priority !== 'none'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              )}
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="capitalize">{priority === 'none' ? 'Priority' : priority}</span>
            </button>

            {/* Project trigger */}
            {projects.length > 0 && (
              <button
                type="button"
                onClick={() => setShowProjectPicker(!showProjectPicker)}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  projectId
                    ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                )}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>
                  {projects.find((p) => p._id === projectId)?.name || 'Project'}
                </span>
              </button>
            )}

            {/* Tag inline adder */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="#tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="w-16 sm:w-20 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* AI Parse Button */}
            <button
              type="button"
              onClick={handleAIParse}
              className="p-1.5 rounded-lg bg-violet-950/40 border border-violet-800/40 text-violet-400 hover:text-violet-300 hover:bg-violet-900/40 transition-colors"
              title="Parse with AI (auto-detect date, time, priority, tags)"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cancel and Submit buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-medium transition-colors"
            >
              <span>Add</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
