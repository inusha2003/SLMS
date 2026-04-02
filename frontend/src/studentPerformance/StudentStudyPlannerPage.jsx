import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, CalendarClock, ListChecks, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getAuthToken } from "../lib/session.js";
import { getCalendarUserKey, loadCalendarEvents } from "./calendarStorage.js";
import { getGoalsUserKey, loadGoalsBundle } from "./goalsStorage.js";
import {
  appendNotification,
  getNotificationsUserKey,
} from "./notificationsStorage.js";
import {
  buildPlannerTasks,
  generateStudyPlan,
} from "./studyPlannerUtils.js";

const HOURS_KEY = "slms_study_planner_hours_v1";

function storageKey(userKey) {
  return `${HOURS_KEY}_${userKey}`;
}

function loadHours(userKey) {
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 3;
  } catch {
    return 3;
  }
}

function saveHours(userKey, n) {
  localStorage.setItem(storageKey(userKey), String(n));
}

export default function StudentStudyPlannerPage() {
  const { user } = useAuth();
  const calKey = useMemo(
    () => getCalendarUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );
  const goalsKey = useMemo(
    () => getGoalsUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );
  const notifKey = useMemo(
    () => getNotificationsUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );

  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [perfSubjects, setPerfSubjects] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  const calendarEvents = useMemo(() => loadCalendarEvents(calKey), [calKey]);
  const goalsBundle = useMemo(() => loadGoalsBundle(goalsKey), [goalsKey]);
  const goals = goalsBundle?.goals || [];

  useEffect(() => {
    setHoursPerDay(loadHours(calKey));
  }, [calKey]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setPerfSubjects([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingPerf(true);
      try {
        const res = await fetch(apiUrl("/api/assessment/performance/dashboard"), {
          headers: getAuthHeaders(),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const sp = Array.isArray(json.subjectPerformance)
          ? json.subjectPerformance
          : [];
        if (!cancelled) setPerfSubjects(sp);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingPerf(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const tasks = useMemo(
    () =>
      buildPlannerTasks({
        calendarEvents,
        performanceSubjects: perfSubjects,
        goals,
      }),
    [calendarEvents, perfSubjects, goals],
  );

  const generate = useCallback(() => {
    const next = generateStudyPlan({ tasks, hoursPerDay });
    setPlan(next);
    saveHours(calKey, next.hoursPerDay);

    if (next.focusSubject && next.focusSubject !== "—") {
      appendNotification(notifKey, {
        id: `planner_${Date.now()}`,
        title: "Smart Study Planner",
        body: `Today focus: ${next.focusSubject} · ${next.today
          .map((t) => `${t.suggestedHours}h ${t.title}`)
          .slice(0, 2)
          .join(", ")}`,
        category: "reminder",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }, [tasks, hoursPerDay, calKey, notifKey]);

  const focusReason = useMemo(() => {
    if (!plan?.focusSubject || plan.focusSubject === "—") return "No data yet";
    const top = (plan.highPriority || []).find(
      (t) => t.subject && t.subject.toLowerCase() === plan.focusSubject.toLowerCase(),
    );
    return top?.reason || "Based on your marks, goals, and deadlines.";
  }, [plan]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0c1b30] via-[#0b1526] to-[#070b14] p-7 shadow-2xl shadow-black/40 sm:p-9">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400/80">
          Student hub
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Smart Study Planner
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300/85">
              Generates a practical plan from your deadlines, exams, marks, and goals.
              Adjust your available time and generate a plan for today + this week.
            </p>
          </div>
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/70 via-sky-500/60 to-amber-500/55 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/25 transition hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" />
            Generate plan
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Available hours / day
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="w-28 rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              />
              <p className="text-xs text-slate-400">
                Planner uses 0.5h blocks.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Data sources
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Calendar: {calendarEvents.length} events · Goals: {goals.length} ·
              Performance:{" "}
              {loadingPerf ? "loading…" : `${perfSubjects.length} subjects`}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Recommended focus subject
            </p>
            <p className="mt-3 text-sm font-semibold text-white">
              {plan?.focusSubject || "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">{focusReason}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-[22px] border border-white/10 bg-[#0b1424]/90 p-5 shadow-xl shadow-black/30 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <ListChecks className="h-4 w-4 text-teal-300" />
              Today’s study plan
            </h2>
            <p className="text-xs text-slate-500">
              {plan ? `${plan.hoursPerDay}h max` : "Generate to see plan"}
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {!plan || plan.today.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-4 py-10 text-center text-sm text-slate-500">
                No plan yet. Click “Generate plan”.
              </div>
            ) : (
              plan.today.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0a0f1a] p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.reason || "—"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {t.suggestedHours}h
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[22px] border border-white/10 bg-[#0b1424]/90 p-5 shadow-xl shadow-black/30 sm:p-6">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarClock className="h-4 w-4 text-amber-300" />
            High priority tasks
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Highest priority from deadlines, exams, marks, and goals.
          </p>
          <div className="mt-5 space-y-3">
            {tasks.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-white/10 bg-[#0a0f1a] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{t.reason}</p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-slate-300">
                    {t.priorityScore}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-4 py-10 text-center text-sm text-slate-500">
                Add calendar events / goals to generate tasks.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-[22px] border border-white/10 bg-[#0b1424]/90 p-5 shadow-xl shadow-black/30 sm:p-6">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <Brain className="h-4 w-4 text-violet-300" />
          This week’s plan
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Simple spread across the next 7 days using your hours/day.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {!plan ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-4 py-10 text-center text-sm text-slate-500">
              Generate a plan to fill the week.
            </div>
          ) : (
            plan.week.map((d) => (
              <div
                key={d.dateISO}
                className="rounded-2xl border border-white/10 bg-[#0a0f1a] p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {d.day}
                </p>
                <div className="mt-3 space-y-2">
                  {d.items.length === 0 ? (
                    <p className="text-xs text-slate-600">—</p>
                  ) : (
                    d.items.slice(0, 4).map((t) => (
                      <p key={`${d.dateISO}_${t.id}`} className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-100">
                          {t.suggestedHours}h
                        </span>{" "}
                        {t.title}
                      </p>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

