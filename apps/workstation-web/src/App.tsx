// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import ContentDashboardPage from './pages/ContentDashboardPage';
import DummyPage from './pages/DummyPage';
import LoginPage from './pages/LoginPage';
import ProjectManagementPage from './pages/ProjectManagementPage';
import ProjectStructurePage from './pages/ProjectStructurePage';
import RegisterPage from './pages/RegisterPage';
import StartPage from './pages/StartPage';
import { useAuth } from './state/AuthContext';
import ErrorBoundary from './utils/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthed, accessLoaded } = useAuth();
  if (!accessLoaded) return <div className="p-6 text-sm">Loading…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { can, accessLoaded } = useAuth();
  if (!accessLoaded) return <div className="p-6 text-sm">Loading…</div>;
  const allowed =
    can('member.list.view') ||
    can('role.list.view') ||
    can('role.perms.view') ||
    can('member.invite.send') ||
    can('role.create');
  if (!allowed) return <div className="p-6 text-sm text-gray-500">403 – no access</div>;
  return children;
};

const CrashTest: React.FC = () => {
  throw new Error('Crash test: deliberate throw');
};

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-screen flex bg-[var(--ws-page-bg)]">
    <div className="flex-1 ml-16 h-screen overflow-y-auto custom-scrollbar min-w-0">
      <div className="p-6">
        <h1 className="text-base font-semibold">{title}</h1>
        <p className="text-sm ws-muted mt-2">Coming soon…</p>
      </div>
    </div>
  </div>
);

const App: React.FC = () => (
  <div className="ws-skin bg-[var(--ws-page-bg)] min-h-screen">
    <ErrorBoundary>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* App */}
        <Route path="/" element={<Navigate to="/start" replace />} />
        <Route
          path="/start"
          element={
            <ProtectedRoute>
              <StartPage />
            </ProtectedRoute>
          }
        />

        {/* Structure vs Management */}
        <Route
          path="/project-structure"
          element={
            <ProtectedRoute>
              <ProjectStructurePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/content"
          element={
            <ProtectedRoute>
              <ContentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/:nodeId"
          element={
            <ProtectedRoute>
              <ContentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dummy"
          element={
            <ProtectedRoute>
              <DummyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <Placeholder title="Performance & Engagement" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Placeholder title="Help" />
            </ProtectedRoute>
          }
        />

        {/* Admin (locked) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route path="/crash" element={<CrashTest />} />
        <Route path="*" element={<Navigate to="/start" replace />} />
      </Routes>
    </ErrorBoundary>
  </div>
);

export default App;
