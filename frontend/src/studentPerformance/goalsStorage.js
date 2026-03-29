import { getCalendarUserKey } from "./calendarStorage.js";

const STORAGE_KEY = "slms_student_goals_bundle_v1";
const SEED_FLAG = "slms_goals_demo_seeded_";

export { getCalendarUserKey as getGoalsUserKey };

function bundleKey(userKey) {
  return `${STORAGE_KEY}_${userKey}`;
}

function emptyBundle() {
  return { goals: [], badges: [] };
}

export function loadGoalsBundle(userKey) {
  try {
    const raw = localStorage.getItem(bundleKey(userKey));
    if (!raw) return emptyBundle();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyBundle();
    return {
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    };
  } catch {
    return emptyBundle();
  }
}

export function saveGoalsBundle(userKey, bundle) {
  localStorage.setItem(
    bundleKey(userKey),
    JSON.stringify({
      goals: bundle.goals || [],
      badges: bundle.badges || [],
    }),
  );
}

export function progressPercent(current, target) {
  const t = Number(target);
  const c = Number(current);
  if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(c)) return 0;
  return Math.min(100, Math.round((c / t) * 100));
}

const TIER_THRESHOLDS = [
  { tier: "bronze", minPct: 33 },
  { tier: "silver", minPct: 66 },
  { tier: "gold", minPct: 100 },
];

/** Returns newly earned badge records (not yet persisted). */
export function badgesUnlockedByProgress(goal, prevPct, newPct, existingBadges) {
  const list = existingBadges || [];
  const out = [];
  for (const { tier, minPct } of TIER_THRESHOLDS) {
    if (newPct >= minPct && prevPct < minPct) {
      const exists = list.some(
        (b) => b.goalId === goal.id && b.tier === tier,
      );
      if (!exists) {
        out.push({
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `bdg_${Date.now()}_${tier}`,
          goalId: goal.id,
          goalTitle: goal.title,
          tier,
          earnedAt: new Date().toISOString(),
        });
      }
    }
  }
  return out;
}

function seedFlagKey(userKey) {
  return `${SEED_FLAG}${userKey}`;
}

export function ensureDemoGoalsIfEmpty(userKey) {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(seedFlagKey(userKey))) return;

  const bundle = loadGoalsBundle(userKey);
  if (bundle.goals.length > 0 || bundle.badges.length > 0) {
    localStorage.setItem(seedFlagKey(userKey), "1");
    return;
  }

  const gid = "demo_goal_gpa";
  const demoDate = new Date("2026-03-23T12:00:00").toISOString();

  saveGoalsBundle(userKey, {
    goals: [
      {
        id: gid,
        title: "Gpa up",
        type: "gpa",
        targetValue: 5,
        currentValue: 5,
        semester: "",
        academicYear: "",
        createdAt: demoDate,
      },
    ],
    badges: [
      {
        id: "demo_bd_bronze",
        goalId: gid,
        goalTitle: "Gpa up",
        tier: "bronze",
        earnedAt: new Date("2026-03-23T09:00:00").toISOString(),
      },
      {
        id: "demo_bd_silver",
        goalId: gid,
        goalTitle: "Gpa up",
        tier: "silver",
        earnedAt: new Date("2026-03-23T10:30:00").toISOString(),
      },
      {
        id: "demo_bd_gold",
        goalId: gid,
        goalTitle: "Gpa up",
        tier: "gold",
        earnedAt: new Date("2026-03-23T11:21:00").toISOString(),
      },
    ],
  });
  localStorage.setItem(seedFlagKey(userKey), "1");
}
