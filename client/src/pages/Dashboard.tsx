import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  Target,
  Flame,
  Calendar,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const now = new Date();
  const hour = now.getHours();

  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  const today = format(now, 'EEEE, MMMM d, yyyy');

  const stats = [
    {
      label: 'Tasks Today',
      value: '0',
      icon: ListTodo,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Completed',
      value: '0',
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Overdue',
      value: '0',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Streak',
      value: '0 days',
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Tasks Section */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Today's Tasks</h2>
          <button className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
            View all
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-base font-medium text-slate-300 mb-1">You're all caught up! 🎉</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            No tasks scheduled for today. Create a new task or check your upcoming tasks.
          </p>
          <button className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
            + Add Task
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/upcoming"
          className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 hover:border-violet-500/30 hover:bg-slate-800/50 transition-all group"
        >
          <Calendar className="w-5 h-5 text-slate-400 group-hover:text-violet-400 mb-2 transition-colors" />
          <h3 className="text-sm font-medium text-slate-200">Upcoming</h3>
          <p className="text-xs text-slate-500 mt-0.5">See what's ahead</p>
        </a>
        <a
          href="/analytics"
          className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 hover:border-violet-500/30 hover:bg-slate-800/50 transition-all group"
        >
          <TrendingUp className="w-5 h-5 text-slate-400 group-hover:text-violet-400 mb-2 transition-colors" />
          <h3 className="text-sm font-medium text-slate-200">Productivity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track your progress</p>
        </a>
        <a
          href="/focus"
          className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 hover:border-violet-500/30 hover:bg-slate-800/50 transition-all group"
        >
          <Clock className="w-5 h-5 text-slate-400 group-hover:text-violet-400 mb-2 transition-colors" />
          <h3 className="text-sm font-medium text-slate-200">Focus Mode</h3>
          <p className="text-xs text-slate-500 mt-0.5">Start a Pomodoro session</p>
        </a>
      </div>
    </div>
  );
}
