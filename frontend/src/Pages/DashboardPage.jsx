import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  CalendarClock,
  ChevronRight,
  FileCheck2,
  Layers3,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { apiUrl } from "../lib/api.js";
import {
  getAuthHeaders,
  getStoredUserName,
  getStoredUserRole,
  getStoredUserSemester,
  isAdminLoggedIn,
} from "../lib/session.js";

function clamp100(n) {
  return Math.max(0, Math.min(100, Number(n) || 0));
}

function formatSchedule(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatSemesterText(value) {
  const n = Number(value) || 0;
  if (!n) return "Semester not set";
  return `Semester ${n}`;
}

function DashboardStat({ label, value, hint, Icon, accent = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    orange: "border-orange-400/20 bg-orange-400/10 text-orange-200",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  };

  return (
    <div className="rounded-[24px] border border-white/8 bg-[#0c1828]/90 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{value}</p>
          <p className="mt-2 text-sm slms-muted">{hint}</p>
        </div>
        <div
          className={[
            "rounded-2xl border p-3",
            tones[accent] || tones.cyan,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const userName = useMemo(() => getStoredUserName(), []);
  const userRole = useMemo(() => getStoredUserRole(), []);
  const userSemester = useMemo(() => getStoredUserSemester(), []);
  const adminLoggedIn = useMemo(() => isAdminLoggedIn(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    exams: [],
    flashcards: [],
    performance: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const requests = [
          fetch(apiUrl("/api/assessment/exams"), {
            headers: getAuthHeaders(),
          }).then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Failed to load exams.");
            return Array.isArray(data.exams) ? data.exams : [];
          }),
        ];

        if (!adminLoggedIn) {
          requests.push(
            fetch(apiUrl("/api/assessment/performance/dashboard"), {
              headers: getAuthHeaders(),
            }).then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.message || "Failed to load performance.");
              return data;
            }),
          );

          requests.push(
            fetch(apiUrl("/api/flashcards"), {
              headers: getAuthHeaders(),
            }).then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.message || "Failed to load flashcards.");
              return Array.isArray(data.decks) ? data.decks : [];
            }),
          );
        }

        const [exams, performance = null, flashcards = []] = await Promise.all(requests);

        if (!cancelled) {
          setSummary({
            exams,
            performance,
            flashcards,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load dashboard.");
          setSummary({
            exams: [],
            flashcards: [],
            performance: null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adminLoggedIn]);

  const exams = summary.exams || [];
  const flashcards = summary.flashcards || [];
  const performance = summary.performance || null;

  const upcomingExams = useMemo(
    () => exams.filter((exam) => !exam.viewerHasSubmitted && exam.status === "Upcoming"),
    [exams],
  );
  const completedExams = useMemo(
    () => exams.filter((exam) => exam.viewerHasSubmitted || exam.status === "Completed"),
    [exams],
  );
  const nextExam = upcomingExams[0] || null;
  const topSubject = performance?.subjectPerformance?.[0] || null;
  const averageScore = clamp100(performance?.overall?.avgPercentage);

  return (
    <div className="slms-page min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="slms-card relative overflow-hidden rounded-[32px] px-6 py-7 lg:px-8 lg:py-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.14),transparent_28%)]" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_340px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Dashboard Overview
              </span>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                {userName ? `${userName}, ready to keep momentum going?` : "Welcome to SLMS"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 slms-muted">
                {adminLoggedIn
                  ? "Monitor exam activity, publish assessments faster, and keep the faculty workflow organized from one place."
                  : "Track exams, study progress, and saved flashcards from one clean workspace built around your semester goals."}
              </p>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Active Profile
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-[20px] bg-[#0d2036] p-4">
                  <p className="text-sm text-slate-300">Role</p>
                  <p className="mt-1 text-lg font-semibold text-white">{userRole || "Guest"}</p>
                </div>
                <div className="rounded-[20px] bg-[#13253a] p-4">
                  <p className="text-sm text-slate-300">Current focus</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {adminLoggedIn ? "Assessment Management" : formatSemesterText(userSemester)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
          </div>
        )}

        {error && (
          <div className="rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardStat
                label={adminLoggedIn ? "Total Exams" : "Upcoming Exams"}
                value={adminLoggedIn ? exams.length : upcomingExams.length}
                hint={
                  adminLoggedIn
                    ? "Published and visible in the schedule."
                    : "Scheduled exams still waiting for your attempt."
                }
                Icon={CalendarClock}
              />
              <DashboardStat
                label={adminLoggedIn ? "Completed" : "Completed Exams"}
                value={completedExams.length}
                hint={
                  adminLoggedIn
                    ? "Exams marked completed by the system."
                    : "Submitted attempts already moved to results."
                }
                Icon={FileCheck2}
                accent="emerald"
              />
              <DashboardStat
                label={adminLoggedIn ? "Quick Setup" : "Flashcard Decks"}
                value={adminLoggedIn ? "AI + Exams" : flashcards.length}
                hint={
                  adminLoggedIn
                    ? "Create exams and MCQ sets from the admin tools."
                    : "Saved flashcard decks available for review."
                }
                Icon={Layers3}
                accent="orange"
              />
              <DashboardStat
                label={adminLoggedIn ? "Student Focus" : "Average Score"}
                value={adminLoggedIn ? formatSemesterText(userSemester) : `${averageScore}%`}
                hint={
                  adminLoggedIn
                    ? "Use semester-aware scheduling when publishing exams."
                    : "Overall performance from your completed attempts."
                }
                Icon={Target}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
              <section className="slms-card rounded-[28px] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {adminLoggedIn ? "Assessment Snapshot" : "Your Next Best Step"}
                    </h2>
                    <p className="mt-1 text-sm slms-muted">
                      {adminLoggedIn
                        ? "Keep the exam pipeline moving with clear next actions."
                        : "The fastest way to continue progress this week."}
                    </p>
                  </div>
                  <Link
                    to={adminLoggedIn ? "/exams" : "/performance"}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                  >
                    Open
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {adminLoggedIn ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Link
                      to="/exams/create"
                      className="rounded-[24px] border border-cyan-400/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(12,24,40,0.9))] p-5 transition hover:-translate-y-1"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                        Create
                      </p>
                      <h3 className="mt-3 text-xl font-semibold text-white">Publish a timed exam</h3>
                      <p className="mt-2 text-sm slms-muted">
                        Add schedule, semester, and questions for the next assessment window.
                      </p>
                    </Link>
                    <Link
                      to="/mcq-bank/create"
                      className="rounded-[24px] border border-orange-400/18 bg-[linear-gradient(135deg,rgba(251,146,60,0.16),rgba(12,24,40,0.9))] p-5 transition hover:-translate-y-1"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
                        Build
                      </p>
                      <h3 className="mt-3 text-xl font-semibold text-white">Add MCQ review set</h3>
                      <p className="mt-2 text-sm slms-muted">
                        Prepare revision material students can browse outside the exam flow.
                      </p>
                    </Link>
                  </div>
                ) : nextExam ? (
                  <div className="mt-5 rounded-[24px] border border-cyan-400/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(12,24,40,0.9),rgba(251,146,60,0.12))] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                          Next Scheduled Exam
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold text-white">{nextExam.title}</h3>
                        <p className="mt-2 text-sm slms-muted">
                          {nextExam.subject} • {formatSemesterText(nextExam.semester)} •{" "}
                          {formatSchedule(nextExam.scheduledAt)}
                        </p>
                      </div>
                      <Link
                        to="/exams"
                        className="inline-flex items-center gap-2 rounded-[16px] bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                      >
                        View Exam Schedule
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {topSubject && (
                      <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Strongest Subject
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-white">{topSubject.subject}</p>
                            <p className="mt-1 text-sm text-cyan-200">
                              {clamp100(topSubject.avgPercentage)}% average across{" "}
                              {topSubject.attemptCount} attempts
                            </p>
                          </div>
                          <Brain className="h-8 w-8 text-cyan-300" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                    <p className="text-lg font-semibold text-white">No upcoming exams yet</p>
                    <p className="mt-2 text-sm slms-muted">
                      When admins publish your next exam, it will appear here with a direct shortcut.
                    </p>
                  </div>
                )}
              </section>

              <section className="slms-card rounded-[28px] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Quick Links</h2>
                    <p className="mt-1 text-sm slms-muted">Jump straight into the tools you use most.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    {
                      to: "/performance",
                      title: "Performance",
                      text: adminLoggedIn
                        ? "Review student-facing analytics view."
                        : "See score trends and subject insights.",
                    },
                    {
                      to: "/exams",
                      title: "Exam Schedule",
                      text: adminLoggedIn
                        ? "Manage upcoming and completed assessments."
                        : "Open exams, schedules, and results.",
                    },
                    {
                      to: adminLoggedIn ? "/mcq-bank/create" : "/flashcards",
                      title: adminLoggedIn ? "MCQ Bank Create" : "Flashcards",
                      text: adminLoggedIn
                        ? "Publish a new review set."
                        : "Revise from your saved AI flashcard decks.",
                    },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-cyan-400/20 hover:bg-cyan-400/6"
                    >
                      <div>
                        <p className="text-base font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm slms-muted">{item.text}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-cyan-200" />
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {!adminLoggedIn && (
              <section className="slms-card rounded-[28px] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Recent Flashcards</h2>
                    <p className="mt-1 text-sm slms-muted">
                      Your latest saved study decks, ready for the next revision session.
                    </p>
                  </div>
                  <Link
                    to="/flashcards"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                  >
                    Open All
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {flashcards.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                    <p className="text-lg font-semibold text-white">No flashcard decks yet</p>
                    <p className="mt-2 text-sm slms-muted">
                      Generate decks from AI Tools and they will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {flashcards.slice(0, 3).map((deck) => (
                      <Link
                        key={deck.id}
                        to={`/flashcards/study/${deck.id}`}
                        className="rounded-[24px] border border-white/8 bg-[#0c1828]/90 p-5 transition hover:-translate-y-1"
                      >
                        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                          {deck.subject || "Flashcards"}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold leading-7 text-white">
                          {deck.title}
                        </h3>
                        <p className="mt-3 text-sm slms-muted">
                          {deck.cardCount} cards • {formatSemesterText(deck.semester)}
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-200">
                          Study now
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
