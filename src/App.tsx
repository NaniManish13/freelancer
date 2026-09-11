import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TimerProvider } from './context/TimerContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TasksPage } from './pages/TasksPage';
import { TimeTrackingPage } from './pages/TimeTrackingPage';
import { TimeLogsPage } from './pages/TimeLogsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceCreatePage } from './pages/InvoiceCreatePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <TimerProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected App Routes wrapped in AppLayout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="timer" element={<TimeTrackingPage />} />
                <Route path="time-logs" element={<TimeLogsPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="invoices/create" element={<InvoiceCreatePage />} />
                <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </TimerProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
