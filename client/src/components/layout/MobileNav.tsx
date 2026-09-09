import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  Inbox,
  Sun,
  Timer,
  MoreHorizontal,
  Plus,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  LayoutGrid,
  BarChart3,
  Settings,
  User,
  X,
  Folder,
} from 'lucide-react';

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleQuickAdd = () => {
    // If not already on a page with task add input, go to inbox
    if (!['/inbox', '/today', '/upcoming', '/all-tasks'].includes(location.pathname)) {
      navigate('/inbox');
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('focus-quick-add'));
    }, 100);
  };

  const moreItems = [
    { to: '/upcoming', label: 'Upcoming', icon: CalendarDays, desc: 'Future scheduled tasks' },
    { to: '/all-tasks', label: 'All Tasks', icon: ListTodo, desc: 'Complete task catalogue' },
    { to: '/completed', label: 'Completed', icon: CheckCircle2, desc: 'Finished accomplishments' },
    { to: '/kanban', label: 'Kanban Board', icon: LayoutGrid, desc: 'Visual drag-and-drop board' },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, desc: 'Productivity trends & streaks' },
    { to: '/settings', label: 'Settings', icon: Settings, desc: 'Preferences & notifications' },
    { to: '/profile', label: 'Profile', icon: User, desc: 'Account details' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 lg:hidden z-40 safe-area-bottom shadow-2xl"
      >
        <div className="grid grid-cols-5 items-center h-14 px-1">
          {/* 1. Home / Inbox */}
          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors',
                isActive ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <Inbox className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          {/* 2. Today */}
          <NavLink
            to="/today"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors',
                isActive ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <Sun className="w-5 h-5" />
            <span>Today</span>
          </NavLink>

          {/* 3. Center Elevated Add Task */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label="Add Task"
              className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white shadow-lg shadow-violet-600/40 flex items-center justify-center transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* 4. Focus Mode */}
          <NavLink
            to="/focus"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors',
                isActive ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <Timer className="w-5 h-5" />
            <span>Focus</span>
          </NavLink>

          {/* 5. More Menu Toggle */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors',
              moreOpen ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Bottom Sheet Modal */}
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full bg-slate-900 border-t border-slate-700/80 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 safe-area-bottom shadow-2xl animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-violet-500" />
                <h3 className="text-base font-semibold text-slate-100">More Features</h3>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      isActive
                        ? 'border-violet-500/60 bg-violet-600/15 text-violet-300'
                        : 'border-slate-800 bg-slate-800/40 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                    )
                  }
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-violet-400">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className="text-xs text-slate-400 truncate mt-1">{item.desc}</p>
                  </div>
                </NavLink>
              ))}
            </div>

            {/* Quick Link to Projects */}
            <div className="pt-2">
              <NavLink
                to="/calendar"
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-750 transition-colors"
              >
                <Folder className="w-4 h-4 text-violet-400" />
                <span>Open Interactive Calendar</span>
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
