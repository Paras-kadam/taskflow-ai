import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import {
  BarChart3,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  Loader2,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AISuggestionsCard } from '../components/analytics/AISuggestionsCard';

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsAPI.getAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
        <p className="text-xs text-slate-400">Computing productivity analytics...</p>
      </div>
    );
  }

  const overview = data?.overview || {
    totalTasks: 0,
    totalCompleted: 0,
    totalActive: 0,
    completedToday: 0,
    completedYesterday: 0,
    dueToday: 0,
    todayRemaining: 0,
    overdueTasks: 0,
    completionRate: 0,
    currentStreak: 0,
    productivityScore: 0,
    totalFocusMinutes: 0,
    todayFocusMinutes: 0,
    focusSessionsCount: 0,
  };

  const priorityDist = data?.priorityDistribution || {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };

  const historyData = data?.historyData || [];
  const projectStats = data?.projectStats || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Productivity Analytics</h1>
            <p className="text-xs text-slate-400">
              Measure your performance, streaks, and milestone completions.
            </p>
          </div>
        </div>

        {/* Productivity Score Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-950/40 border border-violet-700/50">
          <Award className="w-5 h-5 text-violet-400" />
          <div className="text-right">
            <span className="text-[10px] text-violet-300 uppercase font-semibold tracking-wider block">
              Score
            </span>
            <span className="text-lg font-black text-white leading-none">
              {overview.productivityScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Streak */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 flex-shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Current Streak</span>
            <p className="text-2xl font-black text-slate-100 mt-0.5">
              {overview.currentStreak} {overview.currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Completed Today */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Done Today</span>
            <p className="text-2xl font-black text-slate-100 mt-0.5">
              {overview.completedToday}
            </p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Completion Rate</span>
            <p className="text-2xl font-black text-slate-100 mt-0.5">
              {overview.completionRate}%
            </p>
          </div>
        </div>

        {/* Focus Minutes */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Focus Time</span>
            <p className="text-2xl font-black text-slate-100 mt-0.5">
              {overview.totalFocusMinutes}m
            </p>
          </div>
        </div>
      </div>

      {/* AI Productivity Insights Card */}
      <AISuggestionsCard />

      {/* 14-Day Completion Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              14-Day Task Activity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between created vs completed tasks per day
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-violet-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              Completed
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              Created
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Completed" />
              <Bar dataKey="created" fill="#334155" radius={[4, 4, 0, 0]} name="Created" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Priority & Project Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-semibold text-slate-100">
            Active Priority Distribution
          </h3>
          <div className="space-y-3 pt-2">
            {[
              { label: 'Urgent', count: priorityDist.urgent, color: 'bg-red-500', text: 'text-red-400' },
              { label: 'High', count: priorityDist.high, color: 'bg-orange-500', text: 'text-orange-400' },
              { label: 'Medium', count: priorityDist.medium, color: 'bg-yellow-500', text: 'text-yellow-400' },
              { label: 'Low', count: priorityDist.low, color: 'bg-blue-500', text: 'text-blue-400' },
              { label: 'None', count: priorityDist.none, color: 'bg-slate-500', text: 'text-slate-400' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className={item.text}>{item.label}</span>
                  <span className="text-slate-300">{item.count} tasks</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${overview.totalActive > 0 ? (item.count / overview.totalActive) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-semibold text-slate-100">
            Projects Progress
          </h3>
          <div className="space-y-3 pt-2">
            {projectStats.map((proj) => (
              <div key={proj.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-200">{proj.name}</span>
                  <span className="text-slate-400">
                    {proj.completed}/{proj.total} ({proj.progress}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${proj.progress}%`,
                      backgroundColor: proj.color,
                    }}
                  />
                </div>
              </div>
            ))}

            {projectStats.length === 0 && (
              <p className="text-xs text-slate-500 italic py-8 text-center">
                No projects created yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
