import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useAuth } from "./context/MAuthContext";
import { useTheme } from "./context/MThemeContext";

import { FullPageSpinner } from "./Components/MSpinner";
import Navbar from "./Components/layout/MNavbar";
import ProtectedRoute from "./Components/MProtectedRoute";
import AdminRoute from "./Components/MAdminRoute";

import Home from "./Pages/MHome";
import Login from "./Pages/MLogin";
import Register from "./Pages/MRegister";
import Dashboard from "./Pages/MDashboard";
import AiWorkspaceDashboard from "./Pages/DashboardPage.jsx";
import ProfileSetup from "./Pages/MProfileSetup";
import AdminPanel from "./Pages/MAdminPanel";
import AdminCreateExamPage from "./Pages/AdminCreateExamPage.jsx";
import Planner from "./Pages/Planner";
import BrowseNotes from "./Pages/student/BrowseNotes.jsx";
import MyNotes from "./Pages/student/MyNotes.jsx";
import UploadNote from "./Pages/student/UploadNote.jsx";
import StudentQAForum from "./Pages/student/StudentQAForum.jsx";
import NoteDetail from "./Pages/student/NoteDetail.jsx";
import StudentDashboard from "./Pages/student/StudentDashboard.jsx";
import AdminDashboard from "./Pages/admin/AdminDashboard.jsx";
import ManageNotes from "./Pages/admin/ManageNotes.jsx";
import PendingApprovals from "./Pages/admin/PendingApprovals.jsx";
import Discussions from "./Pages/admin/Discussions.jsx";
import AdminQAForum from "./Pages/admin/AdminQAForum.jsx";
import ModerationPanel from "./Pages/admin/ModerationPanel.jsx";

import { isAdminLoggedIn } from "./lib/session.js";

import StudentHubLayout from "./studentPerformance/StudentHubLayout.jsx";
import StudentPerformanceDashboard from "./studentPerformance/StudentPerformanceDashboard.jsx";
import StudentCalendarPage from "./studentPerformance/StudentCalendarPage.jsx";
import StudentNotificationsPage from "./studentPerformance/StudentNotificationsPage.jsx";
import StudentGoalsPage from "./studentPerformance/StudentGoalsPage.jsx";
import StudentStudyPlannerPage from "./studentPerformance/StudentStudyPlannerPage.jsx";

import AiWorkspaceLayout from "./Components/layout/AiWorkspaceLayout.jsx";
import DashboardLayout from "./Components/layout/DashboardLayout.jsx";
import AiContentGenerator from "./Components/AiContentGenerator.jsx";
import AiPerformancePage from "./Pages/PerformancePage.jsx";
import AiMcqBankPage from "./Pages/McqBankPage.jsx";
import AiFlashcardDecksPage from "./Pages/FlashcardDecksPage.jsx";
import AiFlashcardStudyPage from "./Pages/FlashcardStudyPage.jsx";
import AiExamSchedulePage from "./Pages/ExamSchedulePage.jsx";
import AiExamInterfacePage from "./Pages/ExamInterfacePage.jsx";
import AiExamResultPage from "./Pages/ExamResultPage.jsx";

function LegacyFlashcardStudyRedirect() {
  const { deckId } = useParams();
  return <Navigate to={`/ai-tools/flashcards/study/${deckId}`} replace />;
}

function LegacyExamRedirect() {
  const { examId } = useParams();
  return <Navigate to={`/ai-tools/exams/${examId}`} replace />;
}

function LegacyExamResultRedirect() {
  const { examId } = useParams();
  return <Navigate to={`/ai-tools/exams/${examId}/result`} replace />;
}

function LegacyExamEditRedirect() {
  const { examId } = useParams();
  return <Navigate to={`/ai-tools/exams/${examId}/edit`} replace />;
}

function LegacyStudentNoteDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/student/notes/${id}`} replace />;
}

function StudentPortalRoutes() {
  return (
    <ProtectedRoute requireProfile>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AdminPortalRoutes() {
  return (
    <AdminRoute>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </AdminRoute>
  );
}

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
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: dark ? "#050b16" : "#f8fafc",
        color: dark ? "#f1f5f9" : "#0f172a",
        "--bg-body": dark ? "#050b16" : "#f8fafc",
        "--bg-nav": dark ? "rgba(5, 11, 22, 0.92)" : "rgba(255, 255, 255, 0.92)",
        "--bg-card": dark ? "#0f172a" : "#ffffff",
        "--bg-surface": dark ? "#111827" : "#f1f5f9",
        "--bg-input": dark ? "#0b1220" : "#ffffff",
        "--bg-input-focus": dark ? "#111827" : "#f8fafc",
        "--text-primary": dark ? "#f8fafc" : "#0f172a",
        "--text-secondary": dark ? "#94a3b8" : "#475569",
        "--text-muted": dark ? "#64748b" : "#94a3b8",
        "--border-color": dark ? "rgba(148, 163, 184, 0.25)" : "rgba(15, 23, 42, 0.12)",
        "--color-lms-primary": "#3b82f6",
        "--color-lms-secondary": "#6366f1",
        "--color-lms-accent": "#6366f1",
        "--color-lms-muted": "#64748b",
        "--color-lms-warm": "#8b5cf6",
        "--color-lms-teal": "#14b8a6",
        "--color-lms-rose": "#f43f5e",
        "--color-lms-amber": "#f59e0b",
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: dark ? "#1e293b" : "#ffffff",
            color: dark ? "#f1f5f9" : "#1e293b",
            border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
            fontSize: "14px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          },
          success: { iconTheme: { primary: "#3b82f6", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireProfile>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-tools"
            element={
              <ProtectedRoute requireProfile>
                <AiWorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AiWorkspaceDashboard />} />
            <Route path="assistant" element={<AiContentGenerator />} />
            <Route path="performance" element={<AiPerformancePage />} />
            <Route path="mcq-bank" element={<AiMcqBankPage />} />
            <Route path="mcq-bank/create" element={<AdminOnlyCreateMcqBankRoute />} />
            <Route path="flashcards" element={<AiFlashcardDecksPage />} />
            <Route path="flashcards/study/:deckId" element={<AiFlashcardStudyPage />} />
            <Route path="exams" element={<AiExamSchedulePage />} />
            <Route path="exams/create" element={<AdminOnlyCreateRoute />} />
            <Route path="exams/:examId/edit" element={<AdminOnlyEditRoute />} />
            <Route path="exams/:examId" element={<AiExamInterfacePage />} />
            <Route path="exams/:examId/result" element={<AiExamResultPage />} />
          </Route>

          <Route path="/mcq-bank" element={<Navigate to="/ai-tools/mcq-bank" replace />} />
          <Route
            path="/mcq-bank/create"
            element={<Navigate to="/ai-tools/mcq-bank/create" replace />}
          />
          <Route path="/flashcards" element={<Navigate to="/ai-tools/flashcards" replace />} />
          <Route path="/flashcards/study/:deckId" element={<LegacyFlashcardStudyRedirect />} />
          <Route path="/exams" element={<Navigate to="/ai-tools/exams" replace />} />
          <Route path="/exams/create" element={<Navigate to="/ai-tools/exams/create" replace />} />
          <Route path="/exams/:examId/edit" element={<LegacyExamEditRedirect />} />
          <Route path="/exam/:examId" element={<LegacyExamRedirect />} />
          <Route path="/exam/:examId/result" element={<LegacyExamResultRedirect />} />

          <Route
            path="/performance"
            element={<StudentHubLayout hubBase="/performance" />}
          >
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

          <Route path="/admin" element={<AdminPortalRoutes />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manage-notes" element={<ManageNotes />} />
            <Route path="pending" element={<PendingApprovals />} />
            <Route path="discussions" element={<Discussions />} />
            <Route path="qa-forum" element={<AdminQAForum />} />
            <Route path="moderation" element={<ModerationPanel />} />
            <Route path="users" element={<AdminPanel />} />
          </Route>

          <Route
            path="/admin/create-exam"
            element={<AdminOnlyCreateRoute />}
          />
          <Route
            path="/admin/edit-exam/:examId"
            element={<AdminOnlyEditRoute />}
          />
          <Route
            path="/admin/create-mcq-bank"
            element={<AdminOnlyCreateMcqBankRoute />}
          />

          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <Planner />
              </ProtectedRoute>
            }
          />

          <Route path="/student" element={<StudentPortalRoutes />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="browse-notes" element={<BrowseNotes />} />
            <Route path="my-notes" element={<MyNotes />} />
            <Route path="upload-note" element={<UploadNote />} />
            <Route path="qa-forum/*" element={<StudentQAForum />} />
            <Route path="notes/:id" element={<NoteDetail />} />
          </Route>
          <Route
            path="/notes/:id"
            element={<LegacyStudentNoteDetailRedirect />}
          />

          <Route path="/notes" element={<Navigate to="/student/browse-notes" replace />} />

          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <h1 className="text-7xl font-black text-gradient">404</h1>
                  <p
                    className="mt-3 text-lg"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Page not found
                  </p>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
