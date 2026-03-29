import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Bell,
  Check,
  CheckCheck,
  Megaphone,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  ensureDemoNotificationsIfEmpty,
  getNotificationsUserKey,
  loadNotifications,
  saveNotifications,
} from "./notificationsStorage.js";

const CATEGORY_META = {
  achievement: {
    label: "ACHIEVEMENT",
    chip: "border-violet-500/35 bg-violet-500/15 text-violet-200",
    Icon: Award,
  },
  reminder: {
    label: "REMINDER",
    chip: "border-teal-500/35 bg-teal-500/15 text-teal-200",
    Icon: Megaphone,
  },
  alert: {
    label: "ALERT",
    chip: "border-rose-500/35 bg-rose-500/15 text-rose-200",
    Icon: TrendingDown,
  },
  system: {
    label: "UPDATE",
    chip: "border-slate-500/35 bg-slate-500/15 text-slate-200",
    Icon: Bell,
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

  useEffect(() => {
    ensureDemoNotificationsIfEmpty(userKey);
    setItems(loadNotifications(userKey));
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

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="p-6 text-slate-100 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-4 shadow-xl shadow-black/20 md:p-6">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Inbox
          {unreadCount > 0 && (
            <span className="ml-2 rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-200">
              {unreadCount} new
            </span>
          )}
        </h2>

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
                    <span className="text-center text-[11px] text-slate-500 sm:text-right">
                      Read
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
