import { useState, useEffect } from 'react';
import { Task, Project, Subtask, TaskStatus, TaskPriority, RecurrencePattern } from '../../types';
import {
  X,
  CheckCircle2,
  Circle,
  Clock,
  Repeat,
  Tag as TagIcon,
  Play,
  Pause,
  Trash2,
  Copy,
  Save,
  Loader2,
  FileText,
  Sparkles,
  Link2,
  Lock,
  Archive,
} from 'lucide-react';
import { aiAPI, timeAPI, taskAPI } from '../../services/api';
import { PrioritySelect } from './PrioritySelect';
import { DateTimePicker } from './DateTimePicker';
import { SubtaskList } from './SubtaskList';
import { notificationSoundService } from '../../services/notificationSoundService';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';
import clsx from 'clsx';

interface TaskDetailsProps {
  task: Task | null;
  projects?: Project[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onDuplicate?: (task: Task) => Promise<void>;
}

export function TaskDetails({
  task,
  projects = [],
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}: TaskDetailsProps) {
  if (!task || !isOpen) return null;

  const { user } = useAuthStore();

  // Local state for editing
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState<string | undefined>(
    task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : undefined
  );
  const [dueTime, setDueTime] = useState<string | undefined>(task.dueTime);
  const [reminder, setReminder] = useState<string>(task.reminder || 'none');
  const [projectId, setProjectId] = useState<string | undefined>(
    typeof task.projectId === 'object' && task.projectId !== null
      ? task.projectId._id
      : (task.projectId as string) || undefined
  );
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [notes, setNotes] = useState(task.notes || '');
  const [recurrence, setRecurrence] = useState<RecurrencePattern>(
    task.recurrence || { type: 'none', interval: 1, daysOfWeek: [] }
  );

  // Time Tracking (Requirement #24)
  const [estimatedDuration, setEstimatedDuration] = useState<number>(task.estimatedDuration || 0);
  const [actualDuration, setActualDuration] = useState<number>(task.actualDuration || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Task Dependencies
  const [dependencies, setDependencies] = useState<any[]>(task.dependencies || []);
  const [candidateTasks, setCandidateTasks] = useState<Task[]>([]);
  const [selectedDepId, setSelectedDepId] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  // Load candidate tasks for dependencies
  useEffect(() => {
    if (isOpen) {
      taskAPI.getTasks().then((res) => {
        setCandidateTasks((res.tasks || []).filter((t) => t._id !== task._id));
      }).catch(() => {});
    }
  }, [isOpen, task._id]);

  // Sync state when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : undefined);
    setDueTime(task.dueTime);
    setReminder(task.reminder || 'none');
    setProjectId(
      typeof task.projectId === 'object' && task.projectId !== null
        ? task.projectId._id
        : (task.projectId as string) || undefined
    );
    setTags(task.tags || []);
    setSubtasks(task.subtasks || []);
    setNotes(task.notes || '');
    setRecurrence(task.recurrence || { type: 'none', interval: 1, daysOfWeek: [] });
    setEstimatedDuration(task.estimatedDuration || 0);
    setActualDuration(task.actualDuration || 0);
    setDependencies(task.dependencies || []);
    setIsTimerRunning(false);
    setActiveSeconds(0);
  }, [task]);

  // Live Timer effect (ticks every second)
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setActiveSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleToggleTimer = async () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      setActiveSeconds(0);
      try {
        const res = await timeAPI.startTimer(task._id);
        setActiveSessionId(res.session?._id || null);
      } catch (err) {
        console.error('Failed to start session', err);
      }
    } else {
      setIsTimerRunning(false);
      try {
        const res = await timeAPI.stopTimer({
          taskId: task._id,
          sessionId: activeSessionId || undefined,
          duration: activeSeconds,
        });
        if (res.task) {
          setActualDuration(res.task.actualDuration || 0);
          await onUpdate(task._id, { actualDuration: res.task.actualDuration });
        }
      } catch (err) {
        console.error('Failed to stop session', err);
      }
    }
  };

  const handleAddDependency = async () => {
    if (!selectedDepId) return;
    const currentIds = dependencies.map((d) => (typeof d === 'object' && d !== null ? d._id : d));
    if (currentIds.includes(selectedDepId)) return;
    const newIds = [...currentIds, selectedDepId];
    try {
      const res = await taskAPI.updateDependencies(task._id, newIds);
      setDependencies(res.task.dependencies || []);
      setSelectedDepId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    const currentIds = dependencies.map((d) => (typeof d === 'object' && d !== null ? d._id : d));
    const newIds = currentIds.filter((id) => id !== depId);
    try {
      const res = await taskAPI.updateDependencies(task._id, newIds);
      setDependencies(res.task.dependencies || []);
    } catch (err: any) {
      console.error('Failed to remove dependency', err);
    }
  };

  const handleDuplicate = async () => {
    if (onDuplicate) {
      await onDuplicate(task);
    } else {
      await taskAPI.duplicateTask(task._id);
    }
    onClose();
  };

  const handleArchive = async () => {
    await taskAPI.archiveTask(task._id);
    onClose();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(task._id, {
        title,
        description,
        status,
        priority,
        dueDate,
        dueTime,
        reminder,
        projectId: projectId || null,
        tags,
        subtasks,
        notes,
        recurrence,
        estimatedDuration,
        actualDuration,
      });
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    const newStatus = status === 'completed' ? 'todo' : 'completed';
    if (newStatus === 'completed') {
      notificationSoundService.playCompletionSound(user?.notificationSettings);
    }
    setStatus(newStatus);
    await onUpdate(task._id, { status: newStatus });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAIBreakdown = async () => {
    if (!title.trim()) return;
    setIsBreakingDown(true);
    try {
      const res = await aiAPI.breakdownTask(title, description);
      const generated = res.subtasks.map((st) => ({
        _id: Math.random().toString(36).substring(2, 9),
        title: st.title,
        completed: false,
      }));
      setSubtasks([...subtasks, ...generated]);
    } catch (err) {
      console.error('Failed to break down task with AI:', err);
    } finally {
      setIsBreakingDown(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-slate-900 border-l border-slate-700/60 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleComplete}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Completed</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Mark Complete</span>
                </>
              )}
            </button>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="inbox">Inbox</option>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDuplicate}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Duplicate task"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={status === 'archived' ? 'Unarchive task' : 'Archive task'}
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this task?')) {
                  onDelete(task._id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Blocked banner */}
          {task.isBlocked && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Prerequisites Required:</strong> This task is blocked by incomplete dependencies. Complete them first.
              </span>
            </div>
          )}
          {/* Title input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full bg-transparent text-xl font-bold text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Priority
            </label>
            <PrioritySelect value={priority} onChange={setPriority} />
          </div>

          {/* Due Date & Reminder */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Schedule & Reminders
            </label>
            <DateTimePicker
              dueDate={dueDate}
              dueTime={dueTime}
              reminder={reminder}
              onDateChange={setDueDate}
              onTimeChange={setDueTime}
              onReminderChange={(r) => setReminder(r || 'none')}
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Project
            </label>
            <select
              value={projectId || ''}
              onChange={(e) => setProjectId(e.target.value || undefined)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="">No Project (Inbox)</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Subtasks
              </label>
              <button
                type="button"
                onClick={handleAIBreakdown}
                disabled={isBreakingDown || !title.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-600/10 border border-violet-500/20 transition-colors disabled:opacity-50"
              >
                {isBreakingDown ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Break down with AI</span>
              </button>
            </div>
            <SubtaskList subtasks={subtasks} onChange={setSubtasks} />
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-violet-400" />
              Recurrence
            </label>
            <select
              value={recurrence.type}
              onChange={(e) =>
                setRecurrence({ ...recurrence, type: e.target.value as any })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Every Weekday (Mon - Fri)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Time Tracking (Requirement #24) */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-slate-200">Time Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                {isTimerRunning && (
                  <span className="font-mono text-xs text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {Math.floor(activeSeconds / 60).toString().padStart(2, '0')}:
                    {(activeSeconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    isTimerRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  )}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Stop &amp; Log</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Timer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Estimated (min)</label>
                <input
                  type="number"
                  min={0}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Actual Tracked (min)</label>
                <input
                  type="number"
                  min={0}
                  value={actualDuration}
                  onChange={(e) => setActualDuration(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Dependencies (Requirement #25) */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-slate-200">Prerequisite Dependencies</span>
              </div>
              {task.isBlocked && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <Lock className="w-3 h-3" /> Blocked
                </span>
              )}
            </div>

            {/* Existing dependencies list */}
            {dependencies.length > 0 ? (
              <div className="space-y-1.5">
                {dependencies.map((dep: any) => {
                  const depId = typeof dep === 'object' && dep !== null ? dep._id : dep;
                  const depTitle = typeof dep === 'object' && dep !== null ? dep.title : 'Task';
                  const isDone = typeof dep === 'object' && dep !== null ? dep.status === 'completed' : false;

                  return (
                    <div
                      key={depId}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                        <span className={clsx('truncate', isDone ? 'line-through text-slate-500' : 'text-slate-200')}>
                          {depTitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(depId)}
                        className="p-1 text-slate-500 hover:text-red-400 ml-2"
                        title="Remove dependency"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No prerequisites. This task can be executed right away.</p>
            )}

            {/* Add new dependency picker */}
            {candidateTasks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedDepId}
                  onChange={(e) => setSelectedDepId(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="">Select prerequisite task...</option>
                  {candidateTasks
                    .filter((ct) => !dependencies.some((d: any) => (typeof d === 'object' && d ? d._id : d) === ct._id))
                    .map((ct) => (
                      <option key={ct._id} value={ct._id}>
                        {ct.title} ({ct.status})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddDependency}
                  disabled={!selectedDepId}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-violet-400" />
              Tags
            </label>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-violet-300 border border-violet-500/20"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes, links, or context..."
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p>Created: {format(new Date(task.createdAt), 'PPpp')}</p>
            {task.updatedAt && <p>Last modified: {format(new Date(task.updatedAt), 'PPpp')}</p>}
            {task.completedAt && <p>Completed: {format(new Date(task.completedAt), 'PPpp')}</p>}
          </div>
        </div>

        {/* Footer with Save changes button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white rounded-xl text-xs font-medium transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
