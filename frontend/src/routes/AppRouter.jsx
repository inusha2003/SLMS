import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Admin Pages
import AdminDashboard from '../Pages/admin/AdminDashboard';
import ManageNotes from '../Pages/admin/ManageNotes';
import PendingApprovals from '../Pages/admin/PendingApprovals';
import Discussions from '../Pages/admin/Discussions';
import AdminQAForum from '../Pages/admin/AdminQAForum';
import ModerationPanel from '../Pages/admin/ModerationPanel';
// Student Pages
import StudentDashboard from '../Pages/student/StudentDashboard';
import MyNotes from '../Pages/student/MyNotes';
import BrowseNotes from '../Pages/student/BrowseNotes';
import NoteDetail from '../Pages/student/NoteDetail';
import StudentQAForum from '../Pages/student/StudentQAForum';
import UploadNote from '../Pages/student/UploadNote';

// Demo Entry Page
import EntryPage from '../pages/EntryPage';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user
              ? <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
              : <EntryPage />
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="Admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/manage-notes" element={<ProtectedRoute allowedRole="Admin"><ManageNotes /></ProtectedRoute>} />
        <Route path="/admin/pending" element={<ProtectedRoute allowedRole="Admin"><PendingApprovals /></ProtectedRoute>} />
        <Route path="/admin/discussions" element={<ProtectedRoute allowedRole="Admin"><Discussions /></ProtectedRoute>} />
        <Route path="/admin/qa-forum" element={<ProtectedRoute allowedRole="Admin"><AdminQAForum /></ProtectedRoute>} />
        <Route path="/admin/moderation" element={<ProtectedRoute allowedRole="Admin"><ModerationPanel /></ProtectedRoute>} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="Student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/browse-notes" element={<ProtectedRoute allowedRole="Student"><BrowseNotes /></ProtectedRoute>} />
        <Route path="/student/my-notes" element={<ProtectedRoute allowedRole="Student"><MyNotes /></ProtectedRoute>} />
        <Route path="/student/upload-note" element={<ProtectedRoute allowedRole="Student"><UploadNote /></ProtectedRoute>} />
        <Route path="/student/qa-forum/*" element={<ProtectedRoute allowedRole="Student"><StudentQAForum /></ProtectedRoute>} />

        {/* Shared Note Detail */}
        <Route path="/notes/:id" element={<ProtectedRoute><NoteDetail /></ProtectedRoute>} />

        {/* Redirect QA detail for admin */}
        <Route path="/qa/:id" element={<ProtectedRoute><NoteDetail /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;