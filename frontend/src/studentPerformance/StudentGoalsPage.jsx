import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/MAuthContext";
import {
  appendNotification,
  getNotificationsUserKey,
} from "./notificationsStorage.js";
import { getCalendarUserKey } from "./calendarStorage.js";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getAuthToken } from "../lib/session.js";
import {
  countCompletedGoals,
  ensureDemoGoalsIfEmpty,
  getGoalsUserKey,
  isGoalDeadlinePassed,
  loadGoalsBundle,
  MILESTONE_COMPLETION_THRESHOLDS,
  newMilestoneBadgesForCompletionCount,
  progressPercent,
  saveGoalsBundle,
} from "./goalsStorage.js";

/** Stored on each goal */
const GOAL_TYPES = [
  {
    value: "gpa",
    label: "GPA target",
    short: "GPA",
    description: "Set a GPA you want to reach by the deadline.",
  },
  {
    value: "subject_marks",
    label: "Subject marks target",
    short: "Subject marks",
    description: "Target mark (%) for one subject by the deadline.",
  },
  {
    value: "assignments",
    label: "Assignments complete target",
    short: "Assignments",
    description: "How many assignments to finish by the deadline.",
  },
  {
    value: "study_hours",
    label: "Study hours target",
    short: "Study hours",
    description: "Total study hours to log before the deadline.",
  },
];

const TYPE_META = Object.fromEntries(GOAL_TYPES.map((t) => [t.value, t]));

const TYPE_SHORT = {
  gpa: "GPA",
  subject_marks: "Subject marks",
  assignments: "Assignments",
  study_hours: "Study hours",
  subject: "Subject marks",
  weekly: "Study hours",
};

const SEMESTER_OPTIONS = [
  { value: "Semester 1", label: "Semester 1" },
  { value: "Semester 2", label: "Semester 2" },
];

const YEAR_OPTIONS = [
  { value: "1", label: "Year 1" },
  { value: "2", label: "Year 2" },
  { value: "3", label: "Year 3" },
  { value: "4", label: "Year 4" },
];

const DEMO_SUBJECTS = [
  { subject: "Data Structures & Algorithms", avgPercentage: 84.1 },
  { subject: "Database Management Systems", avgPercentage: 81.7 },
  { subject: "Object Oriented Programming", avgPercentage: 78.4 },
  { subject: "Computer Networks", avgPercentage: 75.2 },
  { subject: "Mathematics for Computing", avgPercentage: 72.9 },
];

const BADGE_STYLE = {
  gold: {
    title: "Gold",
    card: "from-amber-300 via-yellow-400 to-amber-600 text-amber-950 shadow-amber-900/40",
  },
  silver: {
    title: "Silver",
    card: "from-slate-200 via-slate-300 to-slate-500 text-slate-900 shadow-slate-900/30",
  },
  bronze: {
    title: "Bronze",
    card: "from-amber-700 via-orange-800 to-amber-900 text-amber-50 shadow-black/40",
  },
};

/** Stack order: bronze back (bottom), gold front (top) */
const STACK_TIER_ORDER = { bronze: 0, silver: 1, gold: 2 };

const MANUAL_GPA_STORAGE = "slms_performance_manual_gpa_v1";

function loadManualGpa(userKey) {
  try {
    const raw = localStorage.getItem(`${MANUAL_GPA_STORAGE}_${userKey}`);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 10) return null;
    return Math.round(n * 100) / 100;
  } catch {
    return null;
  }
}

function makeGoalId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `g_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatBadgeDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function formatDeadline(isoOrDate) {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function deadlineToIso(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function goalType(goal) {
  const t = goal.type;
  if (t === "subject") return "subject_marks";
  if (t === "weekly") return "study_hours";
  return t || "gpa";
}

function resetFormFields() {
  return {
    formTitle: "",
    formDeadline: "",
    formTarget: "",
    formSubjectName: "",
    formSemester: "",
    formYear: "",
  };
}

export default function StudentGoalsPage() {
  const { user } = useAuth();
  const userKey = useMemo(
    () => getGoalsUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );
  const notifKey = useMemo(
    () => getNotificationsUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );
  const perfUserKey = useMemo(
    () => getCalendarUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );

  const [goals, setGoals] = useState([]);
  const [badges, setBadges] = useState([]);
  const [deadlineNotifiedIds, setDeadlineNotifiedIds] = useState([]);
  /** null = show type buttons; otherwise which form to show */
  const [activeGoalType, setActiveGoalType] = useState(null);
  const [performanceGpa, setPerformanceGpa] = useState(null);
  const [perfSubjects, setPerfSubjects] = useState([]);
  const [perfSubjectMarks, setPerfSubjectMarks] = useState({});
  const [perfLoading, setPerfLoading] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formSubjectName, setFormSubjectName] = useState("");
  const [formSemester, setFormSemester] = useState("");
  const [formYear, setFormYear] = useState("");
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  const [semesterTouched, setSemesterTouched] = useState(false);
  const [yearTouched, setYearTouched] = useState(false);

  const [draftCurrent, setDraftCurrent] = useState({});

  const persistAll = useCallback(
    (nextGoals, nextBadges, nextDeadlineIds) => {
      setGoals(nextGoals);
      setBadges(nextBadges);
      setDeadlineNotifiedIds(nextDeadlineIds);
      saveGoalsBundle(userKey, {
        goals: nextGoals,
        badges: nextBadges,
        deadlineNotifiedIds: nextDeadlineIds,
      });
    },
    [userKey],
  );

  useEffect(() => {
    ensureDemoGoalsIfEmpty(userKey);
    let bundle = loadGoalsBundle(userKey);
    const completed = countCompletedGoals(bundle.goals);
    const newMs = newMilestoneBadgesForCompletionCount(
      bundle.badges,
      completed,
    );
    if (newMs.length) {
      bundle = {
        ...bundle,
        badges: [...newMs, ...bundle.badges],
      };
      saveGoalsBundle(userKey, bundle);
      for (const b of newMs) {
        const thresh = MILESTONE_COMPLETION_THRESHOLDS.find(
          (t) => t.tier === b.tier,
        );
        appendNotification(notifKey, {
          id: `notif_ms_${b.id}`,
          title: "Badge unlocked!",
          body: `${String(b.tier).toUpperCase()} — ${thresh?.label ?? "Milestone reached"}.`,
          category: "achievement",
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
    setGoals(bundle.goals);
    setBadges(bundle.badges);
    setDeadlineNotifiedIds(bundle.deadlineNotifiedIds || []);
    const drafts = {};
    for (const goal of bundle.goals) {
      drafts[goal.id] = String(goal.currentValue ?? 0);
    }
    setDraftCurrent(drafts);
  }, [userKey, notifKey]);

  useEffect(() => {
    setPerformanceGpa(loadManualGpa(perfUserKey));
  }, [perfUserKey]);

  useEffect(() => {
    const token = getAuthToken();
    if (activeGoalType !== "subject_marks") return;
    let cancelled = false;
    (async () => {
      setPerfLoading(true);
      try {
        let sp = [];
        if (token) {
          const res = await fetch(apiUrl("/api/assessment/performance/dashboard"), {
            headers: getAuthHeaders(),
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok) {
            sp = Array.isArray(json.subjectPerformance)
              ? json.subjectPerformance
              : [];
          }
        }
        if (!sp.length) {
          sp = DEMO_SUBJECTS.map((x) => ({
            subject: x.subject,
            avgPercentage: x.avgPercentage,
            attemptCount: 0,
          }));
        }
        const opts = sp
          .map((r) => String(r.subject || "").trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        const map = {};
        for (const r of sp) {
          const k = String(r.subject || "").trim();
          if (!k) continue;
          const v = Number(r.avgPercentage);
          if (!Number.isFinite(v)) continue;
          map[k] = Math.round(v * 10) / 10;
        }
        if (!cancelled) {
          setPerfSubjects(opts);
          setPerfSubjectMarks(map);
          if (!formSubjectName && opts.length) {
            setFormSubjectName(opts[0]);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setPerfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeGoalType, formSubjectName]);

  useEffect(() => {
    const tick = () => {
      const bundle = loadGoalsBundle(userKey);
      const ids = new Set(bundle.deadlineNotifiedIds || []);
      let added = false;
      for (const g of bundle.goals) {
        if (
          !g.deadline ||
          !isGoalDeadlinePassed(g.deadline) ||
          ids.has(g.id)
        ) {
          continue;
        }
        ids.add(g.id);
        added = true;
        appendNotification(notifKey, {
          id: `goal_deadline_${g.id}`,
          title: "Goal deadline passed",
          body: `"${g.title}" — deadline was ${new Date(g.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}.`,
          category: "reminder",
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      if (added) {
        const nextIds = [...ids];
        saveGoalsBundle(userKey, {
          ...bundle,
          deadlineNotifiedIds: nextIds,
        });
        setDeadlineNotifiedIds(nextIds);
      }
    };
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => window.clearInterval(t);
  }, [userKey, notifKey]);

  const clearForm = () => {
    const r = resetFormFields();
    setFormTitle(r.formTitle);
    setFormDeadline(r.formDeadline);
    setFormTarget(r.formTarget);
    setFormSubjectName(r.formSubjectName);
    setFormSemester(r.formSemester);
    setFormYear(r.formYear);
    setDeadlineTouched(false);
    setSemesterTouched(false);
    setYearTouched(false);
    setSubjectQuery("");
  };

  const selectType = (value) => {
    setActiveGoalType(value);
    clearForm();
  };

  const createGoal = (e) => {
    e.preventDefault();
    if (!activeGoalType) return;

    const title = formTitle.trim();
    const deadlineIso = deadlineToIso(formDeadline);
    if (!deadlineIso) {
      setDeadlineTouched(true);
      return;
    }
    if (!title) return;

    const target = Number(formTarget);
    const subj = formSubjectName.trim();
    const sem = String(formSemester || "").trim();
    const yr = String(formYear || "").trim();

    if (!sem) setSemesterTouched(true);
    if (!yr) setYearTouched(true);
    if (!sem || !yr) return;

    if (activeGoalType === "gpa") {
      if (!Number.isFinite(target) || target <= 0 || target > 10) return;
    } else if (activeGoalType === "study_hours") {
      if (!Number.isFinite(target) || target <= 0) return;
    } else if (activeGoalType === "subject_marks") {
      if (!subj || !Number.isFinite(target) || target <= 0 || target > 100)
        return;
    } else if (activeGoalType === "assignments") {
      if (!Number.isFinite(target) || target <= 0) return;
      if (!Number.isInteger(target)) return;
    } else return;

    const initialCurrent =
      activeGoalType === "gpa" && performanceGpa != null
        ? performanceGpa
        : activeGoalType === "subject_marks" && perfSubjectMarks[subj] != null
          ? perfSubjectMarks[subj]
          : 0;

    const goal = {
      id: makeGoalId(),
      title,
      type: activeGoalType,
      targetValue: target,
      currentValue: initialCurrent,
      deadline: deadlineIso,
      subjectName: activeGoalType === "subject_marks" ? subj : "",
      semester: sem,
      academicYear: yr,
      createdAt: new Date().toISOString(),
      completionNotified: false,
    };

    const next = [goal, ...goals];
    persistAll(next, badges, deadlineNotifiedIds);
    setDraftCurrent((d) => ({ ...d, [goal.id]: String(initialCurrent) }));
    clearForm();
    setActiveGoalType(null);
  };

  const deleteGoal = (id) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this goal?")) {
      return;
    }
    const nextGoals = goals.filter((g) => g.id !== id);
    persistAll(
      nextGoals,
      badges,
      deadlineNotifiedIds.filter((x) => x !== id),
    );
    setDraftCurrent((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
  };

  const saveProgress = (goal) => {
    const raw = draftCurrent[goal.id];
    let v = Number(raw);
    if (!Number.isFinite(v) || v < 0) return;
    if (goalType(goal) === "assignments") {
      v = Math.floor(v);
    }

    const prevPct = progressPercent(goal.currentValue, goal.targetValue);
    let updated = { ...goal, currentValue: v };
    const newPct = progressPercent(v, goal.targetValue);

    if (prevPct < 100 && newPct >= 100 && !goal.completionNotified) {
      updated = { ...updated, completionNotified: true };
      appendNotification(notifKey, {
        id: `goal_done_${goal.id}`,
        title: "Goal completed!",
        body: `You reached your target for "${goal.title}".`,
        category: "achievement",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    const nextGoals = goals.map((g) => (g.id === goal.id ? updated : g));
    const completed = countCompletedGoals(nextGoals);
    const newMs = newMilestoneBadgesForCompletionCount(badges, completed);
    const nextBadges = [...newMs, ...badges];

    persistAll(nextGoals, nextBadges, deadlineNotifiedIds);
    for (const b of newMs) {
      const thresh = MILESTONE_COMPLETION_THRESHOLDS.find(
        (t) => t.tier === b.tier,
      );
      appendNotification(notifKey, {
        id: `notif_ms_${b.id}`,
        title: "Badge unlocked!",
        body: `${String(b.tier).toUpperCase()} — ${thresh?.label ?? "Milestone reached"}.`,
        category: "achievement",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const badgesStackOrder = useMemo(
    () =>
      [...badges].sort((a, b) => {
        const oa = STACK_TIER_ORDER[a.tier] ?? 9;
        const ob = STACK_TIER_ORDER[b.tier] ?? 9;
        if (oa !== ob) return oa - ob;
        return new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime();
      }),
    [badges],
  );

  const completedGoalsCount = useMemo(
    () => countCompletedGoals(goals),
    [goals],
  );

  const milestoneFill = useMemo(() => {
    const c = completedGoalsCount;
    if (c < 10) {
      return {
        label: `${10 - c} more completed goal${10 - c === 1 ? "" : "s"} until Bronze fills the stack`,
        pct: Math.min(100, (c / 10) * 100),
      };
    }
    if (c < 35) {
      return {
        label: `${35 - c} more until Silver (${35} total) — stack grows again`,
        pct: Math.min(100, ((c - 10) / 25) * 100),
      };
    }
    if (c < 85) {
      return {
        label: `${85 - c} more until Gold (${85} total)`,
        pct: Math.min(100, ((c - 35) / 50) * 100),
      };
    }
    return {
      label: "Stack complete — all milestone tiers unlocked",
      pct: 100,
    };
  }, [completedGoalsCount]);

  const activeMeta = activeGoalType ? TYPE_META[activeGoalType] : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Goals & achievements
          </h1>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            Student hub
          </span>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Choose a goal type, set a deadline, then track progress. Every goal
          needs a deadline.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 sm:p-6">
          {!activeGoalType ? (
            <>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                New goal — pick a type
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                Click a button to open the form for that goal type.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {GOAL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => selectType(t.value)}
                    className="flex flex-col rounded-xl border border-white/10 bg-[#0a0f1a] p-4 text-left transition hover:border-teal-500/35 hover:bg-teal-500/5"
                  >
                    <span className="text-sm font-semibold text-white">
                      {t.label}
                    </span>
                    <span className="mt-2 text-xs leading-relaxed text-slate-500">
                      {t.description}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveGoalType(null);
                  clearForm();
                }}
                className="text-xs font-medium text-teal-400 transition hover:text-teal-300"
              >
                ← Choose another goal type
              </button>
              <h2 className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                New {activeMeta?.label}
              </h2>
              <form onSubmit={createGoal} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400">
                    Title <span className="text-rose-400/90">*</span>
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Short name for this goal"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">
                    Deadline <span className="text-rose-400/90">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    className={[
                      "mt-1 w-full rounded-xl border bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40",
                      deadlineTouched && !formDeadline
                        ? "border-rose-500/50"
                        : "border-white/10",
                    ].join(" ")}
                    value={formDeadline}
                    onChange={(e) => {
                      setFormDeadline(e.target.value);
                      setDeadlineTouched(true);
                    }}
                    required
                  />
                  {deadlineTouched && !formDeadline ? (
                    <p className="mt-1 text-xs text-rose-300/90">
                      Deadline is required for every goal.
                    </p>
                  ) : null}
                </div>

                {activeGoalType === "gpa" && (
                  <div>
                    <label className="text-xs font-medium text-slate-400">
                      Target GPA <span className="text-rose-400/90">*</span>
                    </label>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Current GPA (from Performance):{" "}
                      <span className="font-semibold text-slate-200">
                        {performanceGpa != null ? performanceGpa.toFixed(2) : "—"}
                      </span>
                    </p>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.01"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      placeholder="e.g. 3.5"
                      required
                    />
                  </div>
                )}

                {activeGoalType === "study_hours" && (
                  <div>
                    <label className="text-xs font-medium text-slate-400">
                      Target study hours <span className="text-rose-400/90">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      placeholder="e.g. 120"
                      required
                    />
                  </div>
                )}

                {activeGoalType === "subject_marks" && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-400">
                        Subject <span className="text-rose-400/90">*</span>
                      </label>
                      {perfSubjects.length > 0 ? (
                        <>
                          <input
                            className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/40"
                            value={subjectQuery}
                            onChange={(e) => setSubjectQuery(e.target.value)}
                            placeholder="Search subject…"
                          />
                          <div className="mt-1 rounded-xl border border-white/10 bg-[#0a0f1a] p-2">
                            <div className="flex items-center justify-between px-2 pb-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                {perfLoading ? "Loading subjects…" : "Scroll & select"}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {perfSubjects.length} subjects
                              </p>
                            </div>
                            <div className="max-h-44 overflow-auto pr-1">
                              {perfSubjects
                                .filter((s) =>
                                  s.toLowerCase().includes(subjectQuery.trim().toLowerCase()),
                                )
                                .map((s) => {
                                const active = s === formSubjectName;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormSubjectName(s)}
                                    className={[
                                      "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                                      active
                                        ? "bg-teal-500/15 text-teal-100 ring-1 ring-teal-500/25"
                                        : "text-slate-200 hover:bg-white/[0.06]",
                                    ].join(" ")}
                                  >
                                    <span className="block truncate">{s}</span>
                                    <span className="mt-0.5 block text-[11px] text-slate-500">
                                      Current mark:{" "}
                                      {perfSubjectMarks[s] != null
                                        ? `${Number(perfSubjectMarks[s]).toFixed(1)}%`
                                        : "—"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Current mark:{" "}
                            <span className="font-semibold text-slate-200">
                              {formSubjectName && perfSubjectMarks[formSubjectName] != null
                                ? `${perfSubjectMarks[formSubjectName].toFixed(1)}%`
                                : "—"}
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <input
                            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                            value={formSubjectName}
                            onChange={(e) => setFormSubjectName(e.target.value)}
                            placeholder={perfLoading ? "Loading subjects…" : "e.g. Data Structures"}
                            required
                          />
                          <p className="mt-1 text-[11px] text-slate-500">
                            Current mark:{" "}
                            <span className="font-semibold text-slate-200">—</span>
                            <span className="ml-1 text-slate-500">
                              (no subjects found yet)
                            </span>
                          </p>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400">
                        Target mark (%) <span className="text-rose-400/90">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="0.1"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                        value={formTarget}
                        onChange={(e) => setFormTarget(e.target.value)}
                        placeholder="e.g. 85"
                        required
                      />
                    </div>
                  </>
                )}

                {activeGoalType === "assignments" && (
                  <div>
                    <label className="text-xs font-medium text-slate-400">
                      Assignments to complete <span className="text-rose-400/90">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      placeholder="e.g. 12"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400">
                      Semester
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                      value={formSemester}
                      onChange={(e) => {
                        setFormSemester(e.target.value);
                        setSemesterTouched(true);
                      }}
                      required
                    >
                      <option value="" disabled>
                        Select semester
                      </option>
                      {SEMESTER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {semesterTouched && !formSemester ? (
                      <p className="mt-1 text-xs text-rose-300/90">
                        Semester is required.
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">
                      Academic year
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                      value={formYear}
                      onChange={(e) => {
                        setFormYear(e.target.value);
                        setYearTouched(true);
                      }}
                      required
                    >
                      <option value="" disabled>
                        Select year
                      </option>
                      {YEAR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {yearTouched && !formYear ? (
                      <p className="mt-1 text-xs text-rose-300/90">
                        Academic year is required.
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/25 transition hover:bg-teal-500"
                >
                  Create goal
                </button>
              </form>
            </>
          )}
        </section>

        <div className="space-y-8">
          <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
              Active goals
            </h2>
            <ul className="mt-5 space-y-4">
              {goals.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-500">
                  No goals yet. Pick a type above to create one.
                </li>
              )}
              {goals.map((goal) => {
                const pct = progressPercent(
                  goal.currentValue,
                  goal.targetValue,
                );
                const gt = goalType(goal);
                const typeLabel = TYPE_SHORT[gt] || "Goal";
                const currentLabel =
                  gt === "gpa"
                    ? "Current GPA"
                    : gt === "study_hours"
                      ? "Hours logged so far"
                      : gt === "subject_marks"
                        ? "Current mark (%)"
                        : "Assignments done";
                return (
                  <li
                    key={goal.id}
                    className="relative rounded-2xl border border-white/[0.06] bg-[#0a0f1a] p-4"
                  >
                    <button
                      type="button"
                      onClick={() => deleteGoal(goal.id)}
                      className="absolute right-3 top-3 text-xs font-semibold text-rose-400 transition hover:text-rose-300"
                    >
                      Delete
                    </button>
                    <p className="pr-16 text-[10px] font-bold uppercase tracking-wider text-teal-400/90">
                      {typeLabel}
                    </p>
                    <h3 className="pr-16 text-lg font-semibold text-white">
                      {goal.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Target:{" "}
                      <span className="font-medium text-slate-200">
                        {gt === "subject_marks" ? (
                          <>
                            {goal.targetValue}%
                            {goal.subjectName ? ` — ${goal.subjectName}` : ""}
                          </>
                        ) : (
                          <>
                            {goal.targetValue}
                            {gt === "gpa"
                              ? " GPA"
                              : gt === "study_hours"
                                ? " hrs"
                                : gt === "assignments"
                                  ? " assignments"
                                  : ""}
                          </>
                        )}
                      </span>
                      {" · "}
                      Deadline:{" "}
                      <span className="font-medium text-slate-200">
                        {formatDeadline(goal.deadline)}
                      </span>
                    </p>
                    {(goal.semester || goal.academicYear) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {[goal.semester, goal.academicYear]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span className="font-semibold text-teal-300">{pct}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <label className="text-xs font-medium text-slate-400">
                          {currentLabel}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={gt === "assignments" ? "1" : "any"}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/40"
                          value={draftCurrent[goal.id] ?? ""}
                          onChange={(e) =>
                            setDraftCurrent((d) => ({
                              ...d,
                              [goal.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => saveProgress(goal)}
                        className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-500/20"
                      >
                        Save progress
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 sm:p-6">
            <style>
              {`
                @keyframes goals-stack-layer-in {
                  from {
                    opacity: 0;
                    transform: translateY(1.5rem) scale(0.88);
                    filter: blur(6px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    filter: blur(0);
                  }
                }
                .goals-stack-layer {
                  opacity: 0;
                  animation: goals-stack-layer-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
              `}
            </style>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
              Achievement badges
            </h2>
            <p className="mt-1 text-xs font-medium text-teal-400/90">
              Stack fills one layer at a time as you complete goals (Bronze → Silver → Gold).
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Bronze: 10 goals fully completed. Silver: 35 total (25 more after
              Bronze). Gold: 85 total (50 more after Silver). A goal counts when
              progress reaches 100%.
            </p>

            <div className="mt-6 rounded-xl border border-teal-500/20 bg-[#0a0f1a] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Progress to next stack layer
                </span>
                <span className="text-sm font-bold tabular-nums text-teal-300">
                  {completedGoalsCount}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    goals completed
                  </span>
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {milestoneFill.label}
              </p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-400 transition-[width] duration-700 ease-out"
                  style={{ width: `${milestoneFill.pct}%` }}
                />
              </div>
            </div>

            <div className="mt-8">
              {badgesStackOrder.length === 0 ? (
                <div className="mx-auto w-full max-w-[300px]">
                  <p className="mb-4 text-center text-xs text-slate-500">
                    Preview — each real badge will land on the stack with a short
                    animation when you earn it
                  </p>
                  <div
                    className="relative mx-auto"
                    style={{ height: "200px" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="absolute left-1/2"
                        style={{
                          bottom: `${i * 28}px`,
                          zIndex: i + 1,
                          transform: `translateX(-50%) translateX(${i * 5}px) rotate(${(i - 1) * 7}deg)`,
                        }}
                      >
                        <div
                          className="goals-stack-layer flex h-[118px] w-[92%] max-w-[280px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0a0f1a]/80 text-[11px] text-slate-600"
                          style={{
                            animationDelay: `${200 + i * 220}ms`,
                          }}
                        >
                          {i === 2 ? "Gold" : i === 1 ? "Silver" : "Bronze"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-sm text-slate-500">
                    No milestone badges yet — complete 10, 35, then 85 goals.
                  </p>
                </div>
              ) : (
                <div
                  className="relative mx-auto w-full max-w-[320px]"
                  style={{
                    height: `${88 + (badgesStackOrder.length - 1) * 32 + 132}px`,
                  }}
                >
                  {badgesStackOrder.map((b, i) => {
                    const tierStyle = BADGE_STYLE[b.tier] || BADGE_STYLE.bronze;
                    const thresh = MILESTONE_COMPLETION_THRESHOLDS.find(
                      (t) => t.tier === b.tier,
                    );
                    const n = badgesStackOrder.length;
                    const fan = n > 1 ? (i - (n - 1) / 2) * 8 : i === 0 ? -4 : 4;
                    const nudgeX = i * 6;
                    return (
                      <div
                        key={b.id}
                        className="absolute left-1/2"
                        style={{
                          bottom: `${i * 32}px`,
                          zIndex: 10 + i,
                          transform: `translateX(calc(-50% + ${nudgeX}px)) rotate(${fan}deg)`,
                        }}
                      >
                        <div
                          className={[
                            "goals-stack-layer flex min-h-[120px] w-[90%] max-w-[280px] flex-col justify-between rounded-2xl border-2 border-black/30 bg-gradient-to-br p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55)] ring-2 ring-white/15 transition-[transform,box-shadow] duration-200 hover:z-[40] hover:scale-[1.04] hover:shadow-[0_22px_60px_rgba(0,0,0,0.6)]",
                            tierStyle.card,
                          ].join(" ")}
                          style={{
                            animationDelay: `${i * 200}ms`,
                          }}
                        >
                          <p className="text-lg font-black tracking-tight md:text-xl">
                            {tierStyle.title}
                          </p>
                          <div className="mt-3">
                            <p className="text-xs font-semibold opacity-90">
                              {thresh?.label ?? "Milestone"}
                            </p>
                            <p className="mt-1 text-[11px] leading-snug opacity-85">
                              Unlocked at {b.completionsAtUnlock ?? "—"} completed
                              · {formatBadgeDate(b.earnedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
