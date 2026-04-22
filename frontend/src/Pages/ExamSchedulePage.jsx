import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getAuthToken, isAdminLoggedIn } from "../lib/session.js";
import { formatSemesterLabel } from "../lib/semester.js";
import "./ExamSchedulePage.css";

function formatFullDate(isoValue) {
  const date = isoValue ? new Date(isoValue) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateBlock(isoValue) {
  const date = isoValue ? new Date(isoValue) : new Date();
  if (Number.isNaN(date.getTime())) return { month: "NOW", day: "--" };
  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

function formatScheduleTime(isoValue, fallbackTime) {
  if (isoValue) {
    const date = new Date(isoValue);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  }
  return fallbackTime || "09:00";
}

function hasExamStarted(exam) {
  if (!exam?.scheduledAt) return true;
  const when = new Date(exam.scheduledAt);
  if (Number.isNaN(when.getTime())) return true;
  return when.getTime() <= Date.now();
}

function getExamDisplayStatus(exam, adminLoggedIn) {
  if (adminLoggedIn) return exam.status;
  return exam?.viewerHasSubmitted ? "Completed" : "Upcoming";
}

function getUpcomingExamCount(exams, adminLoggedIn) {
  return exams.filter((exam) => getExamDisplayStatus(exam, adminLoggedIn) === "Upcoming").length;
}

export default function ExamSchedulePage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const authToken = useMemo(() => getAuthToken(), []);
  const adminLoggedIn = useMemo(() => isAdminLoggedIn(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/assessment/exams"), {
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load exams.");
      setExams(Array.isArray(data.exams) ? data.exams : []);
    } catch (err) {
      setError(err.message || "Could not load exams.");
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const nextFeedback = location.state?.feedback;
    if (!nextFeedback) return;

    setFeedback(nextFeedback);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const counts = useMemo(() => {
    const all = exams.length;
    const upcoming = getUpcomingExamCount(exams, adminLoggedIn);
    const completed = exams.filter(
      (exam) => getExamDisplayStatus(exam, adminLoggedIn) === "Completed",
    ).length;
    return { all, upcoming, completed };
  }, [adminLoggedIn, exams]);

  const filteredExams = useMemo(() => {
    if (filter === "All") return exams;
    return exams.filter((exam) => getExamDisplayStatus(exam, adminLoggedIn) === filter);
  }, [adminLoggedIn, exams, filter]);

  async function handleDeleteExam() {
    if (!deleteTarget || deleteLoading) return;

    setDeleteLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl(`/api/assessment/exams/${deleteTarget._id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete exam.");
      }

      setDeleteTarget(null);
      setFeedback({ type: "success", text: "Exam deleted successfully." });
      await load();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not delete exam.",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="exam-schedule-page min-h-full px-8 py-8 lg:px-10">
      <div className="exam-schedule-shell mx-auto max-w-6xl">
        <header className="exam-schedule-hero mb-10 rounded-[30px] px-6 py-7 lg:px-8">
          <div className="exam-schedule-grid" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <span className="exam-schedule-chip exam-schedule-chip--warm inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-100">
                Assessment Flow
              </span>
              <h1 className="mt-4 text-[3rem] font-black tracking-[-0.05em] text-white">
                Exam Schedule
              </h1>
              <p className="exam-schedule-muted mt-3 text-sm leading-7">
                {adminLoggedIn
                  ? "Manage and monitor IT faculty exams across all semesters."
                  : "See the exams your admin team has published for your semester and jump in when they open."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="exam-schedule-chip exam-schedule-chip--success inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-emerald-200">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                {counts.upcoming} Upcoming
              </span>
              {adminLoggedIn && (
                <Link
                  to="/exams/create"
                  className="exam-schedule-primary-btn rounded-[16px] px-4 py-3 text-sm font-semibold text-white"
                >
                  Create Exam
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            {
              label: adminLoggedIn ? "Published Exams" : "Available Exams",
              value: counts.all,
              tone: "from-cyan-500/20 via-cyan-400/10 to-transparent",
              note: adminLoggedIn
                ? "Everything currently visible on the student schedule."
                : "All exams your account can access right now.",
            },
            {
              label: "Upcoming Window",
              value: counts.upcoming,
              tone: "from-emerald-500/20 via-emerald-400/10 to-transparent",
              note: counts.upcoming
                ? "Upcoming or active exams waiting on the next action."
                : "No new exams are scheduled yet.",
            },
            {
              label: "Completed",
              value: counts.completed,
              tone: "from-amber-500/20 via-amber-400/10 to-transparent",
              note: adminLoggedIn
                ? "Completed exams can be reviewed or updated from here."
                : "Your finished exams stay here for quick result access.",
            },
          ].map((card, index) => (
            <div
              key={card.label}
              className="exam-schedule-stat-card exam-schedule-fade relative overflow-hidden rounded-[24px] px-5 py-5"
              style={{ animationDelay: `${0.07 * (index + 1)}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.tone}`} />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
                  {card.value}
                </p>
                <p className="exam-schedule-muted mt-3 text-sm leading-6">{card.note}</p>
              </div>
            </div>
          ))}
        </section>

        {feedback && (
          <div
            className={[
              "mb-6 rounded-[18px] border px-5 py-4 text-sm",
              feedback.type === "error"
                ? "exam-schedule-feedback exam-schedule-feedback--error text-rose-200"
                : "exam-schedule-feedback exam-schedule-feedback--success text-emerald-200",
            ].join(" ")}
          >
            {feedback.text}
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-3">
          {[
            { label: "All", count: counts.all },
            { label: "Upcoming", count: counts.upcoming },
            { label: "Completed", count: counts.completed },
          ].map((item, index) => {
            const active = filter === item.label;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setFilter(item.label)}
                className={[
                  "exam-schedule-fade inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "exam-schedule-filter exam-schedule-filter--active text-cyan-100"
                    : "exam-schedule-filter text-slate-300 hover:text-white",
                ].join(" ")}
                style={{ animationDelay: `${0.08 * (index + 1)}s` }}
              >
                <span>{item.label}</span>
                <span className="exam-schedule-filter-count rounded-full px-2 py-0.5 text-xs text-inherit">
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
          </div>
        )}

        {error && (
          <div className="exam-schedule-feedback exam-schedule-feedback--error rounded-[18px] px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && filteredExams.length === 0 && (
          <div className="exam-schedule-empty rounded-[24px] px-6 py-8">
            <p className="text-lg font-semibold text-white">No exams found for this filter yet.</p>
            <p className="exam-schedule-muted mt-3 max-w-2xl text-sm leading-6">
              {filter === "All"
                ? "As soon as an admin publishes an exam, it will appear here with the date, duration, and start action."
                : `There are no ${filter.toLowerCase()} exams matching your current schedule view.`}
            </p>
            {adminLoggedIn ? (
              <p className="exam-schedule-muted mt-4 text-xs">
                Admin kenek top right `Create Exam` button eken timed exam ekak create kalama me
                list ekata penne.
              </p>
            ) : (
              <p className="exam-schedule-muted mt-4 text-xs">
                Admin kenek exam create karama me page eke penne.
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {filteredExams.map((exam, index) => {
            const dateBlock = formatDateBlock(exam.scheduledAt || exam.createdAt);
            const displayStatus = getExamDisplayStatus(exam, adminLoggedIn);
            const isUpcoming = displayStatus === "Upcoming";
            const examStarted = hasExamStarted(exam);
            const hasSubmitted = Boolean(exam.viewerHasSubmitted);
            const actionHref = hasSubmitted ? `/exam/${exam._id}/result` : `/exam/${exam._id}`;
            const actionLabel = hasSubmitted
              ? "View Results"
              : examStarted
                ? "Take Exam ->"
                : "Starts Soon";

            return (
              <article
                key={exam._id}
                className="exam-schedule-card exam-schedule-fade flex flex-col gap-5 rounded-[26px] px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
                style={{ animationDelay: `${0.08 * ((index % 6) + 1)}s` }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-5">
                  <div className="exam-schedule-date flex h-[84px] w-[78px] shrink-0 flex-col items-center justify-center rounded-[18px] text-center">
                    <span className="text-xs font-black tracking-[0.18em] text-cyan-200">
                      {dateBlock.month}
                    </span>
                    <span className="mt-1 text-[2rem] font-black leading-none tracking-[-0.04em] text-white">
                      {dateBlock.day}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-[1.75rem] font-semibold tracking-[-0.04em] text-white">
                      {exam.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {formatFullDate(exam.scheduledAt || exam.createdAt)}
                    </p>
                    <div className="exam-schedule-muted mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-cyan-300" />
                        {formatSemesterLabel(exam.semester)} - {exam.subject}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4 text-cyan-300" />
                        {exam.duration} min
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-cyan-300" />
                        {exam.totalMarks} marks
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-cyan-300" />
                        {formatScheduleTime(exam.scheduledAt, exam.startTime)}
                      </span>
                      {adminLoggedIn && exam.status === "Completed" && (
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-cyan-300" />
                          {exam.attemptCount || 0} attempted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 self-end lg:self-center">
                  <span
                    className={[
                      "rounded-full px-4 py-2 text-xs font-semibold",
                      hasSubmitted
                        ? "bg-emerald-500/14 text-emerald-300"
                        : isUpcoming && examStarted
                        ? "bg-cyan-500/14 text-cyan-100"
                        : "bg-amber-500/14 text-amber-200",
                    ].join(" ")}
                  >
                    {hasSubmitted
                      ? "Completed"
                      : isUpcoming && !examStarted
                        ? "Scheduled"
                        : displayStatus}
                  </span>

                  {adminLoggedIn ? (
                    <>
                      <Link
                        to={`/exams/${exam._id}/edit`}
                        className="inline-flex items-center gap-2 rounded-[16px] border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                      >
                        <Pencil className="h-4 w-4" />
                        Update
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(exam)}
                        className="inline-flex items-center gap-2 rounded-[16px] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <Link
                      to={hasSubmitted || examStarted ? actionHref : "#"}
                      onClick={(event) => {
                        if (!hasSubmitted && !examStarted) {
                          event.preventDefault();
                        }
                      }}
                      aria-disabled={!hasSubmitted && !examStarted}
                      className={[
                        "rounded-[16px] px-5 py-3 text-sm font-semibold transition",
                        hasSubmitted
                          ? "exam-schedule-secondary-btn text-slate-300 hover:text-white"
                          : examStarted
                            ? "exam-schedule-primary-btn text-white"
                          : "exam-schedule-soon-btn cursor-not-allowed text-amber-100",
                      ].join(" ")}
                    >
                      {actionLabel}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/75 px-4">
          <div className="exam-schedule-modal w-full max-w-md rounded-[26px] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Delete Exam?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Are you sure you want to delete "{deleteTarget.title}"? This action cannot be
                  undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="exam-schedule-icon-btn rounded-full p-2 text-slate-300 transition hover:text-white"
                disabled={deleteLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="exam-schedule-secondary-btn rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-[14px] bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
