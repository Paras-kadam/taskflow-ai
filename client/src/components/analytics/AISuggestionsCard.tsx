import { useQuery } from '@tanstack/react-query';
import { aiAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle, Flame, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

export function AISuggestionsCard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: () => aiAPI.getSuggestions(),
    staleTime: 60 * 1000,
  });

  const suggestions = data?.suggestions || [];

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse space-y-3">
        <div className="h-5 w-48 bg-slate-800 rounded" />
        <div className="h-16 w-full bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'streak':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'dependency':
        return <ShieldAlert className="w-5 h-5 text-blue-400" />;
      case 'focus':
        return <Clock className="w-5 h-5 text-violet-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-violet-500/20 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              AI Productivity Insights
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">Actionable advice synthesized from your workload</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className={clsx(
              'p-3.5 rounded-xl border flex items-start gap-3 transition-all',
              s.type === 'urgent'
                ? 'bg-red-500/10 border-red-500/30'
                : s.type === 'focus'
                ? 'bg-violet-600/10 border-violet-500/30'
                : s.type === 'streak'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
            )}
          >
            <div className="mt-0.5 flex-shrink-0">{getIcon(s.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-100">{s.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.message}</p>
              {s.actionLabel && s.actionUrl && (
                <button
                  type="button"
                  onClick={() => navigate(s.actionUrl!)}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <span>{s.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
