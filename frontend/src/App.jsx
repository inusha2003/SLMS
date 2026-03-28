import { Route, Routes, useLocation, useParams } from "react-router-dom";
import "./App.css";
import Sidebar from "./Components/Sidebar.jsx";
import AiContentGenerator from "./Components/AiContentGenerator.jsx";
import DashboardPage from "./Pages/DashboardPage.jsx";
import FlashcardDecksPage from "./Pages/FlashcardDecksPage.jsx";
import FlashcardStudyPage from "./Pages/FlashcardStudyPage.jsx";
import McqBankPage from "./Pages/McqBankPage.jsx";
import McqBankStudyPage from "./Pages/McqBankStudyPage.jsx";
import ExamInterfacePage from "./Pages/ExamInterfacePage.jsx";
import ExamSchedulePage from "./Pages/ExamSchedulePage.jsx";
import ExamResultPage from "./Pages/ExamResultPage.jsx";
import AdminCreateExamPage from "./Pages/AdminCreateExamPage.jsx";
import PerformancePage from "./Pages/PerformancePage.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import RegisterPage from "./Pages/RegisterPage.jsx";
import { isAdminLoggedIn } from "./lib/session.js";
import { Routes, Route } from 'react-router-dom';
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

const App = () => {
  const { loading } = useAuth();
  const { dark } = useTheme();
  if (loading) return <FullPageSpinner />;

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

function App() {
  const location = useLocation();
  const active = pathToActiveKey(location.pathname);
  const hideSidebar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="slms-shell flex h-screen overflow-hidden">
      {!hideSidebar && <Sidebar active={active} />}
      <main className="h-screen flex-1 overflow-y-auto">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/ai-tools" element={<AiContentGenerator />} />
          <Route
            path="/performance"
            element={<PerformancePage />}
          />
          <Route path="/mcq-bank" element={<McqBankPage />} />
          <Route path="/mcq-bank/create" element={<AdminOnlyCreateMcqBankRoute />} />
          <Route path="/mcq-bank/:examId" element={<McqBankStudyPage />} />
          <Route path="/flashcards" element={<FlashcardDecksPage />} />
          <Route path="/flashcards/study/:deckId" element={<FlashcardStudyPage />} />
          <Route path="/exam/:examId/result" element={<ExamResultPage />} />
          <Route path="/exam/:examId" element={<ExamInterfacePage />} />
          <Route path="/exams" element={<ExamSchedulePage />} />
          <Route path="/exams/create" element={<AdminOnlyCreateRoute />} />
          <Route path="/exams/:examId/edit" element={<AdminOnlyEditRoute />} />
          <Route
            path="*"
            element={
              <AccessOnlyCard
                title="Not Found"
                description="The page you tried to open is not available in this workspace."
              />
            }
          />
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
