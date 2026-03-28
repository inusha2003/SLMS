import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Layers, Loader2, Trash2, X } from "lucide-react";
import { API_BASE } from "../lib/api.js";
import { getAuthHeaders, getStoredUserSemester } from "../lib/session.js";
import {
  canAccessSemesterOption,  
  formatSemesterLabel,
  getSemesterOptions,
} from "../lib/semester.js";
const FLASHCARD_SEARCH_BLOCKED_CHARS = /[!@#$%^&*()]/g;   // search bar validation
const SEMESTER_OPTIONS = getSemesterOptions();

function subjectTagClass(subject) {
  const s = (subject || "").toLowerCase();
  if (s.includes("network")) return "bg-orange-500/18 text-orange-200 ring-orange-500/30";
  if (s.includes("database") || s.includes("sql")) {
    return "bg-cyan-500/18 text-cyan-200 ring-cyan-500/30";
  }
  return "bg-emerald-500/18 text-emerald-200 ring-emerald-500/30";
}

function sanitizeFlashcardSearch(value) {
  return value.replace(FLASHCARD_SEARCH_BLOCKED_CHARS, "");
}

export default function FlashcardDecksPage() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const storedUserSemester = useMemo(() => getStoredUserSemester(), []);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (semester) p.set("semester", semester);
    return p.toString();
  }, [search, semester]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = `${API_BASE}/api/flashcards${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load decks");
      setDecks(data.decks || []);
    } catch (e) {
      setError(e.message || "Error");
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function handleDeleteDeck() {
    if (!deleteTarget || deleteLoading) return;

    setDeleteLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/flashcards/${deleteTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete flashcard deck.");
      }

      setDeleteTarget(null);
      setFeedback({ type: "success", text: "Flashcard deck deleted successfully." });
      await load();
    } catch (e) {
      setFeedback({
        type: "error",
        text: e.message || "Could not delete flashcard deck.",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="slms-page min-h-full p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="slms-section-title text-3xl font-bold tracking-tight text-white">
          Flashcard Decks
        </h1>
        <p className="mt-1 text-sm slms-muted">
          Your saved AI-generated flashcards. Only you can see your decks.
        </p>
        <div className="slms-card mt-6 flex max-w-3xl flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search decks..."
            value={search}
            onChange={(e) => setSearch(sanitizeFlashcardSearch(e.target.value))}
            className="slms-input flex-1 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="slms-input rounded-2xl px-4 py-3 text-sm text-white focus:outline-none"
          >
            <option value="">All Semesters</option>
            {SEMESTER_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={!canAccessSemesterOption(storedUserSemester, option.value)}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {feedback && (
        <div
          className={[
            "mb-6 rounded-[18px] border px-4 py-3 text-sm",
            feedback.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      )}

      {loading && decks.length === 0 && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && decks.length === 0 && (
        <p className="slms-muted">No flashcard decks yet. Generate some from AI Tools.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {decks.map((d) => (
          <article
            key={d.id}
            className="slms-card group flex flex-col rounded-[26px] p-5 transition duration-200 hover:-translate-y-1"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 via-sky-400/20 to-orange-400/25 text-2xl">
                <Layers className="h-6 w-6 text-cyan-100" />
              </div>
              <div className="flex items-center gap-2">
                {d.isAiGenerated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/14 px-2.5 py-1 text-[10px] font-medium text-cyan-100 ring-1 ring-cyan-500/25">
                    <Bot className="h-3 w-3" /> AI Generated
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(d)}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-200 transition hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
            <span
              className={`mb-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${subjectTagClass(d.subject)}`}
            >
              {d.subject}
            </span>
            <h2 className="text-lg font-semibold text-white">{d.title}</h2>
            <p className="mt-2 text-sm slms-muted">
              {d.subject} · {formatSemesterLabel(d.semester)} · {d.cardCount} cards
            </p>
            <Link
              to={`/flashcards/study/${d.id}`}
              className="slms-primary-btn mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition"
            >
              Study Now <span aria-hidden>{"->"}</span>
            </Link>
          </article>
        ))}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/75 px-4">
          <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#10192a] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Delete Flashcard Deck?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Are you sure you want to delete "{deleteTarget.title}"?
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
                onClick={handleDeleteDeck}
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
