/** @param {number} year @param {number} month 0-11 */
export function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d) {
  if (!d) return false;
  const t = new Date();
  return sameDay(d, t);
}

export function formatEventRange(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Milliseconds from now to start (negative if past) */
export function msUntil(iso) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return t - Date.now();
}

export function formatCountdown(ms) {
  if (ms == null || ms < 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export const OFFSET_PRESETS = [
  { id: "1w", label: "1 week before", minutes: 7 * 24 * 60 },
  { id: "1d", label: "1 day before", minutes: 24 * 60 },
  { id: "1h", label: "1 hour before", minutes: 60 },
  { id: "15m", label: "15 minutes before", minutes: 15 },
  { id: "at", label: "At event time", minutes: 0 },
];

export const REPEAT_MODES = [
  { id: "once", label: "Once when each reminder is due" },
  { id: "hourly", label: "Every hour until the event (from first reminder)" },
  { id: "every6h", label: "Every 6 hours until the event" },
  { id: "daily", label: "Once per day until the event" },
];

export function repeatIntervalMinutes(mode) {
  if (mode === "hourly") return 60;
  if (mode === "every6h") return 360;
  if (mode === "daily") return 1440;
  return 0;
}

export function offsetReminderLabel(minutes) {
  if (minutes === 0) return "at event time";
  if (minutes % 10080 === 0) {
    const w = minutes / 10080;
    return `${w} week${w === 1 ? "" : "s"} before`;
  }
  if (minutes % 1440 === 0) {
    const d = minutes / 1440;
    return `${d} day${d === 1 ? "" : "s"} before`;
  }
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h} hour${h === 1 ? "" : "s"} before`;
  }
  return `${minutes} min before`;
}
