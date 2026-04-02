import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Bell,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getCalendarUserKey,
  loadCalendarEvents,
  saveCalendarEvents,
} from "./calendarStorage.js";
import {
  getMonthGrid,
  sameDay,
  isToday,
  formatEventRange,
  msUntil,
  formatCountdown,
  REPEAT_MODES,
  offsetReminderLabel,
} from "./studentCalendarUtils.js";
import { useCalendarReminders } from "./useCalendarReminders.js";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COUNTDOWN_PRESET_BUTTONS = [
  { id: "d7", minutes: 7 * 24 * 60, label: "7 days before" },
  { id: "d3", minutes: 3 * 24 * 60, label: "3 days before" },
  { id: "d1", minutes: 1 * 24 * 60, label: "1 day before" },
  { id: "at", minutes: 0, label: "On the day" },
];

const CATEGORY_STYLES = {
  deadline: {
    label: "Deadline",
    dot: "bg-cyan-400",
    chip: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
  },
  exam: {
    label: "Exam",
    dot: "bg-rose-400",
    chip: "border-rose-400/40 bg-rose-500/15 text-rose-200",
  },
  assignment: {
    label: "Assignment",
    dot: "bg-amber-400",
    chip: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  },
  class: {
    label: "Class",
    dot: "bg-sky-400",
    chip: "border-sky-400/40 bg-sky-500/15 text-sky-200",
  },
  other: {
    label: "Other",
    dot: "bg-violet-400",
    chip: "border-violet-400/40 bg-violet-500/15 text-violet-200",
  },
};

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `ev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function emptyForm() {
  return {
    title: "",
    date: "",
    time: "09:00",
    datetimeLocal: "",
    category: "deadline",
    reminderStyle: "countdown",
    reminderOffsetMinutes: [24 * 60],
    repeatMode: "once",
    allDay: false,
    notes: "",
  };
}

function toISO(dateStr, timeStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "09:00").split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}

function fromISO(iso) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return { date: "", time: "09:00" };
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
  };
}

function toDatetimeLocalValue(dateStr, timeStr) {
  if (!dateStr) return "";
  const t = (timeStr || "09:00").slice(0, 5);
  return `${dateStr}T${t}`;
}

function splitDatetimeLocal(val) {
  if (!val || typeof val !== "string" || !val.includes("T")) {
    return { date: "", time: "09:00" };
  }
  const [d, t] = val.split("T");
  return { date: d, time: (t || "09:00").slice(0, 5) };
}

function formatSelectedRemindersLine(offsets, reminderStyle) {
  if (reminderStyle === "none" || !offsets?.length) return "Selected: —";
  const uniq = [...new Set(offsets)].sort((a, b) => b - a);
  const parts = uniq.map((m) => {
    if (m === 0) return "0 days before";
    if (m % 1440 === 0) {
      const days = m / 1440;
      return `${days} day${days === 1 ? "" : "s"} before`;
    }
    return offsetReminderLabel(m);
  });
  return `Selected: ${parts.join(", ")}`;
}

function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function isSameLocalCalendarDay(iso, ref) {
  const a = new Date(iso);
  if (Number.isNaN(a.getTime())) return false;
  return (
    a.getFullYear() === ref.getFullYear() &&
    a.getMonth() === ref.getMonth() &&
    a.getDate() === ref.getDate()
  );
}

function defaultTimeForNewEvent(dateStr) {
  const pad = (n) => String(n).padStart(2, "0");
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "09:00";
  const picked = new Date(y, m - 1, d, 12, 0, 0, 0);
  const now = new Date();
  if (!sameDay(picked, now)) return "09:00";
  const t = new Date(now.getTime() + 45_000);
  t.setSeconds(0, 0);
  if (t.getTime() <= now.getTime()) {
    t.setMinutes(t.getMinutes() + 1);
  }
  return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

export default function StudentCalendarPage() {
  const { user } = useAuth();
  const userKey = useMemo(
    () => getCalendarUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );

  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth() };
  });
  const [selected, setSelected] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tick, setTick] = useState(0);
  const [customDaysBefore, setCustomDaysBefore] = useState("");

  useCalendarReminders(events);

  useEffect(() => {
    setEvents(loadCalendarEvents(userKey));
  }, [userKey]);

  const persist = useCallback(
    (next) => {
      setEvents(next);
      saveCalendarEvents(userKey, next);
    },
    [userKey],
  );

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const monthLabel = useMemo(
    () =>
      new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [cursor.y, cursor.m],
  );

  const grid = useMemo(
    () => getMonthGrid(cursor.y, cursor.m),
    [cursor.y, cursor.m],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const d = new Date(ev.startISO);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const todayStart = startOfLocalDay(new Date());
    return [...events]
      .filter((e) => {
        const t = new Date(e.startISO).getTime();
        if (Number.isNaN(t)) return false;
        return t >= todayStart;
      })
      .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  }, [events, tick]);

  const openAdd = (presetDate) => {
    setEditingId(null);
    setCustomDaysBefore("");
    const base = presetDate || selected;
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
    const timeStr = defaultTimeForNewEvent(dateStr);
    setForm({
      ...emptyForm(),
      date: dateStr,
      time: timeStr,
      datetimeLocal: toDatetimeLocalValue(dateStr, timeStr),
    });
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditingId(ev.id);
    setCustomDaysBefore("");
    const { date, time } = fromISO(ev.startISO);
    const allDay = Boolean(ev.allDay);
    setForm({
      title: ev.title,
      date,
      time,
      datetimeLocal: toDatetimeLocalValue(date, time),
      category: ev.category || "other",
      reminderStyle:
        (ev.reminderOffsetMinutes || []).length === 0 ? "none" : "countdown",
      reminderOffsetMinutes: [...(ev.reminderOffsetMinutes || [])].sort(
        (a, b) => b - a,
      ),
      repeatMode: ev.repeatMode || "once",
      allDay,
      notes: ev.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setCustomDaysBefore("");
    setForm(emptyForm());
  };

  const selectCountdownPreset = (minutes) => {
    setForm((f) => ({
      ...f,
      reminderStyle: "countdown",
      reminderOffsetMinutes: [minutes],
    }));
  };

  const addCustomDaysBefore = () => {
    const raw = String(customDaysBefore || "").trim();
    if (!raw) return;
    const d = Math.floor(Number(raw));
    if (!Number.isFinite(d) || d < 0 || d > 365) return;
    const mins = d * 24 * 60;
    setForm((f) => {
      const s = new Set(f.reminderOffsetMinutes);
      s.add(mins);
      return {
        ...f,
        reminderStyle: "countdown",
        reminderOffsetMinutes: [...s].sort((a, b) => b - a),
      };
    });
    setCustomDaysBefore("");
  };

  const saveEvent = () => {
    const title = (form.title || "").trim();
    if (!title) return;

    let startISO;
    if (form.allDay) {
      if (!form.date) return;
      startISO = toISO(form.date, "00:00");
    } else {
      const { date, time } = splitDatetimeLocal(form.datetimeLocal);
      if (!date) return;
      startISO = toISO(date, time);
    }
    if (!startISO) return;

    const reminders =
      form.reminderStyle === "none" ? [] : form.reminderOffsetMinutes;

    const basePayload = {
      title,
      startISO,
      category: form.category,
      reminderOffsetMinutes: reminders,
      repeatMode: form.repeatMode,
      allDay: form.allDay,
      notes: (form.notes || "").trim(),
    };

    if (editingId) {
      persist(
        events.map((e) =>
          e.id === editingId ? { ...e, ...basePayload } : e,
        ),
      );
    } else {
      persist([...events, { id: makeId(), ...basePayload }]);
    }
    closeModal();
  };

  const deleteEvent = (id) => {
    persist(events.filter((e) => e.id !== id));
    closeModal();
  };

  const goMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const goToday = () => {
    const t = new Date();
    setCursor({ y: t.getFullYear(), m: t.getMonth() });
    setSelected(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  };

  const MAX_VISIBLE_DAY_EVENTS = 6;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Calendar & deadlines
            </h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Student hub
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Add events with countdown reminders — they also appear in{" "}
            <span className="text-slate-300">Notifications</span> when due. All
            saved events show on the month grid and in Upcoming.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAdd()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add event
        </button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToday}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => goMonth(-1)}
                className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/[0.06]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => goMonth(1)}
                className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/[0.06]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`e-${idx}`}
                    className="min-h-[88px] rounded-lg bg-[#0a0f1a]/50 md:min-h-[104px]"
                  />
                );
              }
              const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
              const dayEvents = eventsByDay.get(key) || [];
              const sel = sameDay(cell, selected);
              const today = isToday(cell);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelected(cell);
                    if (dayEvents.length === 1) openEdit(dayEvents[0]);
                  }}
                  onDoubleClick={() => openAdd(cell)}
                  className={[
                    "flex min-h-[88px] flex-col rounded-lg border p-1.5 text-left transition md:min-h-[104px]",
                    sel
                      ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-400/30"
                      : today
                        ? "border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-400/25"
                        : "border-transparent bg-[#0a0f1a] hover:border-white/10",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-xs font-semibold",
                      today ? "text-blue-300" : "text-slate-300",
                    ].join(" ")}
                  >
                    {cell.getDate()}
                  </span>
                  <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, MAX_VISIBLE_DAY_EVENTS).map((ev) => {
                      const st =
                        CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.other;
                      const t = new Date(ev.startISO);
                      const timeStr = t.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                      return (
                        <div
                          key={ev.id}
                          className="flex min-w-0 items-start gap-1 rounded px-0.5"
                          title={`${ev.title} · ${timeStr}`}
                        >
                          <span
                            className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`}
                          />
                          <span className="min-w-0 truncate text-[9px] leading-tight text-slate-300">
                            <span className="text-slate-500">{timeStr}</span>{" "}
                            {ev.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > MAX_VISIBLE_DAY_EVENTS && (
                      <span className="text-[9px] text-slate-500">
                        +{dayEvents.length - MAX_VISIBLE_DAY_EVENTS} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Every saved event lists here by date. Click a day to select;
            double-click to add. One event on a day opens edit on single click.
          </p>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 sm:p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Upcoming — all events from today
            </h3>
            <ul className="mt-4 space-y-3">
              {upcoming.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-500">
                  No upcoming events. Add one with &quot;Add event&quot;.
                </li>
              )}
              {upcoming.map((ev) => {
                const st =
                  CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.other;
                const ms = msUntil(ev.startISO);
                const cd = ms != null && ms >= 0 ? formatCountdown(ms) : null;
                const pastButToday =
                  ms != null &&
                  ms < 0 &&
                  isSameLocalCalendarDay(ev.startISO, new Date());
                return (
                  <li
                    key={ev.id}
                    className="rounded-xl border border-white/[0.06] bg-[#0a0f1a] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{ev.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatEventRange(ev.startISO)}
                        </p>
                        {cd && (
                          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-200">
                            <Clock className="h-3.5 w-3.5" />
                            {cd} left
                          </p>
                        )}
                        {pastButToday && (
                          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            Earlier today
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${st.chip}`}
                          >
                            {st.label}
                          </span>
                          {(ev.reminderOffsetMinutes || []).length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                              <Bell className="h-3 w-3" />
                              {(ev.reminderOffsetMinutes || [])
                                .map(offsetReminderLabel)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => openEdit(ev)}
                          className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/[0.06]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          onClick={() => {
                            if (
                              typeof window !== "undefined" &&
                              window.confirm(`Delete “${ev.title}”?`)
                            ) {
                              persist(events.filter((e) => e.id !== ev.id));
                            }
                          }}
                          className="rounded-lg border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-modal-title"
        >
          <div className="max-h-[min(92vh,820px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <h2
                id="cal-modal-title"
                className="text-sm font-bold uppercase tracking-[0.14em] text-white"
              >
                {editingId ? "Edit event / deadline" : "Add event / deadline"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Title
                </label>
                <input
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Type
                </label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-white outline-none focus:border-cyan-500/50"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {Object.entries(CATEGORY_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Date &amp; time
                </label>
                {form.allDay ? (
                  <input
                    type="date"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    value={form.date}
                    onChange={(e) => {
                      const d = e.target.value;
                      setForm((f) => ({
                        ...f,
                        date: d,
                        datetimeLocal: toDatetimeLocalValue(
                          d,
                          splitDatetimeLocal(f.datetimeLocal).time || "00:00",
                        ),
                      }));
                    }}
                  />
                ) : (
                  <input
                    type="datetime-local"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    value={form.datetimeLocal}
                    onChange={(e) => {
                      const v = e.target.value;
                      const { date, time } = splitDatetimeLocal(v);
                      setForm((f) => ({
                        ...f,
                        datetimeLocal: v,
                        date,
                        time,
                      }));
                    }}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Reminder
                </label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                  value={form.reminderStyle}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      reminderStyle: v,
                      reminderOffsetMinutes:
                        v === "none"
                          ? []
                          : f.reminderOffsetMinutes.length
                            ? f.reminderOffsetMinutes
                            : [24 * 60],
                    }));
                  }}
                >
                  <option value="countdown">Countdown reminders</option>
                  <option value="none">No reminders</option>
                </select>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  In-app notification depends on this selection.
                </p>

                {form.reminderStyle === "countdown" && (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {COUNTDOWN_PRESET_BUTTONS.map((btn) => {
                        const active =
                          form.reminderOffsetMinutes.length === 1 &&
                          form.reminderOffsetMinutes[0] === btn.minutes;
                        return (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => selectCountdownPreset(btn.minutes)}
                            className={[
                              "rounded-full border px-3.5 py-2 text-xs font-medium transition",
                              active
                                ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-100"
                                : "border-white/15 bg-[#0a0f1a] text-slate-300 hover:border-white/25",
                            ].join(" ")}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">
                        Custom days before
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="number"
                          min={0}
                          max={365}
                          step={1}
                          placeholder="e.g. 14"
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                          value={customDaysBefore}
                          onChange={(e) => setCustomDaysBefore(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomDaysBefore();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addCustomDaysBefore}
                          className="rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/[0.05]"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {formatSelectedRemindersLine(
                        form.reminderOffsetMinutes,
                        form.reminderStyle,
                      )}
                    </p>
                  </>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((f) => {
                      if (checked) {
                        const d =
                          f.date ||
                          splitDatetimeLocal(f.datetimeLocal).date ||
                          "";
                        return {
                          ...f,
                          allDay: true,
                          date: d,
                          time: "00:00",
                          datetimeLocal: toDatetimeLocalValue(d, "00:00"),
                        };
                      }
                      const d =
                        f.date || splitDatetimeLocal(f.datetimeLocal).date;
                      const t =
                        f.time && f.time !== "00:00" ? f.time : "09:00";
                      const dl = toDatetimeLocalValue(d, t);
                      const parts = splitDatetimeLocal(dl);
                      return {
                        ...f,
                        allDay: false,
                        datetimeLocal: dl,
                        date: parts.date,
                        time: parts.time,
                      };
                    });
                  }}
                  className="rounded border-white/20 bg-[#0a0f1a] text-cyan-500"
                />
                All day
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Notes
                </label>
                <textarea
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional details…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Repeat after first alert
                </label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                  value={form.repeatMode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, repeatMode: e.target.value }))
                  }
                >
                  {REPEAT_MODES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-slate-500">
                  Keep this tab open for reminder toasts and inbox updates.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => deleteEvent(editingId)}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={saveEvent}
                className="ml-auto rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
