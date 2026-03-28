import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, Loader2 } from "lucide-react";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getAuthToken } from "../lib/session.js";
import { formatSemesterLabel } from "../lib/semester.js";

export default function ExamResultPage() {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const authToken = useMemo(() => getAuthToken(), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!authToken) {
        setError("Student login not found. Please log in as a student to view results.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl(`/api/assessment/exams/${examId}/result`), {
          headers: getAuthHeaders(),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Could not load result.");
        if (!cancelled) setData(json.performance || null);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load result.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, examId]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#090911] p-8">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#090911] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/exams" className="text-sm text-[#8d89ab] hover:text-white">
          ← Back to Exam Schedule
        </Link>

        <h1 className="mt-5 text-[2.8rem] font-black tracking-[-0.05em] text-white">
          Exam Result
        </h1>

        {error && (
          <div className="mt-6 rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="mt-8 rounded-[24px] border border-white/8 bg-[#141421] px-8 py-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/14 text-emerald-300">
                <Award className="h-8 w-8" />
              </div>
              <p className="mt-4 text-sm text-[#8d89ab]">{data.exam?.title || "Exam"}</p>
              <p className="mt-2 text-5xl font-black tracking-[-0.05em] text-emerald-400">
                {data.score}
                <span className="ml-2 text-lg font-medium text-[#8d89ab]">
                  / {data.totalMarks}
                </span>
              </p>
              <p className="mt-4 text-sm text-[#8d89ab]">
                {data.exam?.subject} · {formatSemesterLabel(data.exam?.semester)}
              </p>
              <p className="mt-2 text-xs text-[#6f6b8d]">
                Submitted{" "}
                {data.submittedAt
                  ? new Date(data.submittedAt).toLocaleString()
                  : "-"}
              </p>
            </div>

            {Array.isArray(data.reviewedAnswers) && data.reviewedAnswers.length > 0 && (
              <div className="mt-6 space-y-4">
                {data.reviewedAnswers.map((answer, index) => (
                  <article
                    key={`${answer.questionIndex}-${index}`}
                    className="rounded-[24px] border border-white/8 bg-[#141421] px-6 py-6"
                  >
                    <p className="text-sm text-[#8d89ab]">Question {index + 1}</p>
                    <h2 className="mt-2 text-lg font-semibold text-white">
                      {answer.question}
                    </h2>
                    <p className="mt-4 text-sm text-[#8d89ab]">
                      Your Answer:{" "}
                      <span className={answer.isCorrect ? "text-emerald-300" : "text-rose-300"}>
                        {answer.selectedOption || "Not answered"}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-[#8d89ab]">
                      Correct Answer:{" "}
                      <span className="text-emerald-300">{answer.correctAnswer}</span>
                    </p>
                    {answer.explanation && (
                      <p className="mt-3 text-sm leading-7 text-[#b4b0cf]">
                        {answer.explanation}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
