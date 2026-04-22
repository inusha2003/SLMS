import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getStoredUserRole, getStoredUserSemester } from "../lib/session.js";
import { formatSemesterLabel, parseSemesterValue } from "../lib/semester.js";

function canStudentAccessMcqSet(studentSemesterValue, setSemesterValue) {
  const studentSemester = parseSemesterValue(studentSemesterValue);
  const setSemester = parseSemesterValue(setSemesterValue);

  if (!Number.isFinite(studentSemester) || !Number.isFinite(setSemester)) {
    return false;
  }

  if (studentSemester >= 7) {
    return true;
  }

  return setSemester <= studentSemester;
}

export default function McqBankStudyPage() {
  const { examId } = useParams();
  const [setData, setSetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const storedUserRole = useMemo(() => getStoredUserRole(), []);
  const storedUserSemester = useMemo(() => getStoredUserSemester(), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl(`/api/mcq-bank/${examId}`), {
          headers: getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load MCQ set.");
        if (
          storedUserRole === "Student" &&
          !canStudentAccessMcqSet(storedUserSemester, data.set?.semester)
        ) {
          throw new Error("You do not have access to this MCQ set for your current semester.");
        }
        if (!cancelled) setSetData(data.set || null);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load MCQ set.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, storedUserRole, storedUserSemester]);

  const questions = useMemo(() => setData?.questions || [], [setData]);
  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#090911] p-8">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!setData) {
    return (
      <div className="min-h-full bg-[#090911] p-8 text-white">
        <p className="text-rose-300">{error || "MCQ set not found."}</p>
        <Link to="/mcq-bank" className="mt-4 inline-block text-violet-400 hover:underline">
          Back to MCQ Bank
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#090911] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/mcq-bank"
          className="inline-flex items-center gap-2 text-sm text-[#8d89ab] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to MCQ Bank
        </Link>

        <header className="mt-5 rounded-[24px] border border-white/8 bg-[#141421] px-6 py-6">
          <p className="text-sm text-[#8d89ab]">
            {setData.subject} · {formatSemesterLabel(setData.semester)}
          </p>
          <h1 className="mt-2 text-[2.5rem] font-black tracking-[-0.05em] text-white">
            {setData.title}
          </h1>
          <p className="mt-2 text-sm text-[#8d89ab]">
            Review admin-created MCQs and see the correct answer with explanation.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={[
                "h-11 w-11 rounded-[12px] text-sm font-semibold transition-all",
                currentIndex === index
                  ? "bg-violet-600 text-white"
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
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-8 text-white">
              {currentQuestion.question}
            </h2>

            <div className="mt-6 space-y-3">
              {(currentQuestion.options || []).map((option, optionIndex) => {
                const correct = currentQuestion.correctAnswer === option;
                return (
                  <div
                    key={`${option}-${optionIndex}`}
                    className={[
                      "flex w-full items-center justify-between rounded-[16px] border px-4 py-4 text-left transition-all",
                      correct
                        ? "border-emerald-500/35 bg-emerald-500/14 text-emerald-100"
                        : "border-white/8 bg-[#171726] text-[#d7d3ef]",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={[
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold",
                          correct
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-[#232237] text-[#a9a5c6]",
                        ].join(" ")}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option}</span>
                    </span>

                    {correct ? <Check className="h-5 w-5 text-emerald-300" /> : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[18px] border border-emerald-500/25 bg-emerald-500/8 px-5 py-4">
              <p className="text-sm font-semibold text-white">
                Correct Answer:{" "}
                <span className="text-emerald-300">{currentQuestion.correctAnswer}</span>
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/75">
                Explanation
              </p>
              <p className="mt-2 text-sm leading-7 text-[#d6f5e2]">
                {currentQuestion.explanation}
              </p>
            </div>
          </section>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            className="rounded-[14px] border border-white/10 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <Link
              to="/mcq-bank"
              className="rounded-[14px] bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Finish
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))
              }
              className="rounded-[14px] bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
