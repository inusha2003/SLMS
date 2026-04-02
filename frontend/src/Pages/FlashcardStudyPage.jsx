import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { API_BASE } from "../lib/api.js";
import { getAuthHeaders } from "../lib/session.js";
import { formatSemesterLabel } from "../lib/semester.js";

export default function FlashcardStudyPage() {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/flashcards/${deckId}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Deck not found");
        if (!cancelled) setDeck(data.deck);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const cards = deck?.cards || [];
  const card = cards[index];
  const total = cards.length;

  useEffect(() => {
    setShowAnswer(false);
  }, [index]);

  if (loading) {
    return (
      <div className="slms-page flex min-h-full items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="slms-page p-8">
        <div className="slms-card mx-auto max-w-2xl rounded-[28px] p-8">
          <p className="text-rose-300">{error || "Not found"}</p>
          <Link
            to="/flashcards"
            className="mt-4 inline-block text-cyan-300 transition hover:text-cyan-200"
          >
            Back to decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="slms-page min-h-full p-6 lg:p-8">
      <div className="slms-page-content mx-auto max-w-xl">
        <header className="slms-card slms-hero slms-glow-ring slms-fade-up rounded-[30px] px-6 py-7 lg:px-8">
          <div className="slms-animated-grid" />
          <div className="relative z-10">
            <Link
              to="/flashcards"
              className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Flashcard Decks
            </Link>
            <h1 className="mt-4 text-[2.4rem] font-black tracking-[-0.05em] text-white">
              {deck.title}
            </h1>
            <p className="mt-2 text-sm slms-muted">
              {deck.subject} · {formatSemesterLabel(deck.semester)} · {total} cards
            </p>
          </div>
        </header>

        {total === 0 ? (
          <div className="slms-card mt-8 rounded-[26px] p-8">
            <p className="slms-muted">This deck has no cards.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between gap-3">
              <div className="slms-chip rounded-full px-4 py-2 text-sm font-semibold text-cyan-100">
                Card {index + 1} / {total}
              </div>
              <button
                type="button"
                onClick={() => setShowAnswer((s) => !s)}
                className="slms-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-orange-100 transition hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                {showAnswer ? "Show Question" : "Reveal Answer"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAnswer((s) => !s)}
              className="slms-flip-scene mt-6 block w-full text-left"
              aria-label={showAnswer ? "Show question side" : "Show answer side"}
            >
              <div
                className={[
                  "slms-flip-card min-h-[270px] w-full",
                  showAnswer ? "is-flipped" : "",
                ].join(" ")}
              >
                <div className="slms-flip-face slms-card slms-hover-lift flex min-h-[270px] w-full flex-col justify-between rounded-[24px] p-5">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                      Question
                    </span>
                    <p className="mt-4 text-[1.3rem] font-semibold leading-tight text-white">
                      {card?.question}
                    </p>
                  </div>
                  <p className="text-[13px] leading-6 slms-muted">
                    Click the card to flip and reveal the answer.
                  </p>
                </div>

                <div className="slms-flip-face slms-flip-back slms-card slms-hover-lift flex min-h-[270px] w-full flex-col justify-between rounded-[24px] p-5">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200/80">
                      Answer
                    </span>
                    <p className="mt-4 text-sm leading-6 text-slate-200">
                      {card?.answer}
                    </p>
                  </div>
                  <p className="text-[13px] leading-6 slms-muted">
                    Click again to flip back to the question side.
                  </p>
                </div>
              </div>
            </button>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 rounded-[16px] border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              {index >= total - 1 ? (
                <Link
                  to="/flashcards"
                  className="slms-primary-btn inline-flex items-center gap-1 rounded-[16px] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Finish
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                  className="slms-primary-btn inline-flex items-center gap-1 rounded-[16px] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
