import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import {
  Menu,
  Search,
  Plus,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Keyboard,
  Timer,
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { useFocusStore } from '../../stores/focusStore';

const routeTitles: Record<string, string> = {
  '/inbox': 'Inbox',
  '/today': 'Today',
  '/upcoming': 'Upcoming',
  '/calendar': 'Calendar',
  '/all-tasks': 'All Tasks',
  '/completed': 'Completed',
  '/kanban': 'Kanban Board',
  '/focus': 'Focus Mode',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar, toggleSearch, toggleShortcuts } = useUiStore();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const focusStatus = useFocusStore((s) => s.status);
  const focusRemainingSeconds = useFocusStore((s) => s.remainingSeconds);
  const focusMode = useFocusStore((s) => s.mode);

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pageTitle = routeTitles[location.pathname] || 'Dashboard';

  const handleAddTaskClick = () => {
    // Dispatch custom event to focus quick add input if mounted
    const event = new CustomEvent('focus-quick-add');
    window.dispatchEvent(event);
    if (!['/inbox', '/today', '/upcoming', '/all-tasks'].includes(location.pathname)) {
      navigate('/inbox');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-slate-700/50 bg-slate-950 dark:bg-slate-950">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-100">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Global Active Focus Timer Badge */}
        {(focusStatus === 'running' || focusStatus === 'paused') && (
          <button
            onClick={() => navigate('/focus')}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono transition-all mr-1 sm:mr-2 border shadow-sm',
              focusStatus === 'running'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 shadow-rose-950/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-amber-950/20'
            )}
            title={
              focusStatus === 'running'
                ? 'Focus timer running — Click to open Focus Mode'
                : 'Focus timer paused — Click to resume'
            }
          >
            {focusStatus === 'running' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            ) : (
              <span className="inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            )}
            <Timer className="w-3.5 h-3.5" />
            <span className="capitalize hidden sm:inline">
              {focusMode === 'pomodoro' ? 'Focus' : 'Break'}
            </span>
            <span>{formatFocusTime(focusRemainingSeconds)}</span>
          </button>
        )}

        {/* Search */}
        <button
          onClick={toggleSearch}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={toggleShortcuts}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-[18px] h-[18px]" />
        </button>

        {/* Add Task */}
        <button
          onClick={handleAddTaskClick}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>

        {/* Mobile Add Task */}
        <button
          onClick={handleAddTaskClick}
          className="sm:hidden p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          <Plus className="w-[18px] h-[18px]" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-semibold text-white">
              {user ? getInitials(user.name) : '?'}
            </div>
            <ChevronDown
              className={clsx(
                'w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block',
                profileOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2.5 border-b border-slate-700/50">
                <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <a
                  href="/profile"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
              </div>
              <div className="border-t border-slate-700/50 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
