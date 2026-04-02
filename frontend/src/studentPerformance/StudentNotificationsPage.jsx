import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Bell,
  Check,
  CheckCheck,
  Megaphone,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  ensureDemoNotificationsIfEmpty,
  getNotificationsUserKey,
  loadNotifications,
  saveNotifications,
} from "./notificationsStorage.js";
import { loadCalendarEvents } from "./calendarStorage.js";
import { useCalendarReminders } from "./useCalendarReminders.js";

const NOTIFICATIONS_LS_PREFIX = "slms_student_notifications_v1";
const CALENDAR_LS_PREFIX = "slms_student_calendar_v1";

const CATEGORY_META = {
  achievement: {
    label: "ACHIEVEMENT",
    chip: "border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-200",
    Icon: Award,
    bg: "bg-gradient-to-br from-amber-500/10 to-transparent",
    border: "border-amber-500/20",
  },
  reminder: {
    label: "REMINDER",
    chip: "border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-200",
    Icon: Megaphone,
    bg: "bg-gradient-to-br from-cyan-500/10 to-transparent",
    border: "border-cyan-500/20",
  },
  alert: {
    label: "ALERT",
    chip: "border-red-500/30 bg-gradient-to-r from-red-500/15 to-pink-500/10 text-red-200",
    Icon: TrendingDown,
    bg: "bg-gradient-to-br from-red-500/10 to-transparent",
    border: "border-red-500/20",
  },
  system: {
    label: "UPDATE",
    chip: "border-blue-500/30 bg-gradient-to-r from-blue-500/15 to-indigo-500/10 text-blue-200",
    Icon: Bell,
    bg: "bg-gradient-to-br from-blue-500/10 to-transparent",
    border: "border-blue-500/20",
  },
};

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const userKey = useMemo(
    () => getNotificationsUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );

  const [items, setItems] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useCalendarReminders(calendarEvents);

  useEffect(() => {
    ensureDemoNotificationsIfEmpty(userKey);
    const notifKey = `${NOTIFICATIONS_LS_PREFIX}_${userKey}`;
    const calKey = `${CALENDAR_LS_PREFIX}_${userKey}`;
    const syncNotifs = () => setItems(loadNotifications(userKey));
    const syncCal = () => setCalendarEvents(loadCalendarEvents(userKey));
    syncNotifs();
    syncCal();
    const onStorage = (e) => {
      if (e.key === notifKey) syncNotifs();
      if (e.key === calKey) syncCal();
    };
    const onInbox = () => syncNotifs();
    window.addEventListener("storage", onStorage);
    window.addEventListener("slms-student-notifications-changed", onInbox);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("slms-student-notifications-changed", onInbox);
    };
  }, [userKey]);

  const persist = useCallback(
    (next) => {
      setItems(next);
      saveNotifications(userKey, next);
    },
    [userKey],
  );

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [items],
  );

  const markRead = (id) => {
    persist(
      items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllRead = () => {
    persist(items.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this notification?")
    ) {
      return;
    }
    persist(items.filter((n) => n.id !== id));
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Notifications & reminders
            </h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Student hub
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Deadlines, exams, achievements, and low-performance alerts — refreshes
            live when new alerts arrive.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-40"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </header>

      <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-200">
                {unreadCount} new
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            Latest first · click “Mark read” to dismiss
          </p>
        </div>

        <ul className="mt-5 space-y-3">
          {sorted.length === 0 && (
            <li className="rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
              No notifications yet. Performance milestones and calendar reminders
              will show up here.
            </li>
          )}
          {sorted.map((n) => {
            const meta =
              CATEGORY_META[n.category] || CATEGORY_META.system;
            const { Icon } = meta;
            const unread = !n.read;
            return (
              <li
                key={n.id}
                className={[
                  "flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-start sm:justify-between",
                  unread
                    ? "border-violet-500/20 bg-[#0a0f1a] ring-1 ring-violet-500/10"
                    : "border-white/[0.06] bg-[#0a0f1a]/80 opacity-90",
                ].join(" ")}
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <div
                    className={[
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                      unread
                        ? "border-violet-500/25 bg-violet-500/10 text-violet-200"
                        : "border-white/10 bg-white/[0.04] text-slate-400",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{n.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {n.body}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatWhen(n.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <span
                    className={[
                      "inline-flex w-fit rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      meta.chip,
                    ].join(" ")}
                  >
                    {meta.label}
                  </span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {unread ? (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark read
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-1 py-1.5 text-[11px] text-slate-500">
                        Read
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(n.id)}
                      aria-label="Delete notification"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
