import { format, addDays, addWeeks } from 'date-fns';
import { Calendar, Clock, Bell, X } from 'lucide-react';
import clsx from 'clsx';

interface DateTimePickerProps {
  dueDate?: string;
  dueTime?: string;
  reminder?: string;
  onDateChange: (date?: string) => void;
  onTimeChange: (time?: string) => void;
  onReminderChange?: (reminder?: string) => void;
  className?: string;
}

const reminderOptions = [
  { value: 'none', label: 'No reminder' },
  { value: 'at_time', label: 'At task time' },
  { value: '5min', label: '5 minutes before' },
  { value: '10min', label: '10 minutes before' },
  { value: '15min', label: '15 minutes before' },
  { value: '30min', label: '30 minutes before' },
  { value: '1hour', label: '1 hour before' },
  { value: '1day', label: '1 day before' },
];

export function DateTimePicker({
  dueDate,
  dueTime,
  reminder = 'none',
  onDateChange,
  onTimeChange,
  onReminderChange,
  className,
}: DateTimePickerProps) {
  const formattedDate = dueDate ? format(new Date(dueDate), 'yyyy-MM-dd') : '';

  const setPreset = (daysOffset: number) => {
    const target = addDays(new Date(), daysOffset);
    onDateChange(format(target, 'yyyy-MM-dd'));
  };

  const setNextWeekPreset = () => {
    const target = addWeeks(new Date(), 1);
    onDateChange(format(target, 'yyyy-MM-dd'));
  };

  const clearAll = () => {
    onDateChange(undefined);
    onTimeChange(undefined);
    onReminderChange?.('none');
  };

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Quick Presets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setPreset(0)}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/50"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setPreset(1)}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/50"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={setNextWeekPreset}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/50"
        >
          Next Week
        </button>
        {dueDate && (
          <button
            type="button"
            onClick={clearAll}
            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear due date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Date and Time Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            Due Date
          </label>
          <input
            type="date"
            value={formattedDate}
            onChange={(e) => onDateChange(e.target.value || undefined)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            Due Time (Optional)
          </label>
          <input
            type="time"
            value={dueTime || ''}
            onChange={(e) => onTimeChange(e.target.value || undefined)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      </div>

      {/* Reminder Picker */}
      {onReminderChange && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-violet-400" />
            Reminder
          </label>
          <select
            value={reminder}
            onChange={(e) => onReminderChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            {reminderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
