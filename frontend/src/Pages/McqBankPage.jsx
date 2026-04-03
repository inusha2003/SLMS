import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock3,
  Loader2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { apiUrl } from "../lib/api.js";
import {
  getAuthHeaders,
  getStoredUserRole,
  getStoredUserSemester,
  isAdminLoggedIn,
} from "../lib/session.js";
import {
  canAccessSemesterOption,
  formatSemesterLabel,
  getSemesterOptions,
} from "../lib/semester.js";

const SEMESTER_OPTIONS = getSemesterOptions();

function validateSearchQuery(value) {
  const trimmed = String(value || "").trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { ok: true, normalized: "" };
  }

  if (trimmed.length > 60) {
    return { ok: false, message: "Search must be 60 characters or fewer." };
  }

  if (/[<>]/.test(trimmed) || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return { ok: false, message: "Search contains unsupported characters." };
  }

  if (!/[A-Za-z0-9]/.test(trimmed)) {
    return { ok: false, message: "Search must include at least one letter or number." };
  }

  if (!/^[A-Za-z0-9\s&'(),./+-]+$/.test(trimmed)) {
    return {
      ok: false,
      message: "Use letters, numbers, spaces, and basic punctuation only.",
    };
  }

  return { ok: true, normalized: trimmed };
}

function sanitizeSearchInput(value) {
  return String(value || "").replace(/[^A-Za-z0-9\s&'(),./+-]/g, "");
}

function subjectPillClass(subject) {
  const s = String(subject || "").toLowerCase();
  if (s.includes("network")) return "bg-orange-500/18 text-orange-200";
  if (s.includes("database") || s.includes("sql")) return "bg-cyan-500/18 text-cyan-200";
  return "bg-emerald-500/18 text-emerald-200";
}

function canStudentAccessMcqSet(studentSemesterValue, setSemesterValue) {
  const studentSemester = Number(studentSemesterValue);
  const setSemester = Number(setSemesterValue);

  if (!Number.isFinite(studentSemester) || !Number.isFinite(setSemester)) {
    return false;
  }

  if (studentSemester >= 7) {
    return true;
  }

  return setSemester <= studentSemester;
}

export default function McqBankPage() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const adminLoggedIn = useMemo(() => isAdminLoggedIn(), []);
  const storedUserRole = useMemo(() => getStoredUserRole(), []);
  const storedUserSemester = useMemo(() => getStoredUserSemester(), []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    const searchValidation = validateSearchQuery(search);
    if (searchValidation.ok && searchValidation.normalized) {
      params.set("q", searchValidation.normalized);
    }
    if (semester) params.set("semester", semester);
    if (subject) params.set("subject", subject);
    return params.toString();
  }, [search, semester, subject]);

  const subjectOptions = useMemo(() => {
    if (!semester) return [];
    return subjects;
  }, [semester, subjects]);

  const load = useCallback(async () => {
    const searchValidation = validateSearchQuery(search);
    if (!searchValidation.ok) {
      setSearchError(searchValidation.message);
      setError("");
      setLoading(false);
      setSets([]);
      setSubjects([]);
      return;
    }

    if (
      storedUserRole === "Student" &&
      semester &&
      !canAccessSemesterOption(storedUserSemester, semester)
    ) {
      setSearchError("");
      setError("You cannot select a semester beyond your registered year and semester.");
      setLoading(false);
      setSets([]);
      setSubjects([]);
      return;
    }

    setSearchError("");
    setLoading(true);
    setError("");
    try {
      const url = `${apiUrl("/api/mcq-bank")}${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load MCQ sets.");
      const incomingSets = Array.isArray(data.sets) ? data.sets : [];
      const visibleSets =
        storedUserRole === "Student"
          ? incomingSets.filter((set) =>
              canStudentAccessMcqSet(storedUserSemester, set.semester)
            )
          : incomingSets;
      setSets(visibleSets);
      setSubjects(Array.isArray(data.filters?.subjects) ? data.filters.subjects : []);
    } catch (err) {
      setError(err.message || "Error");
      setSets([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [queryString, search, semester, storedUserRole, storedUserSemester]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timerId);
  }, [load]);

  useEffect(() => {
    setSubject("");
  }, [semester]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timerId = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timerId);
  }, [feedback]);

  async function handleDeleteSet() {
    if (!deleteTarget || deleteLoading) return;

    setDeleteLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl(`/api/assessment/exams/${deleteTarget.id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to delete MCQ Bank set.");

      setDeleteTarget(null);
      setFeedback({ type: "success", text: "MCQ Bank set deleted successfully." });
      await load();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not delete MCQ Bank set.",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="slms-page min-h-full px-8 py-8 lg:px-10">
      <div className="slms-page-content mx-auto max-w-6xl">
        <header className="slms-card slms-hero slms-glow-ring slms-fade-up mb-8 rounded-[30px] px-6 py-7 lg:px-8">
          <div className="slms-animated-grid" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <span className="slms-chip inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Practice Library
              </span>
              <h1 className="mt-4 text-[3rem] font-black tracking-[-0.05em] text-white">
                MCQ Bank
              </h1>
              <p className="mt-3 text-sm leading-7 slms-muted">
                Browse standalone admin-created MCQ sets, filter by semester and subject,
                and review correct answers with explanations.
              </p>
            </div>

            {adminLoggedIn && (
              <Link
                to="/mcq-bank/create"
                className="slms-primary-btn inline-flex items-center gap-2 self-start rounded-[16px] px-4 py-3 text-sm font-semibold text-white"
              >
                Create MCQ Bank
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
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

        <section className="slms-card slms-fade-up slms-stagger-1 mb-8 rounded-[26px] px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                maxLength={60}
                onChange={(e) => {
                  const sanitizedValue = sanitizeSearchInput(e.target.value);
                  setSearch(sanitizedValue);
                  if (searchError) {
                    const validation = validateSearchQuery(sanitizedValue);
                    setSearchError(validation.ok ? "" : validation.message);
                  }
                }}
                placeholder="Search by subject or set name..."
                className={[
                  "slms-input w-full rounded-[16px] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none",
                  searchError ? "border border-rose-500/40" : "",
                ].join(" ")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <label className="relative block">
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="slms-input w-full appearance-none rounded-[16px] px-4 py-3.5 pr-11 text-sm text-white focus:outline-none"
                >
                  <option value="">All Semesters</option>
                  {SEMESTER_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={
                        storedUserRole === "Student" &&
                        !canAccessSemesterOption(storedUserSemester, option.value)
                      }
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </label>

              <label className="relative block">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!semester}
                  className="slms-input w-full appearance-none rounded-[16px] px-4 py-3.5 pr-11 text-sm text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {semester ? "All Subjects" : "Select Semester First"}
                  </option>
                  {subjectOptions.map((subjectName) => (
                    <option key={subjectName} value={subjectName}>
                      {subjectName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </label>
            </div>

            <div className="slms-chip ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-cyan-100">
              {sets.length} sets
            </div>
          </div>
          {storedUserRole === "Student" && (
            <p className="mt-3 text-xs slms-muted">
              You can only select up to your registered academic year and semester.
            </p>
          )}
        </section>

        {searchError && (
          <div className="mb-6 rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {searchError}
          </div>
        )}

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

        {!loading && !error && sets.length === 0 && (
          <div className="slms-card rounded-[24px] px-6 py-8">
            <p className="slms-muted">No MCQ Bank sets found yet.</p>
            {adminLoggedIn ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/mcq-bank/create"
                  className="slms-primary-btn inline-flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold text-white"
                >
                  Create MCQ Bank
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <p className="self-center text-xs slms-muted">
                  MCQ Bank eka exam ekata sambandayak nathi standalone review set ekak widiyata create wenawa.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs slms-muted">
                Admin kenek MCQ Bank set create karama me page eke penne.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sets.map((set, index) => (
            <article
              key={set.id}
              className="slms-card slms-hover-lift slms-fade-up flex flex-col rounded-[26px] p-5"
              style={{ animationDelay: `${0.08 * ((index % 6) + 1)}s` }}
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${subjectPillClass(set.subject)}`}
                >
                  {set.subject}
                </span>
              </div>

              <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
                {set.title}
              </h2>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm slms-muted">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-cyan-300" />
                  {formatSemesterLabel(set.semester)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-cyan-300" />
                  {set.questionCount} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                  {set.duration} min reference
                </span>
              </div>

              <Link
                to={`/mcq-bank/${set.id}`}
                className="slms-primary-btn mt-6 flex items-center justify-center rounded-[16px] px-4 py-3 text-sm font-semibold text-white"
              >
                Open MCQ Set →
              </Link>

              {adminLoggedIn && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Link
                    to={`/mcq-bank/${set.id}/edit`}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                  >
                    <Pencil className="h-4 w-4" />
                    Update
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(set)}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/75 px-4">
          <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#10192a] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Delete MCQ Bank Set?</h2>
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
                onClick={handleDeleteSet}
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
