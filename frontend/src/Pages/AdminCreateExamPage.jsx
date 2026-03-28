import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, isAdminLoggedIn } from "../lib/session.js";
import { getSemesterOptions } from "../lib/semester.js";

const SEMESTER_OPTIONS = getSemesterOptions();

function emptyQuestion() {
  return {
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    explanation: "",
  };
}

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AdminCreateExamPage({
  initialKind = "exam",
  lockedKind = false,
  examId = "",
}) {
  const navigate = useNavigate();
  const isEditMode = Boolean(examId);
  const [kind, setKind] = useState(initialKind);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("3");
  const [duration, setDuration] = useState("60");
  const [totalMarks, setTotalMarks] = useState("100");
  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setKind(initialKind);
  }, [initialKind]);

  useEffect(() => {
    if (!isEditMode) {
      setInitialLoading(false);
      return;
    }

    let cancelled = false;

    async function loadExam() {
      setInitialLoading(true);
      setError("");
      setMessage("");

      try {
        const res = await fetch(apiUrl(`/api/assessment/exams/${examId}`), {
          headers: getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load exam details.");
        }

        const exam = data.exam || {};
        if (cancelled) return;

        setKind(exam.kind || initialKind);
        setTitle(exam.title || "");
        setSubject(exam.subject || "");
        setSemester(String(exam.semester || "3"));
        setDuration(String(exam.duration || "60"));
        setTotalMarks(String(exam.totalMarks || "100"));

        const scheduleDate = exam.scheduledAt ? new Date(exam.scheduledAt) : null;
        setExamDate(
          scheduleDate && !Number.isNaN(scheduleDate.getTime())
            ? scheduleDate.toISOString().slice(0, 10)
            : ""
        );
        setStartTime(exam.startTime || "09:00");
        setQuestions(
          Array.isArray(exam.questions) && exam.questions.length > 0
            ? exam.questions.map((question) => ({
                question: question.question || "",
                optionA: question.options?.[0] || "",
                optionB: question.options?.[1] || "",
                optionC: question.options?.[2] || "",
                optionD: question.options?.[3] || "",
                correctAnswer: question.correctAnswer || "",
                explanation: question.explanation || "",
              }))
            : [emptyQuestion()]
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load exam details.");
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    loadExam();

    return () => {
      cancelled = true;
    };
  }, [examId, initialKind, isEditMode]);

  function updateQuestion(index, field, value) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question
      )
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, emptyQuestion()]);
  }

  function removeQuestion(index) {
    setQuestions((current) =>
      current.length === 1
        ? current
        : current.filter((_, questionIndex) => questionIndex !== index)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isAdminLoggedIn()) {
      setError("Admin login required before creating exams or MCQ Bank sets.");
      return;
    }

    const payloadQuestions = questions.map((question) => {
      const options = [
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ].map((option) => String(option || "").trim());

      return {
        question: String(question.question || "").trim(),
        options,
        correctAnswer: String(question.correctAnswer || "").trim(),
        explanation: String(question.explanation || "").trim(),
      };
    });

    for (const question of payloadQuestions) {
      if (!question.question || question.options.some((option) => !option)) {
        setError("Each question needs a prompt and all four options.");
        return;
      }

      if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
        setError("Correct answer must match one of the four option texts.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(
        apiUrl(isEditMode ? `/api/assessment/exams/${examId}` : "/api/assessment/exams"),
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: getAuthHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            kind,
            title: title.trim(),
            subject: subject.trim(),
            semester: Number(semester),
            duration: Number(duration),
            totalMarks: Number(totalMarks),
            examDate: kind === "exam" ? examDate : "",
            startTime: kind === "exam" ? startTime : "09:00",
            questions: payloadQuestions,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message ||
            (kind === "exam"
              ? isEditMode
                ? "Failed to update exam."
                : "Failed to create exam."
              : "Failed to save MCQ Bank set.")
        );
      }

      const destination = kind === "exam" ? "/exams" : "/mcq-bank";
      const successMessage =
        kind === "exam"
          ? isEditMode
            ? "Exam updated successfully."
            : "Timed exam created successfully."
          : isEditMode
            ? "MCQ Bank set updated successfully."
            : "MCQ Bank set created successfully.";

      setMessage(successMessage);
      setTimeout(
        () =>
          navigate(destination, {
            state: {
              feedback: {
                type: "success",
                text: successMessage,
              },
            },
          }),
        700
      );
    } catch (err) {
      setError(
        err.message ||
          (kind === "exam"
            ? isEditMode
              ? "Could not update exam."
              : "Could not create exam."
            : "Could not save MCQ Bank set.")
      );
    } finally {
      setLoading(false);
    }
  }

  const isExamMode = kind === "exam";
  const backHref = isExamMode ? "/exams" : "/mcq-bank";
  const backLabel = isExamMode ? "Back to Exam Schedule" : "Back to MCQ Bank";
  const pageTitle = isExamMode
    ? isEditMode
      ? "Update Exam"
      : "Create Exam"
    : isEditMode
      ? "Update MCQ Bank Set"
      : "Create MCQ Bank Set";
  const introText = useMemo(
    () =>
      isExamMode
        ? isEditMode
          ? "Update the exam details, schedule, and questions."
          : "Create timed exams for the Exam Schedule page."
        : isEditMode
          ? "Update this MCQ Bank set for students to review."
          : "Create a standalone MCQ Bank set for students to review with correct answers and explanations.",
    [isEditMode, isExamMode]
  );
  const minExamDate = useMemo(() => getTodayDateInputValue(), []);

  if (initialLoading) {
    return (
      <div className="min-h-full bg-[#090911] px-8 py-8 lg:px-10">
        <div className="mx-auto flex max-w-5xl justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-violet-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#090911] px-8 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link to={backHref} className="text-sm text-[#8d89ab] hover:text-white">
          {`<- ${backLabel}`}
        </Link>

        <header className="mt-5">
          <h1 className="text-[3rem] font-black tracking-[-0.05em] text-white">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-[#8d89ab]">{introText}</p>
          {!lockedKind && (
            <p className="mt-2 text-xs text-[#777394]">
              `Timed Exam` hadoth item eka `Exams` page eke penne. `MCQ Bank Set` hadoth item eka
              `MCQ Bank` page eke penne.
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {!lockedKind && (
            <section className="rounded-[24px] border border-white/8 bg-[#141421] px-6 py-6">
              <h2 className="text-xl font-semibold text-white">Assessment Type</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "exam",
                    title: "Timed Exam",
                    description: "Student semester ekata adala countdown ekka submit wenna.",
                  },
                  {
                    value: "mcq_bank",
                    title: "MCQ Bank Set",
                    description: "Students ta answer saha explanation review karanna.",
                  },
                ].map((option) => {
                  const active = kind === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setKind(option.value)}
                      className={[
                        "rounded-[18px] border px-4 py-4 text-left transition-all",
                        active
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "border-[#2a2940] bg-[#171726]",
                      ].join(" ")}
                    >
                      <div className="text-base font-semibold text-white">{option.title}</div>
                      <div className="mt-1 text-sm text-[#8d89ab]">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-[24px] border border-white/8 bg-[#141421] px-6 py-6">
            <h2 className="text-xl font-semibold text-white">
              {isExamMode ? "Exam Details" : "MCQ Bank Details"}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                  Title
                </span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                  placeholder={
                    isExamMode
                      ? "e.g. Data Structures Midterm"
                      : "e.g. Data Structures Practice Set"
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                  Subject
                </span>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                  placeholder="e.g. Data Structures"
                />
              </label>

              <label className="relative block">
                <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                  Semester
                </span>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full appearance-none rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 pr-11 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                >
                  {SEMESTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-[48px] h-5 w-5 text-[#8a86a7]" />
              </label>

              {isExamMode && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                    Duration (minutes)
                  </span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                  />
                </label>
              )}

              {isExamMode && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                    Total Marks
                  </span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                  />
                </label>
              )}

              {isExamMode && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                    Exam Date
                  </span>
                  <input
                    required
                    type="date"
                    min={minExamDate}
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                  />
                </label>
              )}

              {isExamMode && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                    Start Time
                  </span>
                  <input
                    required
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                  />
                </label>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">MCQ Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-2 rounded-[14px] bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>

            {questions.map((question, index) => (
              <article
                key={index}
                className="rounded-[24px] border border-white/8 bg-[#141421] px-6 py-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-violet-300">
                    Question {index + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="rounded-full border border-rose-500/30 p-2 text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                    Question Text
                  </span>
                  <textarea
                    required
                    rows={3}
                    value={question.question}
                    onChange={(e) => updateQuestion(index, "question", e.target.value)}
                    className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                    placeholder="Enter the question"
                  />
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {["A", "B", "C", "D"].map((letter) => (
                    <label key={letter} className="block">
                      <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                        Option {letter}
                      </span>
                      <input
                        required
                        value={question[`option${letter}`]}
                        onChange={(e) =>
                          updateQuestion(index, `option${letter}`, e.target.value)
                        }
                        className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                        placeholder={`Enter option ${letter}`}
                      />
                    </label>
                  ))}
                </div>

                <label className="relative mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                    Correct Answer
                  </span>
                  <select
                    required
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                    className="w-full appearance-none rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 pr-11 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                  >
                    <option value="">Select the correct option text</option>
                    {[question.optionA, question.optionB, question.optionC, question.optionD]
                      .filter((option) => option.trim())
                      .map((option) => (
                        <option key={option} value={option.trim()}>
                          {option.trim()}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-[48px] h-5 w-5 text-[#8a86a7]" />
                </label>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-[#8d89ab]">
                    Explanation
                  </span>
                  <textarea
                    rows={3}
                    value={question.explanation}
                    onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                    className="w-full rounded-[14px] border border-[#2a2940] bg-[#171726] px-4 py-3.5 text-white focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                    placeholder="Add a short explanation for the correct answer"
                  />
                </label>
              </article>
            ))}
          </section>

          {error && (
            <div className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#7062ff] to-[#7666f9] text-base font-semibold text-white shadow-[0_18px_35px_rgba(94,82,255,0.25)] transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isExamMode
                  ? isEditMode
                    ? "Updating Exam..."
                    : "Creating Exam..."
                  : isEditMode
                    ? "Updating MCQ Bank Set..."
                    : "Creating MCQ Bank Set..."}
              </>
            ) : isExamMode ? (
              isEditMode ? "Update Exam" : "Create Timed Exam"
            ) : isEditMode ? (
              "Update MCQ Bank Set"
            ) : (
              "Create MCQ Bank Set"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
