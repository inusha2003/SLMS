import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  FileText,
  FileUp,
  Layers,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getStoredUserSemester, isLoggedIn } from "../lib/session.js"; // register user accesss validation
import { canAccessSemesterOption, getSemesterOptions } from "../lib/semester.js";

const CONTENT_TYPES = [
  {
    id: "notes",
    label: "AI Smart Notes",
    description: "Generate concise study notes on any topic",
    icon: FileText,
  },
  {
    id: "mcq",
    label: "Generate MCQ",
    description: "Create 10 multiple choice questions with explanations",
    icon: Pencil,
  },
  {
    id: "flashcards",
    label: "AI Flashcards",
    description: "Build study flashcards with Q&A format",
    icon: Layers,
  },
];
const SEMESTER_OPTIONS = getSemesterOptions();

function getGenerateLabel(type) {
  if (type === "notes") return "Generate AI Smart Notes";
  if (type === "mcq") return "Generate Generate MCQ";
  return "Generate AI Flashcards";
}

function getSelectionPalette(type) {
  if (type === "mcq") {
    return {
      selected:
        "border-orange-400/50 bg-orange-400/[0.08] shadow-[0_0_0_1px_rgba(251,146,60,0.12)]",
      icon: "text-orange-200",
      check: "text-orange-300",
    };
  }
  if (type === "flashcards") {
    return {
      selected:
        "border-cyan-400/50 bg-cyan-400/[0.08] shadow-[0_0_0_1px_rgba(34,211,238,0.12)]",
      icon: "text-cyan-200",
      check: "text-cyan-300",
    };
  }
  return {
    selected:
      "border-emerald-400/55 bg-emerald-400/[0.08] shadow-[0_0_0_1px_rgba(52,211,153,0.12)]",
    icon: "text-emerald-200",
    check: "text-emerald-300",
  };
}

function cleanInlineMarkdown(text) {
  return String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^[*\u2022\-\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNotesMarkdown(markdown) {
  const lines = String(markdown || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== "---");

  const sections = [];
  let intro = [];
  let currentSection = null;

  function pushCurrentSection() {
    if (!currentSection) return;
    currentSection.items = currentSection.items.filter(
      (item) => item.title || item.text
    );
    sections.push(currentSection);
    currentSection = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/^#{1,6}\s*/, "").trim();
    if (!line) continue;

    const isHeading =
      /^#{1,6}\s+/.test(rawLine) ||
      /^\d+[\.\)]\s+/.test(line) ||
      /:$/.test(line);

    if (isHeading) {
      pushCurrentSection();
      currentSection = {
        title: cleanInlineMarkdown(line.replace(/^\d+[\.\)]\s*/, "").replace(/:$/, "")),
        items: [],
      };
      continue;
    }

    const bulletText = cleanInlineMarkdown(
      line.replace(/^[*\u2022-]\s*/, "")
    );
    const splitMatch = bulletText.match(/^([^:]+):\s*(.+)$/);

    if (!currentSection) {
      intro.push(bulletText);
      continue;
    }

    if (splitMatch) {
      currentSection.items.push({
        title: splitMatch[1].trim(),
        text: splitMatch[2].trim(),
      });
      continue;
    }

    currentSection.items.push({
      title: "",
      text: bulletText,
    });
  }

  pushCurrentSection();

  return {
    intro,
    sections,
  };
}

function isEnglishLettersOnly(value) {
  return /^[A-Za-z\s]+$/.test(String(value || "").trim());
}

function sanitizeLettersOnlyInput(value) {
  return String(value || "").replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");
}

export default function AiContentGenerator() {
  const [contentType, setContentType] = useState("notes");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [lessonFile, setLessonFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // current login student register semester validation for content generation
  const [saveStatus, setSaveStatus] = useState("");
  const storedUserSemester = useMemo(() => getStoredUserSemester(), []);
  const isFileMode = Boolean(lessonFile);
  const isGenerateDisabled =
    loading || (!isFileMode && (!topic.trim() || !subject.trim()));
  const displayTopic = result?.meta?.topic || topic || "Topic";
  const displaySubject = result?.meta?.subject || subject;
  const displaySemester = result?.meta?.semester || semester;
  const parsedNotes = useMemo(() => {
    if (result?.kind !== "notes" || !result.data?.markdown) {
      return { intro: [], sections: [] };
    }
    return parseNotesMarkdown(result.data.markdown);
  }, [result]);

  function handleLessonFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!validTypes.includes(file.type)) {
      setError("Upload a PDF or PPTX file only.");
      e.target.value = "";
      return;
    }

    setError("");
    setLessonFile(file);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSaveStatus("");

    if (!isFileMode && (!topic.trim() || !subject.trim() || !semester)) {
      setError("Please enter Topic, Subject, and Semester.");
      return;
    }

    if (!isFileMode && !canAccessSemesterOption(storedUserSemester, semester)) {
      setError("You cannot select a semester beyond your registered year and semester.");
      return;
    }

    if (
      !isFileMode &&
      (!isEnglishLettersOnly(topic) || !isEnglishLettersOnly(subject))
    ) {
      setError("Topic and Subject can contain English letters and spaces only.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: contentType,
        topic: topic.trim(),
        subject: subject.trim(),
        semester,
      };

      const res = lessonFile
        ? await fetch(apiUrl("/api/content/generate-from-file"), {
            method: "POST",
            body: (() => {
              const formData = new FormData();
              formData.append("type", payload.type);
              formData.append("topic", payload.topic);
              formData.append("subject", payload.subject);
              formData.append("semester", payload.semester);
              formData.append("lessonFile", lessonFile);
              return formData;
            })(),
          })
        : await fetch(apiUrl("/api/content/generate"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }
      setResult(data);
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToDecks() {
    setSaveStatus("");
    setError("");

    if (!isLoggedIn()) {
      setError("Please log in as a student before saving flashcards.");
      return;
    }

    if (!result || result.kind !== "flashcards" || !result.data?.cards?.length) {
      setError("Nothing to save.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/content/flashcard-decks"), {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          title: displayTopic || "AI Flashcards",
          subject: displaySubject || "Uploaded Lesson",
          semester: Number(displaySemester) || 1,
          cards: result.data.cards,
          isAiGenerated: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Save failed (${res.status})`);
      }
      setSaveStatus("Saved to My Decks successfully.");
    } catch (err) {
      setError(err.message || "Could not save deck.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="slms-page min-h-full px-8 py-7 lg:px-9">
      <div className="slms-page-content flex min-h-full flex-col gap-8">
        <header className="slms-card slms-hero slms-glow-ring slms-fade-up overflow-hidden rounded-[30px] px-6 py-7 lg:px-8">
          <div className="slms-animated-grid" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="slms-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                AI Study Studio
              </span>
              <h1 className="mt-4 text-[3rem] font-black tracking-[-0.05em] text-white sm:text-[3.5rem]">
                AI Content Generator
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 slms-muted">
                Enter a topic and generate notes, MCQs, or flashcards inside a more
                premium workspace with richer color, depth, and motion.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="slms-chip slms-fade-up slms-stagger-1 rounded-[20px] px-4 py-3 text-sm text-slate-200">
                <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">
                  Output
                </p>
                <p className="mt-1 font-semibold text-white">Notes, MCQ, Cards</p>
              </div>
              <div className="slms-chip slms-fade-up slms-stagger-2 rounded-[20px] px-4 py-3 text-sm text-slate-200">
                <p className="text-[11px] uppercase tracking-[0.22em] text-orange-200/80">
                  Source
                </p>
                <p className="mt-1 font-semibold text-white">Topic or PDF/PPTX</p>
              </div>
              <div className="slms-chip slms-fade-up slms-stagger-3 rounded-[20px] px-4 py-3 text-sm text-slate-200">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/80">
                  Speed
                </p>
                <p className="mt-1 font-semibold text-white">Instant generation</p>
              </div>
            </div>
          </div>
        </header>

      <div className="grid flex-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={handleGenerate} className="flex flex-col gap-6">
          <section className="slms-card slms-hover-lift slms-fade-up slms-stagger-1 rounded-[26px] px-6 py-6">
            <h2 className="mb-5 text-[1.65rem] font-semibold leading-none text-white">
              What to generate?
            </h2>
            <div className="flex flex-col gap-3">
              {CONTENT_TYPES.map((opt) => {
                const Icon = opt.icon;
                const selected = contentType === opt.id;
                const palette = getSelectionPalette(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setContentType(opt.id);
                      setResult(null);
                      setError("");
                      setSaveStatus("");
                    }}
                    className={[
                      "slms-hover-lift flex w-full items-start gap-4 rounded-[18px] border px-5 py-4 text-left transition-all duration-200",
                      selected
                        ? palette.selected
                        : "border-white/8 bg-[rgba(10,22,38,0.72)] hover:border-cyan-400/20 hover:bg-[rgba(16,31,53,0.82)]",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "mt-0.5 h-6 w-6 shrink-0",
                        selected ? palette.icon : "text-slate-400",
                      ].join(" ")}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[1.05rem] font-semibold text-white">
                          {opt.label}
                        </span>
                        {selected && (
                          <Check
                            className={["h-5 w-5 shrink-0", palette.check].join(" ")}
                          />
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 slms-muted">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="slms-card slms-hover-lift slms-fade-up slms-stagger-2 rounded-[26px] px-6 py-6">
            <h2 className="mb-5 text-[1.45rem] font-semibold leading-none text-white">
              Topic &amp; Details
            </h2>
            <div className="flex flex-col gap-5">
              <p className="text-xs leading-6 slms-muted">
                {isFileMode
                  ? "PDF or PowerPoint file selected. Topic, Subject, and Semester are now optional."
                  : "Without a file upload, Topic, Subject, and Semester are required."}
              </p>
              <label className="block">
                <span className="mb-2 block text-sm font-medium slms-muted">
                  Topic {!isFileMode && <span className="text-rose-400">*</span>}
                </span>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setError("");
                    setTopic(sanitizeLettersOnlyInput(e.target.value));
                  }}
                  placeholder="e.g. Binary Search Trees, TCP/IP, SQL Joins..."
                  inputMode="text"
                  className="slms-input w-full rounded-[16px] px-4 py-3.5 text-[1rem] text-white placeholder:text-slate-500 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium slms-muted">
                    Subject {!isFileMode && <span className="text-rose-400">*</span>}
                  </span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setError("");
                      setSubject(sanitizeLettersOnlyInput(e.target.value));
                    }}
                    placeholder="e.g. Data Structures"
                    inputMode="text"
                    className="slms-input w-full rounded-[16px] px-4 py-3.5 text-[1rem] text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <div className="mb-2">
                    <span className="block text-sm font-medium slms-muted">
                      Semester {!isFileMode && <span className="text-rose-400">*</span>}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className={[
                        "slms-input w-full appearance-none rounded-[16px] px-4 py-3.5 pr-11 text-[1rem] focus:outline-none",
                        semester ? "text-white" : "text-slate-500",
                      ].join(" ")}
                    >
                      <option value="" disabled>
                        Select Semester
                      </option>
                      {SEMESTER_OPTIONS.map((s) => (
                        <option
                          key={s.value}
                          value={s.value}
                          disabled={!canAccessSemesterOption(storedUserSemester, s.value)}
                        >
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  </div>
                </label>
              </div>
              <p className="text-xs leading-6 slms-muted">
                You can only select up to your registered academic year and semester.
              </p>

              <label className="block">
                <span className="mb-2 block text-sm font-medium slms-muted">
                  Lesson File
                </span>
                <div className="rounded-[18px] border border-dashed border-cyan-400/20 bg-[rgba(8,19,34,0.68)] px-4 py-4">
                  <div className="flex flex-col gap-3">
                    <label className="slms-hover-lift flex cursor-pointer items-center justify-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-400/35 hover:bg-white/[0.07]">
                      <FileUp className="h-4 w-4 text-cyan-300" />
                      <span>Upload PDF or PPTX</span>
                      <input
                        type="file"
                        accept=".pdf,.pptx"
                        onChange={handleLessonFileChange}
                        className="hidden"
                      />
                    </label>

                    {lessonFile ? (
                      <div className="flex items-center justify-between gap-3 rounded-[16px] border border-emerald-400/20 bg-emerald-400/10 px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-emerald-100">
                            {lessonFile.name}
                          </p>
                          <p className="mt-1 text-xs text-emerald-100/75">
                            AI will use this file as the lesson source
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLessonFile(null)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-[#10253d] text-slate-300 transition hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs leading-6 slms-muted">
                        Optional. Upload a lecture PDF or PPTX to generate AI notes,
                        MCQs, or flashcards from that lesson.
                      </p>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={isGenerateDisabled}
            className="slms-primary-btn slms-fade-up slms-stagger-3 flex h-[60px] w-full items-center justify-center gap-2 rounded-[16px] px-4 text-[1.05rem] font-semibold text-white transition disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Bot className="h-5 w-5" />
            )}
            {getGenerateLabel(contentType)}
          </button>

          {error && (
            <p className="rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}
        </form>

        <section className="slms-card slms-fade-up slms-stagger-2 flex min-h-[640px] flex-col rounded-[28px]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-6">
            <div className="flex flex-wrap items-center gap-2">
              {result && (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/18 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    <Check className="h-3.5 w-3.5" /> Generated
                  </span>
                  {result.kind === "mcq" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/18 px-3 py-1.5 text-xs font-semibold text-orange-200">
                      <Pencil className="h-3.5 w-3.5" />
                      {result.data?.questions?.length || 0} Questions
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/18 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                      <Sparkles className="h-3.5 w-3.5" /> AI Powered
                    </span>
                  )}
                </>
              )}
            </div>
            <span className="text-xs slms-muted">
              {displaySubject && displaySemester
                ? `${displaySubject} - ${displaySemester}`
                : "-"}
            </span>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden px-6 pb-6">
            {!result && !loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="slms-fade-up flex h-24 w-24 items-center justify-center rounded-[28px] bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.75),rgba(59,130,246,0.24)_55%,rgba(251,146,60,0.22)_76%,transparent_82%)] text-cyan-100 shadow-[0_18px_40px_rgba(14,165,233,0.18)]">
                  <Sparkles className="h-9 w-9" />
                </div>
                <p className="text-[2.25rem] font-semibold tracking-[-0.04em] text-white">
                  AI Results Will Appear Here
                </p>
                <p className="max-w-sm text-[1.05rem] slms-muted">
                  Enter a topic and click Generate to get started
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs slms-muted">
                  <span className="slms-chip rounded-full px-4 py-1.5">
                    <FileText className="mr-1 inline h-3.5 w-3.5" />
                    Notes
                  </span>
                  <span className="slms-chip rounded-full px-4 py-1.5">
                    <Pencil className="mr-1 inline h-3.5 w-3.5" />
                    MCQ
                  </span>
                  <span className="slms-chip rounded-full px-4 py-1.5">
                    <Layers className="mr-1 inline h-3.5 w-3.5" />
                    Flashcards
                  </span>
                </div>
              </div>
            )}

            {loading && !result && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
                <p className="text-sm slms-muted">Generating...</p>
              </div>
            )}

            {result?.kind === "notes" && result.data?.markdown && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-[2rem] font-semibold tracking-[-0.04em] text-white">
                    <FileText className="h-6 w-6 text-cyan-200" />
                    AI Smart Notes: {displayTopic}
                  </h3>
                  {result?.source?.fileName && (
                    <span className="slms-chip rounded-full px-3 py-1.5 text-xs text-slate-300">
                      Source: {result.source.fileName}
                    </span>
                  )}
                </div>
                <div className="max-h-[min(62vh,560px)] overflow-y-auto rounded-[20px] border border-white/8 bg-[rgba(9,20,34,0.76)] px-5 py-5">
                  <div className="space-y-5">
                    <div className="rounded-[18px] border border-cyan-400/18 bg-cyan-400/8 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                        Topic
                      </p>
                      <p className="mt-2 text-[1.35rem] font-bold text-white">
                        {displayTopic}
                      </p>
                      {(parsedNotes.intro[0] || subject) && (
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                          {parsedNotes.intro[0] ||
                            `${displaySubject} - ${displaySemester}`}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      {parsedNotes.sections.length > 0 ? (
                        parsedNotes.sections.map((section, index) => (
                          <article
                            key={`${section.title}-${index}`}
                            className="slms-card-soft rounded-[18px] px-4 py-4"
                          >
                            <h4 className="text-[1.08rem] font-bold text-white">
                              {section.title}
                            </h4>
                            <div className="mt-3 space-y-3">
                              {section.items.map((item, itemIndex) => (
                                <div
                                  key={`${item.title}-${itemIndex}`}
                                  className="rounded-[14px] bg-[#0c1c2f] px-3 py-3"
                                >
                                  {item.title ? (
                                    <p className="text-sm leading-7 text-slate-200">
                                      <span className="font-semibold text-white">
                                        {item.title}
                                      </span>
                                      {": "}
                                      <span>{item.text}</span>
                                    </p>
                                  ) : (
                                    <p className="text-sm leading-7 text-slate-200">
                                      {item.text}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="slms-card-soft rounded-[18px] px-4 py-4">
                          <p className="whitespace-pre-wrap text-sm leading-8 text-slate-200">
                            {cleanInlineMarkdown(result.data.markdown)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result?.kind === "mcq" && result.data?.questions && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">
                    Generated MCQ: {displayTopic}
                  </h3>
                  {result?.source?.fileName && (
                    <span className="slms-chip rounded-full px-3 py-1.5 text-xs text-slate-300">
                      Source: {result.source.fileName}
                    </span>
                  )}
                </div>
                <div className="max-h-[min(62vh,640px)] space-y-4 overflow-y-auto pr-1">
                  {result.data.questions.map((q, qi) => (
                    <article
                      key={qi}
                      className="slms-card-soft rounded-[20px] px-5 py-5"
                    >
                      <p className="text-[1.1rem] font-semibold text-white">
                        Q{qi + 1}. {q.question}
                      </p>
                      <ul className="mt-3 space-y-3">
                        {(q.options || []).map((opt, oi) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <li
                              key={oi}
                              className={[
                                "flex items-center justify-between rounded-[12px] border px-3 py-3 text-sm",
                                isCorrect
                                  ? "border-emerald-500/30 bg-emerald-500/14 text-emerald-100"
                                  : "border-transparent bg-[#0d1d31] text-slate-300",
                              ].join(" ")}
                            >
                              <span className="flex items-center gap-3">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#16304e] text-xs font-semibold text-cyan-100">
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <span>{opt}</span>
                              </span>
                              {isCorrect && (
                                <Check className="h-4 w-4 text-emerald-400" />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {q.explanation && (
                        <div className="mt-4 flex gap-2 rounded-[12px] border border-cyan-400/20 bg-cyan-400/8 p-3 text-sm text-slate-300">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                          <span className="leading-6">{q.explanation}</span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {result?.kind === "flashcards" && result.data?.cards && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-[2rem] font-semibold tracking-[-0.04em] text-white">
                    <Layers className="h-5 w-5 text-cyan-300" />
                    AI Flashcards: {displayTopic}
                  </h3>
                  {result?.source?.fileName && (
                    <span className="slms-chip rounded-full px-3 py-1.5 text-xs text-slate-300">
                      Source: {result.source.fileName}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveToDecks}
                    disabled={loading}
                    className="slms-primary-btn inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save to My Decks
                  </button>
                </div>

                {saveStatus && (
                  <p className="mb-3 text-sm text-emerald-400">{saveStatus}</p>
                )}

                <div className="max-h-[min(62vh,640px)] space-y-3 overflow-y-auto pr-1">
                  {result.data.cards.map((c, i) => (
                    <div
                      key={i}
                      className="slms-card-soft rounded-[20px] p-5"
                    >
                      <p className="text-base font-semibold text-cyan-100">
                        Q{i + 1}. {c.question}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {c.answer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[16px] border border-white/8 bg-[#0c1b2d] px-4 py-3 text-xs slms-muted">
                  Saved decks are private and visible only to the student account that created
                  them.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
