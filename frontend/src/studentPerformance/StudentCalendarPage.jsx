import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Bell,
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
  OFFSET_PRESETS,
  REPEAT_MODES,
  offsetReminderLabel,
} from "./studentCalendarUtils.js";
import { useCalendarReminders } from "./useCalendarReminders.js";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_STYLES = {
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
    category: "exam",
    reminderOffsetMinutes: [24 * 60, 60],
    repeatMode: "once",
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
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.startISO).getTime() >= now - 60_000)
      .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  }, [events, tick]);

  const openAdd = (presetDate) => {
    setEditingId(null);
    const base = presetDate || selected;
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
    setForm({ ...emptyForm(), date: dateStr });
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditingId(ev.id);
    const { date, time } = fromISO(ev.startISO);
    setForm({
      title: ev.title,
      date,
      time,
      category: ev.category || "other",
      reminderOffsetMinutes: [...(ev.reminderOffsetMinutes || [])].sort(
        (a, b) => b - a,
      ),
      repeatMode: ev.repeatMode || "once",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const toggleOffset = (minutes) => {
    setForm((f) => {
      const set = new Set(f.reminderOffsetMinutes);
      if (set.has(minutes)) set.delete(minutes);
      else set.add(minutes);
      return {
        ...f,
        reminderOffsetMinutes: [...set].sort((a, b) => b - a),
      };
    });
  };

  const saveEvent = () => {
    const title = (form.title || "").trim();
    if (!title || !form.date) return;
    const startISO = toISO(form.date, form.time);
    if (!startISO) return;

    if (editingId) {
      persist(
        events.map((e) =>
          e.id === editingId
            ? {
                ...e,
                title,
                startISO,
                category: form.category,
                reminderOffsetMinutes: form.reminderOffsetMinutes,
                repeatMode: form.repeatMode,
              }
            : e,
        ),
      );
    } else {
      persist([
        ...events,
        {
          id: makeId(),
          title,
          startISO,
          category: form.category,
          reminderOffsetMinutes: form.reminderOffsetMinutes,
          repeatMode: form.repeatMode,
        },
      ]);
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

  return (
    <div className="p-6 text-slate-100 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            Month view with times; add events from the button — reminders use your
            chosen offsets and repeat frequency (stored on this device).
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
        <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-4 shadow-xl shadow-black/20 md:p-5">
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
                    className="min-h-[72px] rounded-lg bg-[#0a0f1a]/50 md:min-h-[88px]"
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
                    "flex min-h-[72px] flex-col rounded-lg border p-1.5 text-left transition md:min-h-[88px]",
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
                    {dayEvents.slice(0, 2).map((ev) => {
                      const st = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.other;
                      const t = new Date(ev.startISO);
                      const timeStr = t.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                      return (
                        <div
                          key={ev.id}
                          className="flex min-w-0 items-center gap-1 rounded px-0.5"
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
                          <span className="truncate text-[10px] text-slate-400">
                            {timeStr}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-500">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Tip: click a day to select; double-click a day to add. One event on a
            day opens edit on single click.
          </p>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Upcoming — date & time
            </h3>
            <ul className="mt-4 space-y-3">
              {upcoming.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-500">
                  No upcoming events. Add one with &quot;Add event&quot;.
                </li>
              )}
              {upcoming.map((ev) => {
                const st = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.other;
                const ms = msUntil(ev.startISO);
                const cd = ms != null && ms >= 0 ? formatCountdown(ms) : null;
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-2xl">
            <h2 id="cal-modal-title" className="text-lg font-bold text-white">
              {editingId ? "Edit event" : "Add event"}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Title
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Data Structures exam"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    Time
                  </label>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                    value={form.time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, time: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Type
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
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
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Remind me (select any)
                </label>
                <div className="space-y-2 rounded-xl border border-white/10 bg-[#0a0f1a] p-3">
                  {OFFSET_PRESETS.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={form.reminderOffsetMinutes.includes(p.minutes)}
                        onChange={() => toggleOffset(p.minutes)}
                        className="rounded border-white/20 bg-[#111827] text-violet-500"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Reminder frequency after first alert
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
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
                <p className="mt-1 text-[11px] text-slate-500">
                  Repeating reminders stop when the event starts. Keep this tab
                  open for in-app toasts.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => deleteEvent(editingId)}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={saveEvent}
                className="ml-auto rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
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
