import { getCalendarUserKey } from "./calendarStorage.js";

const STORAGE_PREFIX = "slms_student_notifications_v1";
const SEED_PREFIX = "slms_notif_demo_seeded_";

function storageKey(userKey) {
  return `${STORAGE_PREFIX}_${userKey}`;
}

export { getCalendarUserKey as getNotificationsUserKey };

export function loadNotifications(userKey) {
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotifications(userKey, items) {
  localStorage.setItem(storageKey(userKey), JSON.stringify(items));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("slms-student-notifications-changed"));
  }
}

function demoSeedFlag(userKey) {
  return `${SEED_PREFIX}${userKey}`;
}

export function demoNotifications() {
  const base = "2026-03-23T11:21:00";
  return [
    {
      id: "demo_gold",
      title: "New Badge Unlocked!",
      body: "You earned the GOLD badge for goal: Gpa up",
      category: "achievement",
      read: false,
      createdAt: new Date(base).toISOString(),
    },
    {
      id: "demo_silver",
      title: "New Badge Unlocked!",
      body: "You earned the SILVER badge for goal: Gpa up",
      category: "achievement",
      read: false,
      createdAt: new Date("2026-03-23T10:15:00").toISOString(),
    },
    {
      id: "demo_bronze",
      title: "New Badge Unlocked!",
      body: "You earned the BRONZE badge for goal: Gpa up",
      category: "achievement",
      read: true,
      createdAt: new Date("2026-03-22T16:40:00").toISOString(),
    },
    {
      id: "demo_goal",
      title: "Goal Achieved!",
      body: "You completed your goal: Gpa up — keep the momentum going.",
      category: "achievement",
      read: false,
      createdAt: new Date("2026-03-23T09:00:00").toISOString(),
    },
    {
      id: "demo_exam",
      title: "Reminder: Upcoming EXAM",
      body: "Exam is scheduled for 3/28/2026",
      category: "reminder",
      read: false,
      createdAt: new Date("2026-03-23T08:30:00").toISOString(),
    },
  ];
}

/** One-time demo inbox so the page matches the design before backend wiring. */
export function ensureDemoNotificationsIfEmpty(userKey) {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(demoSeedFlag(userKey))) return;
  const existing = loadNotifications(userKey);
  if (existing.length > 0) {
    localStorage.setItem(demoSeedFlag(userKey), "1");
    return;
  }
  saveNotifications(userKey, demoNotifications());
  localStorage.setItem(demoSeedFlag(userKey), "1");
}

/** Push a notification (e.g. from calendar or performance hooks). */
export function appendNotification(userKey, item) {
  const list = loadNotifications(userKey);
  saveNotifications(userKey, [item, ...list]);
}
