import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  FileText,
  Layers,
  LibraryBig,
  LogIn,
  LogOut,
  Square,
} from "lucide-react";
import {
  clearAuthSession,
  getStoredUserName,
  getStoredUserRole,
  isLoggedIn,
} from "../lib/session.js";
import { useTheme } from "../context/MThemeContext.jsx";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", to: "/ai-tools", Icon: Square },
  { key: "assistant", label: "AI Assistant", to: "/ai-tools/assistant", Icon: Activity },
  { key: "performance", label: "Performance", to: "/ai-tools/performance", Icon: LibraryBig },
  { key: "mcq-bank", label: "MCQ Bank", to: "/ai-tools/mcq-bank", Icon: ClipboardList },
  { key: "flashcards", label: "Flashcards", to: "/ai-tools/flashcards", Icon: Layers },
  { key: "exams", label: "Exams", to: "/ai-tools/exams", Icon: FileText },
];

function getActiveKey(pathname) {
  if (pathname.startsWith("/ai-tools/assistant")) return "assistant";
  if (pathname.startsWith("/ai-tools/performance")) return "performance";
  if (pathname.startsWith("/ai-tools/mcq-bank")) return "mcq-bank";
  if (pathname.startsWith("/ai-tools/flashcards")) return "flashcards";
  if (pathname.startsWith("/ai-tools/exams") || pathname.startsWith("/ai-tools/exam")) return "exams";
  return "dashboard";
}

export default function AiContentSidebar({ active }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { dark } = useTheme();
  const loggedIn = isLoggedIn();
  const userName = getStoredUserName();
  const userRole = getStoredUserRole();
  const activeKey = active || getActiveKey(location.pathname);

  return (
    <aside
      className={[
        "fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-[252px] shrink-0 flex-col overflow-hidden border-r backdrop-blur-xl",
        dark
          ? "border-white/8 bg-[linear-gradient(180deg,rgba(7,17,31,0.96),rgba(5,11,22,0.98))]"
          : "border-slate-300/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.97),rgba(241,245,249,0.98))]",
      ].join(" ")}
    >
      <div className="border-b border-white/8 px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-cyan-400 via-sky-400 to-orange-400 text-lg font-bold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.25)]">
              <span>SL</span>
            </div>
            <div>
              <div className="text-[1.15rem] font-black uppercase tracking-[0.12em] text-cyan-100">
                SLMS
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Smart Learning
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate("/dashboard")}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-[10px] border transition",
              dark
                ? "border-white/8 bg-white/[0.04] text-slate-400 hover:border-cyan-400/30 hover:text-cyan-200"
                : "border-slate-300 bg-white text-slate-600 hover:border-cyan-500/40 hover:text-cyan-700",
            ].join(" ")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const { key, label, to, Icon } = item;
          const isActive = key === activeKey;
          return (
            <Link
              key={key}
              to={to}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-[14px] px-4 py-3 text-[1.02rem] font-medium transition-all",
                isActive
                  ? dark
                    ? "border border-cyan-400/35 bg-cyan-400/10 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                    : "border border-cyan-300 bg-cyan-50 text-cyan-700 shadow-[0_0_0_1px_rgba(14,165,233,0.1)]"
                  : dark
                    ? "border border-transparent text-slate-300 hover:bg-white/[0.045] hover:text-white"
                    : "border border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-4 w-4",
                  isActive ? (dark ? "text-cyan-300" : "text-cyan-600") : dark ? "text-slate-400" : "text-slate-500",
                ].join(" ")}
              />
              <span>{label}</span>
              {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-orange-300" />}
            </Link>
          );
        })}
      </nav>

      <div className={["mt-auto border-t px-4 py-4 text-xs", dark ? "border-white/8 text-slate-500" : "border-slate-300 text-slate-600"].join(" ")}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={["h-2 w-2 rounded-full", dark ? "bg-cyan-300" : "bg-cyan-600"].join(" ")} />
            <span className={["text-sm font-semibold", dark ? "text-cyan-300" : "text-cyan-700"].join(" ")}>AI Powered</span>
          </div>
          {loggedIn ? (
            <div className={["rounded-[16px] border px-3 py-3", dark ? "border-white/10 bg-white/[0.04]" : "border-slate-300 bg-white"].join(" ")}>
              <p className={["truncate text-sm font-semibold", dark ? "text-white" : "text-slate-900"].join(" ")}>
                {userName || "Logged In"}
              </p>
              <p className={["mt-1 text-[11px] uppercase tracking-[0.16em]", dark ? "text-slate-400" : "text-slate-500"].join(" ")}>
                {userRole || "User"}
              </p>
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  navigate("/login", { replace: true });
                }}
                className={["mt-3 inline-flex items-center gap-2 text-xs font-semibold transition", dark ? "text-orange-300 hover:text-orange-200" : "text-orange-600 hover:text-orange-700"].join(" ")}
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className={["inline-flex items-center gap-2 text-sm font-semibold transition", dark ? "text-cyan-300 hover:text-cyan-200" : "text-cyan-700 hover:text-cyan-800"].join(" ")}
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
          )}
          <p className={["text-[12px]", dark ? "text-slate-500" : "text-slate-600"].join(" ")}>IT Faculty - Year 1 Semester 1 to Year 4 Semester 2</p>
        </div>
      </div>
    </aside>
  );
}
