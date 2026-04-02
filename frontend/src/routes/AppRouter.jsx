import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageNotes from '../pages/admin/ManageNotes';
import PendingApprovals from '../pages/admin/PendingApprovals';
import Discussions from '../pages/admin/Discussions';
import AdminQAForum from '../pages/admin/AdminQAForum';
import ModerationPanel from '../pages/admin/ModerationPanel';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import MyNotes from '../pages/student/MyNotes';
import BrowseNotes from '../pages/student/BrowseNotes';
import NoteDetail from '../pages/student/NoteDetail';
import StudentQAForum from '../pages/student/StudentQAForum';
import UploadNote from '../pages/student/UploadNote';

// Entry
import EntryPage from '../pages/EntryPage';

// ─── Route Guards ────────────────────────────────────────────────────────────

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-lms-darkest flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'Admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-lms-darkest flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'Student') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

const SharedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-lms-darkest flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

// ─── Root Redirect ────────────────────────────────────────────────────────────

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-lms-darkest flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <EntryPage />;
  }

  if (user.role === 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
};

// ─── Main Router ─────────────────────────────────────────────────────────────

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry / Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* ── Admin Routes ── */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/manage-notes"
          element={
            <AdminRoute>
              <ManageNotes />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/pending"
          element={
            <AdminRoute>
              <PendingApprovals />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/discussions"
          element={
            <AdminRoute>
              <Discussions />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/qa-forum"
          element={
            <AdminRoute>
              <AdminQAForum />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <AdminRoute>
              <ModerationPanel />
            </AdminRoute>
          }
        />

        {/* ── Student Routes ── */}
        <Route
          path="/student/dashboard"
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          }
        />
        <Route
          path="/student/browse-notes"
          element={
            <StudentRoute>
              <BrowseNotes />
            </StudentRoute>
          }
        />
        <Route
          path="/student/my-notes"
          element={
            <StudentRoute>
              <MyNotes />
            </StudentRoute>
          }
        />
        <Route
          path="/student/upload-note"
          element={
            <StudentRoute>
              <UploadNote />
            </StudentRoute>
          }
        />
        <Route
          path="/student/qa-forum/*"
          element={
            <StudentRoute>
              <StudentQAForum />
            </StudentRoute>
          }
        />

        {/* ── Shared Routes ── */}
        <Route
          path="/notes/:id"
          element={
            <SharedRoute>
              <NoteDetail />
            </SharedRoute>
          }
        />

        {/* ── Catch All ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;