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
    const upcoming = exams.filter(
      (exam) => getExamDisplayStatus(exam, adminLoggedIn) === "Upcoming",
    ).length;
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
    <div className="slms-page min-h-full px-8 py-8 lg:px-10">
      <div className="slms-page-content mx-auto max-w-6xl">
        <header className="slms-card slms-hero slms-glow-ring slms-fade-up mb-10 rounded-[30px] px-6 py-7 lg:px-8">
          <div className="slms-animated-grid" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <span className="slms-chip inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-100">
                Assessment Flow
              </span>
              <h1 className="mt-4 text-[3rem] font-black tracking-[-0.05em] text-white">
                Exam Schedule
              </h1>
              <p className="mt-3 text-sm leading-7 slms-muted">
                Manage and monitor IT faculty exams across all semesters.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="slms-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-emerald-200">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                {counts.upcoming} Upcoming
              </span>
              {adminLoggedIn && (
                <Link
                  to="/exams/create"
                  className="slms-primary-btn rounded-[16px] px-4 py-3 text-sm font-semibold text-white"
                >
                  Create Exam
                </Link>
              )}
            </div>
          </div>
        </header>

        {feedback && (
          <div
            className={[
              "mb-6 rounded-[18px] border px-5 py-4 text-sm",
              feedback.type === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
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
                  "slms-fade-up inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "border-cyan-400/35 bg-cyan-400/10 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                    : "border-white/8 bg-[rgba(10,21,35,0.8)] text-slate-300 hover:border-white/15 hover:text-white",
                ].join(" ")}
                style={{ animationDelay: `${0.08 * (index + 1)}s` }}
              >
                <span>{item.label}</span>
                <span className="rounded-full bg-white/6 px-2 py-0.5 text-xs text-inherit">
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
          <div className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && filteredExams.length === 0 && (
          <div className="slms-card rounded-[24px] px-6 py-8">
            <p className="slms-muted">No exams found for this filter yet.</p>
            {adminLoggedIn ? (
              <p className="mt-4 text-xs slms-muted">
                Admin kenek top right `Create Exam` button eken timed exam ekak create kalama me
                list ekata penne.
              </p>
            ) : (
              <p className="mt-4 text-xs slms-muted">
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
                className="slms-card slms-hover-lift slms-fade-up flex flex-col gap-5 rounded-[26px] px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
                style={{ animationDelay: `${0.08 * ((index % 6) + 1)}s` }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-5">
                  <div className="flex h-[84px] w-[78px] shrink-0 flex-col items-center justify-center rounded-[18px] border border-white/10 bg-[#0c1d31] text-center">
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
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm slms-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-cyan-300" />
                        {formatSemesterLabel(exam.semester)} · {exam.subject}
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
                          ? "border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                          : examStarted
                            ? "slms-primary-btn text-white"
                          : "cursor-not-allowed border border-amber-500/20 bg-amber-500/10 text-amber-100",
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
          <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#10192a] p-6 shadow-2xl">
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
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
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
                className="rounded-[14px] border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
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
