import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { SearchModal } from '../search/SearchModal';
import { ShortcutsModal } from '../common/ShortcutsModal';
import { OfflineBanner } from '../common/OfflineBanner';
import { AudioPermissionPrompt } from '../common/AudioPermissionPrompt';
import { AlarmNotificationManager } from '../notifications/AlarmNotificationManager';
import { FocusTimerManager } from '../focus/FocusTimerManager';
import { useUiStore } from '../../stores/uiStore';
import clsx from 'clsx';

export function Layout() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <div className="h-screen flex flex-col bg-slate-950 dark:bg-slate-950 text-slate-100 overflow-hidden">
      {/* Offline Connectivity Banner */}
      <OfflineBanner />

      {/* Audio Autoplay Permission Prompt */}
      <AudioPermissionPrompt />

      {/* Global Modals & Alarms */}
      <SearchModal />
      <ShortcutsModal />
      <AlarmNotificationManager />
      <FocusTimerManager />

      <div className="flex-1 flex min-h-0 overflow-hidden">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
      </div>
    </div>
  );
}
