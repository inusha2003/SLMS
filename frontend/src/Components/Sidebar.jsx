import { Link, useNavigate } from "react-router-dom";
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

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", to: "/", Icon: Square },
  { key: "performance", label: "Performance", to: "/performance", Icon: LibraryBig },
  { key: "ai-tools", label: "AI Tools", to: "/ai-tools", Icon: Activity },
  { key: "mcq-bank", label: "MCQ Bank", to: "/mcq-bank", Icon: ClipboardList },
  { key: "flashcards", label: "Flashcards", to: "/flashcards", Icon: Layers },
  { key: "exams", label: "Exams", to: "/exams", Icon: FileText },
];

export default function Sidebar({ active = "ai-tools" }) {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const userName = getStoredUserName();
  const userRole = getStoredUserRole();

  return (
    <aside className="sticky top-0 flex h-screen w-[252px] shrink-0 flex-col overflow-hidden border-r border-white/8 bg-[linear-gradient(180deg,rgba(7,17,31,0.96),rgba(5,11,22,0.98))] backdrop-blur-xl">
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
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/8 bg-white/[0.04] text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const { key, label, to, Icon } = item;
          const isActive = key === active;
          return (
            <Link
              key={key}
              to={to}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-[14px] px-4 py-3 text-[1.02rem] font-medium transition-all",
                isActive
                  ? "border border-cyan-400/35 bg-cyan-400/10 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                  : "border border-transparent text-slate-300 hover:bg-white/[0.045] hover:text-white",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-4 w-4",
                  isActive ? "text-cyan-300" : "text-slate-400",
                ].join(" ")}
              />
              <span>{label}</span>
              {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-orange-300" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/8 px-4 py-4 text-xs text-slate-500">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            <span className="text-sm font-semibold text-cyan-300">AI Powered</span>
          </div>
          {loggedIn ? (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-3">
              <p className="truncate text-sm font-semibold text-white">
                {userName || "Logged In"}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                {userRole || "User"}
              </p>
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  navigate("/login", { replace: true });
                }}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-orange-300 transition hover:text-orange-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
          )}
          <p className="text-[12px] text-slate-500">IT Faculty - Year 1 Semester 1 to Year 4 Semester 2</p>
        </div>
      </div>
    </aside>
  );
}
