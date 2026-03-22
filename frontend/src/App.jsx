import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Sidebar from "./Components/Sidebar.jsx";
import AiContentGenerator from "./Components/AiContentGenerator.jsx";
import FlashcardDecksPage from "./Pages/FlashcardDecksPage.jsx";
import FlashcardStudyPage from "./Pages/FlashcardStudyPage.jsx";
import McqBankPage from "./Pages/McqBankPage.jsx";
import ExamInterfacePage from "./Pages/ExamInterfacePage.jsx";
import ExamSchedulePage from "./Pages/ExamSchedulePage.jsx";
import ExamResultPage from "./Pages/ExamResultPage.jsx";
import AdminCreateExamPage from "./Pages/AdminCreateExamPage.jsx";
import PerformancePage from "./Pages/PerformancePage.jsx";

function pathToActiveKey(pathname) {
  if (pathname.startsWith("/ai-tools")) return "ai-tools";
  if (pathname.startsWith("/performance")) return "performance";
  if (pathname.startsWith("/mcq-bank")) return "mcq-bank";
  if (pathname.startsWith("/flashcards")) return "flashcards";
  if (pathname.startsWith("/exam")) return "exams";
  if (pathname.startsWith("/exams")) return "exams";
  return "dashboard";
}

function DashboardHome() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      <p className="mt-2 text-slate-300">
        Welcome to SLMS. Use the sidebar to navigate.
      </p>
    </div>
  );
}

function App() {
  const location = useLocation();
  const active = pathToActiveKey(location.pathname);

  return (
    <div className="flex min-h-screen bg-[#0a0a0c]">
      <Sidebar active={active} />
      <main className="min-h-screen flex-1 overflow-y-auto bg-[#0a0a0c]">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/ai-tools" element={<AiContentGenerator />} />
          <Route
            path="/performance"
            element={<PerformancePage />}
          />
          <Route path="/mcq-bank" element={<McqBankPage />} />
          <Route path="/flashcards" element={<FlashcardDecksPage />} />
          <Route path="/flashcards/study/:deckId" element={<FlashcardStudyPage />} />
          <Route path="/exam/:examId/result" element={<ExamResultPage />} />
          <Route path="/exam/:examId" element={<ExamInterfacePage />} />
          <Route path="/exams" element={<ExamSchedulePage />} />
          <Route path="/exams/create" element={<AdminCreateExamPage />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-white">
                <h1 className="text-xl font-semibold">Not found</h1>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
