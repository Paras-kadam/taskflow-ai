import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Inbox from './pages/Inbox';
import Today from './pages/Today';
import Upcoming from './pages/Upcoming';
import CalendarPage from './pages/CalendarPage';
import Completed from './pages/Completed';
import AllTasks from './pages/AllTasks';
import KanbanPage from './pages/KanbanPage';
import FocusMode from './pages/FocusMode';
import Analytics from './pages/Analytics';
import ProjectPage from './pages/ProjectPage';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/inbox" replace />;
  }

  return <>{children}</>;
}


export default function App() {
  const { checkAuth } = useAuthStore();
  const { applyTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    applyTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/today" element={<Today />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/all-tasks" element={<AllTasks />} />
          <Route path="/completed" element={<Completed />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/focus" element={<FocusMode />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
