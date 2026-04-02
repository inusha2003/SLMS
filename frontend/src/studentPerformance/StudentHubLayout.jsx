import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  Bell,
  Target,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/MAuthContext";
import {
  getNotificationsUserKey,
  loadNotifications,
} from "./notificationsStorage.js";

/** Keep in sync with `notificationsStorage.js` STORAGE_PREFIX. */
const NOTIFICATIONS_LS_PREFIX = "slms_student_notifications_v1";

export default function StudentHubLayout({ hubBase = "/performance" }) {
  const { user } = useAuth();
  const userKey = useMemo(
    () => getNotificationsUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    const notifKey = `${NOTIFICATIONS_LS_PREFIX}_${userKey}`;
    const sync = () => {
      const list = loadNotifications(userKey);
      setNotifUnread(list.filter((n) => !n.read).length);
    };
    sync();
    const onStorage = (e) => {
      if (e.key === notifKey) sync();
    };
    const onInbox = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("slms-student-notifications-changed", onInbox);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("slms-student-notifications-changed", onInbox);
    };
  }, [userKey]);
  const nav = [
    { to: "/performance", end: true, label: "Performance", Icon: BarChart3 },
    { to: `${hubBase}/calendar`, end: true, label: "Calendar", Icon: Calendar },
    {
      to: `${hubBase}/planner`,
      end: true,
      label: "Study planner",
      Icon: Sparkles,
    },
    {
      to: `${hubBase}/notifications`,
      end: true,
      label: "Notifications",
      Icon: Bell,
    },
    { to: `${hubBase}/goals`, end: true, label: "Goals", Icon: Target },
  ];
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#0a0f1a] text-slate-100">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#070b14] px-4 py-6">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            SLMS
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white">
            Student hub
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            performance, calendar, notifications, goals
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map(({ to, end, label, Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/25"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="sticky top-0 z-20 flex items-center justify-end border-b border-white/[0.06] bg-[#0a0f1a]/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <NavLink
            to={`${hubBase}/notifications`}
            className={({ isActive }) =>
              [
                "relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-100"
                  : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]",
              ].join(" ")
            }
          >
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
              <Bell className="h-4 w-4" aria-hidden />
              {notifUnread > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold leading-none text-white">
                  {notifUnread > 99 ? "99+" : notifUnread}
                </span>
              ) : null}
            </span>
            <span className="pr-0.5">Notifications</span>
          </NavLink>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
