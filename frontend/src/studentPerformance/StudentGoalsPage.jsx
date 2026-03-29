import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  appendNotification,
  getNotificationsUserKey,
} from "./notificationsStorage.js";
import {
  badgesUnlockedByProgress,
  ensureDemoGoalsIfEmpty,
  getGoalsUserKey,
  loadGoalsBundle,
  progressPercent,
  saveGoalsBundle,
} from "./goalsStorage.js";

const TYPE_OPTIONS = [
  { value: "gpa", label: "GPA target" },
  { value: "subject", label: "Subject target" },
  { value: "weekly", label: "Weekly target" },
];

const TYPE_SHORT = {
  gpa: "GPA",
  subject: "Subject",
  weekly: "Weekly",
};

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

const TIER_ORDER = { gold: 0, silver: 1, bronze: 2 };

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

  const [goals, setGoals] = useState([]);
  const [badges, setBadges] = useState([]);

  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("gpa");
  const [formTarget, setFormTarget] = useState("");
  const [formSemester, setFormSemester] = useState("");
  const [formYear, setFormYear] = useState("");

  const [draftCurrent, setDraftCurrent] = useState({});

  useEffect(() => {
    ensureDemoGoalsIfEmpty(userKey);
    const { goals: g, badges: b } = loadGoalsBundle(userKey);
    setGoals(g);
    setBadges(b);
    const drafts = {};
    for (const goal of g) {
      drafts[goal.id] = String(goal.currentValue ?? 0);
    }
    setDraftCurrent(drafts);
  }, [userKey]);

  const persist = useCallback(
    (nextGoals, nextBadges) => {
      setGoals(nextGoals);
      setBadges(nextBadges);
      saveGoalsBundle(userKey, { goals: nextGoals, badges: nextBadges });
    },
    [userKey],
  );

  const pushBadgeNotifications = useCallback(
    (newBadges) => {
      for (const b of newBadges) {
        appendNotification(notifKey, {
          id: `notif_badge_${b.id}`,
          title: "New Badge Unlocked!",
          body: `You earned the ${String(b.tier).toUpperCase()} badge for goal: ${b.goalTitle}`,
          category: "achievement",
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    },
    [notifKey],
  );

  const createGoal = (e) => {
    e.preventDefault();
    const title = formTitle.trim();
    const target = Number(formTarget);
    if (!title || !Number.isFinite(target) || target <= 0) return;

    const goal = {
      id: makeGoalId(),
      title,
      type: formType,
      targetValue: target,
      currentValue: 0,
      semester: formSemester.trim(),
      academicYear: formYear.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [goal, ...goals];
    persist(next, badges);
    setDraftCurrent((d) => ({ ...d, [goal.id]: "0" }));
    setFormTitle("");
    setFormTarget("");
    setFormSemester("");
    setFormYear("");
  };

  const deleteGoal = (id) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this goal?")) {
      return;
    }
    const nextGoals = goals.filter((g) => g.id !== id);
    persist(nextGoals, badges);
    setDraftCurrent((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
  };

  const saveProgress = (goal) => {
    const raw = draftCurrent[goal.id];
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 0) return;

    const prevPct = progressPercent(goal.currentValue, goal.targetValue);
    const updated = { ...goal, currentValue: v };
    const newPct = progressPercent(v, goal.targetValue);

    const newBadges = badgesUnlockedByProgress(
      updated,
      prevPct,
      newPct,
      badges,
    );

    const nextGoals = goals.map((g) => (g.id === goal.id ? updated : g));
    const nextBadges = [...newBadges, ...badges];

    persist(nextGoals, nextBadges);
    if (newBadges.length) pushBadgeNotifications(newBadges);
  };

  const sortedBadges = useMemo(
    () =>
      [...badges].sort((a, b) => {
        const oa = TIER_ORDER[a.tier] ?? 9;
        const ob = TIER_ORDER[b.tier] ?? 9;
        if (oa !== ob) return oa - ob;
        return new Date(b.earnedAt) - new Date(a.earnedAt);
      }),
    [badges],
  );

  return (
    <div className="p-6 text-slate-100 lg:p-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Goals & achievements
          </h1>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            Student hub
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Set GPA, subject, or weekly targets; track progress; earn Bronze / Silver /
          Gold badges — updates live when goals or marks change.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-xl shadow-black/20 md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
            New goal
          </h2>
          <form onSubmit={createGoal} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400">Title</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Raise semester GPA"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Type</label>
              <select
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">
                Target value
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                placeholder="e.g. 3.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-400">
                  Semester
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                  value={formSemester}
                  onChange={(e) => setFormSemester(e.target.value)}
                  placeholder="optional"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400">
                  Academic year
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-500/40"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  placeholder="optional"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/25 transition hover:bg-teal-500"
            >
              Create goal
            </button>
          </form>
        </section>

        <div className="space-y-8">
          <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-xl shadow-black/20 md:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
              Active goals
            </h2>
            <ul className="mt-5 space-y-4">
              {goals.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-500">
                  No goals yet. Create one with the form.
                </li>
              )}
              {goals.map((goal) => {
                const pct = progressPercent(
                  goal.currentValue,
                  goal.targetValue,
                );
                const typeLabel = TYPE_SHORT[goal.type] || "Goal";
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
                    <h3 className="pr-16 text-lg font-semibold text-white">
                      {goal.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {typeLabel} — target:{" "}
                      <span className="font-medium text-slate-200">
                        {goal.targetValue}
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
                          Update current value
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
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

          <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-xl shadow-black/20 md:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
              Achievement badges
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Bronze at 33% progress, Silver at 66%, Gold at 100%.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {sortedBadges.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-500">
                  No badges yet — update progress on a goal to unlock tiers.
                </div>
              )}
              {sortedBadges.map((b) => {
                const st = BADGE_STYLE[b.tier] || BADGE_STYLE.bronze;
                return (
                  <div
                    key={b.id}
                    className={`flex flex-col justify-between rounded-2xl bg-gradient-to-br p-4 shadow-lg ${st.card}`}
                  >
                    <p className="text-xl font-black tracking-tight">
                      {st.title}
                    </p>
                    <div className="mt-6">
                      <p className="text-sm font-semibold opacity-90">
                        {b.goalTitle}
                      </p>
                      <p className="mt-1 text-xs opacity-80">
                        {formatBadgeDate(b.earnedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
