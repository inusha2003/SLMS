import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Loader2 } from "lucide-react";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getAuthToken } from "../lib/session.js";
import { formatSemesterLabel } from "../lib/semester.js";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ExamInterfacePage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const autoSubmitDone = useRef(false);

  const authToken = useMemo(() => getAuthToken(), []);

  useEffect(() => {
    autoSubmitDone.current = false;
  }, [examId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl(`/api/assessment/exams/${examId}`), {
          headers: getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Exam not found.");

        if (cancelled) return;

        setExam(data.exam || null);
        setAlreadySubmitted(Boolean(data.viewerHasSubmitted));
        setSecondsLeft((Number(data.exam?.duration) || 1) * 60);

        if (data.viewerHasSubmitted) {
          navigate(`/exam/${examId}/result`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load exam.");
          setExam(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, examId, navigate]);

  useEffect(() => {
    if (!exam || alreadySubmitted) return undefined;
    const timerId = setInterval(() => {
      setSecondsLeft((currentSeconds) => (currentSeconds <= 1 ? 0 : currentSeconds - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, [alreadySubmitted, exam]);

  const questions = useMemo(() => exam?.questions || [], [exam]);
  const totalQuestions = questions.length;

  const handleSubmit = useCallback(async () => {
    if (!authToken) {
      setError("Student login not found. Please log in as a student before taking the exam.");
      return;
    }
    if (submitting || alreadySubmitted || !exam) return;

    setSubmitting(true);
    setError("");
    try {
      const answersPayload = questions.map((_, index) => ({
        questionIndex: index,
        selectedOption: answers[index] ?? "",
      }));

      const res = await fetch(apiUrl(`/api/assessment/exams/${examId}/submit`), {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ answers: answersPayload }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Submit failed.");

      navigate(`/exam/${examId}/result`, { replace: true });
    } catch (err) {
      const message = err.message || "Submit failed.";
      if (message.toLowerCase().includes("already submitted")) {
        navigate(`/exam/${examId}/result`, { replace: true });
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [alreadySubmitted, answers, authToken, exam, examId, navigate, questions, submitting]);

  useEffect(() => {
    if (!exam || alreadySubmitted || submitting || autoSubmitDone.current || secondsLeft !== 0) {
      return;
    }
    autoSubmitDone.current = true;
    handleSubmit();
  }, [alreadySubmitted, exam, handleSubmit, secondsLeft, submitting]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#090911] p-8">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-full bg-[#090911] p-8 text-white">
        <p className="text-rose-300">{error || "Exam not found."}</p>
        <Link to="/exams" className="mt-4 inline-block text-violet-400 hover:underline">
          Back to Exam Schedule
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[current];

  return (
    <div className="min-h-full bg-[#090911] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 text-sm text-[#8d89ab] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exam Schedule
          </Link>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-[14px] border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-violet-200">
              <Clock3 className="h-4 w-4" />
              <span className="font-mono text-base font-semibold">
                {formatTime(secondsLeft)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-[14px] bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>

        <header className="rounded-[24px] border border-white/8 bg-[#141421] px-6 py-6">
          <p className="text-sm text-[#8d89ab]">
            {exam.subject} · {formatSemesterLabel(exam.semester)}
          </p>
          <h1 className="mt-2 text-[2.4rem] font-black tracking-[-0.05em] text-white">
            {exam.title}
          </h1>
          <p className="mt-2 text-sm text-[#8d89ab]">
            {exam.duration} minutes · {exam.totalMarks} total marks · {totalQuestions} questions
          </p>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              className={[
                "h-11 w-11 rounded-[12px] text-sm font-semibold transition-all",
                current === index
                  ? "bg-violet-600 text-white"
                  : answers[index]
                    ? "bg-emerald-500/16 text-emerald-300"
                    : "bg-[#171726] text-[#8d89ab] hover:text-white",
              ].join(" ")}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestion && (
          <section className="mt-6 rounded-[24px] border border-white/8 bg-[#141421] px-6 py-6">
            <p className="text-sm text-[#8d89ab]">
              Question {current + 1} of {totalQuestions}
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-8 text-white">
              {currentQuestion.question}
            </h2>

            <div className="mt-6 space-y-3">
              {(currentQuestion.options || []).map((option, optionIndex) => {
                const selected = answers[current] === option;
                return (
                  <button
                    key={`${option}-${optionIndex}`}
                    type="button"
                    onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [current]: option }))}
                    className={[
                      "flex w-full items-center gap-3 rounded-[16px] border px-4 py-4 text-left transition-all",
                      selected
                        ? "border-violet-500 bg-violet-500/14 text-white"
                        : "border-white/8 bg-[#171726] text-[#d7d3ef] hover:border-white/15",
                    ].join(" ")}
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#232237] text-xs font-semibold text-[#a9a5c6]">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((value) => Math.max(0, value - 1))}
            className="rounded-[14px] border border-white/10 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Previous
          </button>

          {current < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => setCurrent((value) => Math.min(totalQuestions - 1, value + 1))}
              className="rounded-[14px] bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-[14px] bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Finish Exam"}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
