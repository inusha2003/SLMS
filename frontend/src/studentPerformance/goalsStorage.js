import { getCalendarUserKey } from "./calendarStorage.js";

const STORAGE_KEY = "slms_student_goals_bundle_v1";
const SEED_FLAG = "slms_goals_demo_seeded_";

export { getCalendarUserKey as getGoalsUserKey };

/** Lifetime fully completed goals → milestone badges */
export const MILESTONE_COMPLETION_THRESHOLDS = [
  { tier: "bronze", at: 10, label: "10 goals completed" },
  { tier: "silver", at: 35, label: "35 goals completed (25 after Bronze)" },
  { tier: "gold", at: 85, label: "85 goals completed (50 after Silver)" },
];

function bundleKey(userKey) {
  return `${STORAGE_KEY}_${userKey}`;
}

function emptyBundle() {
  return { goals: [], badges: [], deadlineNotifiedIds: [] };
}

function normalizeBadges(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((b) => b && b.kind === "milestone" && b.tier);
}

export function loadGoalsBundle(userKey) {
  try {
    const raw = localStorage.getItem(bundleKey(userKey));
    if (!raw) return emptyBundle();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyBundle();
    const goals = Array.isArray(parsed.goals) ? parsed.goals : [];
    const rawBadges = Array.isArray(parsed.badges) ? parsed.badges : [];
    const badges = normalizeBadges(rawBadges);
    const deadlineNotifiedIds = Array.isArray(parsed.deadlineNotifiedIds)
      ? parsed.deadlineNotifiedIds
      : [];
    if (rawBadges.length !== badges.length) {
      saveGoalsBundle(userKey, { goals, badges, deadlineNotifiedIds });
    }
    return { goals, badges, deadlineNotifiedIds };
  } catch {
    return emptyBundle();
  }
}

export function saveGoalsBundle(userKey, bundle) {
  localStorage.setItem(
    bundleKey(userKey),
    JSON.stringify({
      goals: bundle.goals || [],
      badges: normalizeBadges(bundle.badges || []),
      deadlineNotifiedIds: Array.isArray(bundle.deadlineNotifiedIds)
        ? bundle.deadlineNotifiedIds
        : [],
    }),
  );
}

export function progressPercent(current, target) {
  const t = Number(target);
  const c = Number(current);
  if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(c)) return 0;
  return Math.min(100, Math.round((c / t) * 100));
}

/** Goals where current ≥ target (100%). */
export function countCompletedGoals(goals) {
  if (!Array.isArray(goals)) return 0;
  return goals.filter((g) => progressPercent(g.currentValue, g.targetValue) >= 100)
    .length;
}

/**
 * New milestone badges when lifetime completed count crosses thresholds.
 * @param {Array<{ tier: string, kind?: string }>} existingBadges
 * @param {number} completedCount
 * @returns {Array<{ id: string, tier: string, kind: 'milestone', earnedAt: string, completionsAtUnlock: number }>}
 */
export function newMilestoneBadgesForCompletionCount(existingBadges, completedCount) {
  const have = new Set(
    (existingBadges || [])
      .filter((b) => b && b.kind === "milestone")
      .map((b) => b.tier),
  );
  const out = [];
  for (const { tier, at } of MILESTONE_COMPLETION_THRESHOLDS) {
    if (completedCount >= at && !have.has(tier)) {
      out.push({
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `ms_${tier}_${Date.now()}`,
        tier,
        kind: "milestone",
        earnedAt: new Date().toISOString(),
        completionsAtUnlock: completedCount,
      });
      have.add(tier);
    }
  }
  return out;
}

/** Local calendar day of deadline has passed (strictly before today). */
export function isGoalDeadlinePassed(deadlineIso) {
  if (!deadlineIso) return false;
  const dl = new Date(deadlineIso);
  if (Number.isNaN(dl.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dl);
  end.setHours(0, 0, 0, 0);
  return today.getTime() > end.getTime();
}

function seedFlagKey(userKey) {
  return `${SEED_FLAG}${userKey}`;
}

export function ensureDemoGoalsIfEmpty(userKey) {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(seedFlagKey(userKey))) return;

  const bundle = loadGoalsBundle(userKey);
  if (bundle.goals.length > 0) {
    localStorage.setItem(seedFlagKey(userKey), "1");
    return;
  }

  const gid = "demo_goal_gpa";
  const demoDeadline = new Date("2026-06-30T12:00:00").toISOString();
  const demoDate = new Date("2026-03-23T12:00:00").toISOString();

  saveGoalsBundle(userKey, {
    goals: [
      {
        id: gid,
        title: "Gpa up",
        type: "gpa",
        targetValue: 5,
        currentValue: 3,
        deadline: demoDeadline,
        semester: "",
        academicYear: "",
        createdAt: demoDate,
        completionNotified: false,
      },
    ],
    badges: [],
    deadlineNotifiedIds: [],
  });
  localStorage.setItem(seedFlagKey(userKey), "1");
}
