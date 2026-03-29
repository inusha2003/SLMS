import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  Bell,
  Target,
} from "lucide-react";

export default function StudentHubLayout({ hubBase = "/performance" }) {
  const nav = [
    { to: "/performance", end: true, label: "Performance", Icon: BarChart3 },
    { to: `${hubBase}/calendar`, end: true, label: "Calendar", Icon: Calendar },
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

      <div className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
