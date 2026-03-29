import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getAuthToken } from "../lib/session.js";
import { useAuth } from "../context/AuthContext";

function clamp100(n) {
  return Math.max(0, Math.min(100, Number(n) || 0));
}

function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tabular-nums tracking-tight text-white">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export default function StudentPerformanceDashboard() {
  const { loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setLoading(true);
      return () => {
        cancelled = true;
      };
    }

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setPayload(null);
      setError("");
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl("/api/assessment/performance/dashboard"), {
          headers: getAuthHeaders(),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            if (!cancelled) {
              setPayload(null);
              setError("");
            }
            return;
          }
          throw new Error(json.message || "Could not load performance data.");
        }
        if (!cancelled) setPayload(json);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Something went wrong.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  const subjectPerformance = payload?.subjectPerformance || [];
  const overall = payload?.overall || null;

  const averageMark =
    overall?.avgPercentage != null
      ? (Math.round(Number(overall.avgPercentage) * 10) / 10).toFixed(1)
      : "0.0";

  const barData = useMemo(
    () =>
      subjectPerformance.map((s) => ({
        subject:
          String(s.subject || "—").length > 14
            ? `${String(s.subject).slice(0, 12)}…`
            : String(s.subject || "—"),
        fullSubject: String(s.subject || "—"),
        marks: clamp100(s.avgPercentage),
        attempts: s.attemptCount ?? 0,
      })),
    [subjectPerformance],
  );

  const guestPreview = !authLoading && !getAuthToken();

  return (
    <div className="p-8 lg:p-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Student performance
          </h1>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            Student hub
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Subject-wise marks, GPA / average, and analytics — updates live when marks
          or goals change.
        </p>
        {guestPreview && (
          <p className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs text-violet-200/90">
            Preview — you are not signed in. Sign in as a student to load your real
            marks from the server.
          </p>
        )}
      </header>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Average mark"
              value={averageMark}
              hint="Across completed attempts"
            />
            <KpiCard
              label="GPA (when recorded)"
              value="—"
              hint="Shown when your records include GPA"
            />
            <KpiCard
              label="Subjects tracked"
              value={String(subjectPerformance.length)}
              hint="Distinct subjects with attempts"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 lg:col-span-3">
              <h2 className="text-sm font-semibold text-white">Marks by subject</h2>
              <p className="mt-1 text-xs text-slate-500">
                Average percentage per subject
              </p>
              <div className="mt-6 h-[280px] w-full">
                {barData.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-4 text-center text-sm text-slate-500">
                    {guestPreview
                      ? "Sign in to load your marks — or complete an exam once you are logged in."
                      : "No marks yet — complete an exam to see this chart."}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                      <XAxis
                        dataKey="subject"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#e2e8f0" }}
                        formatter={(value) => [`${value}%`, "Average"]}
                        labelFormatter={(_, items) =>
                          items?.[0]?.payload?.fullSubject || ""
                        }
                      />
                      <Bar
                        dataKey="marks"
                        name="Avg %"
                        fill="url(#spBarGrad)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-white">Subject summary</h2>
              <p className="mt-1 text-xs text-slate-500">Attempts and averages</p>
              <div className="mt-4 max-h-[320px] space-y-2 overflow-auto pr-1">
                {subjectPerformance.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-3 py-8 text-center text-sm text-slate-500">
                    {guestPreview
                      ? "Sign in to see subjects here."
                      : "No subjects yet."}
                  </p>
                ) : (
                  subjectPerformance.map((row) => (
                    <div
                      key={String(row.subject)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-[#0a0f1a] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {row.subject}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {row.attemptCount ?? 0} attempt
                          {(row.attemptCount ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-violet-300">
                        {clamp100(row.avgPercentage).toFixed(1)}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
