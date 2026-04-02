const STORAGE_PREFIX = "slms_student_calendar_v1";

function storageKey(userKey) {
  return `${STORAGE_PREFIX}_${userKey}`;
}

export function getCalendarUserKey(userId, email) {
  if (userId) return `u_${String(userId)}`;
  if (email) return `e_${String(email).toLowerCase()}`;
  return "guest";
}

export function loadCalendarEvents(userKey) {
  try {
    const raw = localStorage.getItem(storageKey(userKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCalendarEvents(userKey, events) {
  localStorage.setItem(storageKey(userKey), JSON.stringify(events));
}
