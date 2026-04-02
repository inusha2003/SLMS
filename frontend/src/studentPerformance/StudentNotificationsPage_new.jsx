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
import { useAuth } from "../context/MAuthContext";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header Section */}
        <header className="mb-8 space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Notifications
                </h1>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 mt-2">
                Stay updated with achievements, reminders, alerts, and system updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
                {unreadCount}
              </span>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:border-violet-500/50 hover:bg-violet-500/20 disabled:pointer-events-none disabled:opacity-40"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-4">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No notifications yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Performance milestones, achievement badges, and calendar reminders will appear here as they happen.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((n) => {
                const meta = CATEGORY_META[n.category] || CATEGORY_META.system;
                const { Icon } = meta;
                const unread = !n.read;
                return (
                  <div
                    key={n.id}
                    className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                      unread
                        ? `${meta.border} ${meta.bg} bg-gradient-to-r from-slate-800/90 to-slate-900/80 ring-1 ring-${n.category}-500/10 shadow-lg shadow-black/30`
                        : "border-white/10 bg-white/[0.02] shadow-sm shadow-black/20 opacity-85 hover:opacity-100"
                    }`}
                  >
                    {/* Gradient background effect */}
                    <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none ${meta.bg}`} />
                    
                    <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left Content */}
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${
                            unread
                              ? `${meta.border} ${meta.bg} text-white`
                              : "border-white/10 bg-white/[0.05] text-slate-400"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white line-clamp-2">{n.title}</h3>
                            {unread && (
                              <span className="h-2 w-2 rounded-full bg-violet-400 shrink-0" />
                            )}
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                            {n.body}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <span>{formatWhen(n.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                        <span
                          className={`inline-flex w-fit rounded-lg border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                          {unread ? (
                            <button
                              type="button"
                              onClick={() => markRead(n.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 to-green-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Mark read
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1.5 text-[11px] font-medium text-slate-500">
                              ✓ Read
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(n.id)}
                            aria-label="Delete notification"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition-all hover:border-red-500/50 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {sorted.length > 0 && (
          <div className="mt-8 flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing <span className="font-semibold text-slate-400">{sorted.length}</span> notification{sorted.length !== 1 ? 's' : ''}
              {unreadCount > 0 && (
                <span className="ml-2">
                  · <span className="font-semibold text-violet-300">{unreadCount} unread</span>
                </span>
              )}
            </div>
            <span className="text-slate-600">Latest first · Click "Mark read" to dismiss</span>
          </div>
        )}
      </div>
    </div>
  );
}
