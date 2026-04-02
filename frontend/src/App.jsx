import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Toaster } from 'react-hot-toast';

import { useAuth } from './context/MAuthContext';
import { useTheme } from './context/MThemeContext';

import { FullPageSpinner } from './Components/MSpinner';
import Navbar from './Components/layout/MNavbar';
import ProtectedRoute from './Components/MProtectedRoute';
import AdminRoute from './Components/MAdminRoute';
import Home from './Pages/MHome';
import Login from './Pages/MLogin';
import Register from './Pages/MRegister';
import Dashboard from './Pages/MDashboard';
import ProfileSetup from './Pages/MProfileSetup';
import AdminPanel from './Pages/MAdminPanel';
import AdminCreateExamPage from './Pages/AdminCreateExamPage.jsx';
import Planner from './Pages/Planner';

import StudentHubLayout from './studentPerformance/StudentHubLayout.jsx';
import StudentPerformanceDashboard from './studentPerformance/StudentPerformanceDashboard.jsx';
import StudentCalendarPage from './studentPerformance/StudentCalendarPage.jsx';
import StudentNotificationsPage from './studentPerformance/StudentNotificationsPage.jsx';
import StudentGoalsPage from './studentPerformance/StudentGoalsPage.jsx';
import StudentStudyPlannerPage from './studentPerformance/StudentStudyPlannerPage.jsx';

const App = () => {
  const { loading } = useAuth();
  const { dark } = useTheme();
  if (loading) return <FullPageSpinner />;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: dark ? '#1e293b' : '#ffffff',
            color: dark ? '#f1f5f9' : '#1e293b',
            border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          },
          success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute requireProfile><Dashboard /></ProtectedRoute>} />

          <Route path="/performance" element={<StudentHubLayout hubBase="/performance" />}>
            <Route index element={<StudentPerformanceDashboard />} />
            <Route path="calendar" element={<StudentCalendarPage />} />
            <Route path="planner" element={<StudentStudyPlannerPage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
            <Route path="goals" element={<StudentGoalsPage />} />
          </Route>

          <Route path="/u" element={<StudentHubLayout hubBase="/u" />}>
            <Route index element={<Navigate to="/performance" replace />} />
            <Route path="calendar" element={<StudentCalendarPage />} />
            <Route path="planner" element={<StudentStudyPlannerPage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
            <Route path="goals" element={<StudentGoalsPage />} />
          </Route>

          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />

          <Route path="*" element={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <h1 className="text-7xl font-black text-gradient">404</h1>
                <p className="mt-3 text-lg" style={{ color: 'var(--text-secondary)' }}>Page not found</p>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default App;