import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#251F39',
            color: '#e2e8f0',
            border: '1px solid rgba(57, 55, 119, 0.4)',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#4ade80', secondary: '#251F39' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#251F39' },
          },
        }}
      />
      <AppRouter />
    </AuthProvider>
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import "./App.css";
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { FullPageSpinner } from './Components/Spinner';
import Navbar from './Components/layout/Navbar';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminRoute from './Components/AdminRoute';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import ProfileSetup from './Pages/ProfileSetup';
import AdminPanel from './Pages/AdminPanel';
import AdminCreateExamPage from './Pages/AdminCreateExamPage.jsx';
import { isAdminLoggedIn } from "./lib/session.js";
import StudentHubLayout from './studentPerformance/StudentHubLayout.jsx';
import StudentPerformanceDashboard from './studentPerformance/StudentPerformanceDashboard.jsx';
import StudentCalendarPage from './studentPerformance/StudentCalendarPage.jsx';
import StudentNotificationsPage from './studentPerformance/StudentNotificationsPage.jsx';
import StudentGoalsPage from './studentPerformance/StudentGoalsPage.jsx';
import StudentStudyPlannerPage from './studentPerformance/StudentStudyPlannerPage.jsx';

function AccessOnlyCard({ title, description }) {
  return (
    <div className="slms-page p-8">
      <div className="slms-card mx-auto max-w-2xl rounded-[28px] p-8">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 slms-muted">{description}</p>
      </div>
    </div>
  );
}

function AdminOnlyCreateRoute() {
  const adminLoggedIn = isAdminLoggedIn();

  if (!adminLoggedIn) {
    return (
      <AccessOnlyCard
        title="Admin Access Only"
        description="Exams and MCQ Bank items can only be created from an admin login. Log in as an admin to open the create assessment page."
      />
    );
  }

  return <AdminCreateExamPage />;
}

function AdminOnlyEditRoute() {
  const adminLoggedIn = isAdminLoggedIn();
  const { examId } = useParams();

  if (!adminLoggedIn) {
    return (
      <AccessOnlyCard
        title="Admin Access Only"
        description="Exams can only be updated or deleted from an admin login. Log in as an admin to open the edit page."
      />
    );
  }

  return <AdminCreateExamPage examId={examId} />;
}

function AdminOnlyCreateMcqBankRoute() {
  const adminLoggedIn = isAdminLoggedIn();

  if (!adminLoggedIn) {
    return (
      <AccessOnlyCard
        title="Admin Access Only"
        description="MCQ Bank sets can only be created from an admin login. Log in as an admin to open the MCQ Bank create page."
      />
    );
  }

  return <AdminCreateExamPage initialKind="mcq_bank" lockedKind />;
}

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