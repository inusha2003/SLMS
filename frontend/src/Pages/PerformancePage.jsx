import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, Target, Trophy } from "lucide-react";
import { API_BASE } from "../lib/api.js";
import { getAuthHeaders, getAuthToken } from "../lib/session.js";

function clamp100(n) {
  return Math.max(0, Math.min(100, Number(n) || 0));
}

function formatRadarLabel(value) {
  const label = String(value || "").replace(/\s*-\s*[^-]+$/, "").trim();
  if (label.length <= 18) return label;
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return `${label.slice(0, 18)}...`;
  return words.slice(0, 2).join(" ");
}

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const authToken = useMemo(() => getAuthToken(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (!authToken) {
          throw new Error("Please log in as a student to view performance.");
        }
        const res = await fetch(`${API_BASE}/api/assessment/performance/dashboard`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Failed to load performance.");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error");
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const subjectPerformance = data?.subjectPerformance || [];
  const skillRadar = data?.skillRadar || [];
  const overall = data?.overall || null;
  const radarSubjects = useMemo(
    () =>
      skillRadar
        .map((item) => ({
          ...item,
          value: clamp100(item.value),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    [skillRadar],
  );
  const strongestSkill = radarSubjects[0] || null;

  const semesterChartData = useMemo(() => {
    const sems = data?.bySemester || [];
    // Ensure semesters 1..8 appear consistently (as empty).
    const map = new Map(sems.map((s) => [Number(s.semester), s]));
    return Array.from({ length: 8 }, (_, i) => {
      const sem = i + 1;
      const row = map.get(sem);
      return {
        semester: String(sem),
        avgPercentage: row ? clamp100(row.avgPercentage) : 0,
        attemptCount: row ? row.attemptCount : 0,
      };
    });
  }, [data]);

  return (
    <div className="slms-page min-h-full p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="slms-section-title text-3xl font-bold text-white">Performance</h1>
        <p className="mt-1 text-sm slms-muted">
          Performance by semester, skill radar, and subject progress.
        </p>
      </header>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="slms-card rounded-[26px] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Performance by Semester</h2>
                  <p className="text-xs slms-muted">
                    Average percentage across attempts
                  </p>
                </div>
                {overall && (
                  <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                    Overall: {clamp100(overall.avgPercentage)}%
                  </span>
                )}
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={semesterChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#274059" />
                    <XAxis dataKey="semester" tick={{ fill: "#8fa7c2" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#8fa7c2" }} />
                    <Tooltip
                      contentStyle={{ background: "#0d1728", border: "1px solid rgba(148,163,184,0.15)" }}
                      formatter={(value) => [`${clamp100(value)}%`, "Avg %"]}
                    />
                    <Legend />
                    <Bar dataKey="avgPercentage" name="Avg %" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="slms-card relative overflow-hidden rounded-[26px] border border-cyan-400/12 p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.14),transparent_36%)]" />
              <div className="relative z-10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                      <Sparkles className="h-3.5 w-3.5" />
                      Skill Radar
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">
                      Top subjects by average performance
                    </h2>
                    <p className="mt-1 text-xs slms-muted">
                      Best-performing subjects visualized on a cleaner radar view
                    </p>
                  </div>

                  <div className="grid min-w-[210px] grid-cols-2 gap-2">
                    <div className="col-span-2 overflow-hidden rounded-[22px] border border-cyan-400/16 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(56,189,248,0.06),rgba(251,146,60,0.14))] px-4 py-4 shadow-[0_16px_45px_rgba(2,12,27,0.3)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                            <Trophy className="h-3.5 w-3.5 text-orange-300" />
                            Top Skill
                          </div>
                          <div className="mt-3 text-base font-semibold leading-6 text-white">
                            {strongestSkill?.name || "No data"}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-300">
                            {strongestSkill
                              ? "This subject is currently your strongest performance area."
                              : "Take exams to unlock your strongest subject insight."}
                          </p>
                        </div>
                        <div className="shrink-0 rounded-2xl border border-white/10 bg-[#081523]/80 px-3 py-2 text-right">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            Score
                          </div>
                          <div className="mt-1 text-2xl font-black tracking-[-0.04em] text-cyan-200">
                            {strongestSkill ? `${strongestSkill.value}%` : "--"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-950/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-orange-400 shadow-[0_0_18px_rgba(56,189,248,0.35)]"
                          style={{ width: `${strongestSkill?.value || 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3">
                      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        <Target className="h-3.5 w-3.5 text-cyan-300" />
                        Tracked
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {radarSubjects.length} Subjects
                      </div>
                      <div className="mt-1 text-xs text-cyan-200">
                        Radar score range 0-100
                      </div>
                    </div>
                  </div>
                </div>

                {radarSubjects.length === 0 ? (
                  <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                    <p className="text-sm text-slate-300">No radar data yet.</p>
                    <p className="mt-2 text-xs slms-muted">
                      Complete a few exams and your strongest subjects will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px]">
                    <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#0c1728]/90 px-3 py-4">
                      <div className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 bg-cyan-300/5 blur-2xl" />
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="54%" outerRadius="68%" data={radarSubjects}>
                            <PolarGrid
                              gridType="polygon"
                              radialLines
                              stroke="rgba(111,168,220,0.24)"
                            />
                            <PolarAngleAxis
                              dataKey="name"
                              tickFormatter={formatRadarLabel}
                              tick={{ fill: "#b7c8dc", fontSize: 12 }}
                            />
                            <PolarRadiusAxis
                              domain={[0, 100]}
                              angle={90}
                              tick={{ fill: "#7f93ab", fontSize: 11 }}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "rgba(10, 20, 34, 0.96)",
                                border: "1px solid rgba(148,163,184,0.14)",
                                borderRadius: "16px",
                              }}
                              formatter={(value) => [`${clamp100(value)}%`, "Average"]}
                            />
                            <Radar
                              name="Average"
                              dataKey="value"
                              stroke="#22d3ee"
                              strokeWidth={2.5}
                              fill="url(#skillRadarFill)"
                              fillOpacity={1}
                            />
                            <defs>
                              <linearGradient id="skillRadarFill" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.34" />
                                <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#fb923c" stopOpacity="0.34" />
                              </linearGradient>
                            </defs>
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {radarSubjects.map((item, index) => (
                        <div
                          key={item.name}
                          className={[
                            "rounded-[20px] border px-4 py-3",
                            index === 0
                              ? "border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(255,255,255,0.03),rgba(251,146,60,0.1))]"
                              : "border-white/8 bg-white/[0.04]",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div
                                className={[
                                  "text-[11px] font-semibold uppercase tracking-[0.18em]",
                                  index === 0 ? "text-cyan-200" : "text-slate-400",
                                ].join(" ")}
                              >
                                {index === 0 ? "Best Match" : `Rank ${index + 1}`}
                              </div>
                              <div className="mt-1 text-sm font-semibold leading-5 text-white break-words">
                                {item.name}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-cyan-200">{item.value}%</div>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-orange-400"
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="slms-card rounded-[26px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Subject Performance</h2>
              <p className="text-xs slms-muted">Average percentage progress bars</p>
            </div>

            {subjectPerformance.length === 0 ? (
              <p className="text-sm slms-muted">
                No performance data found yet. Take an exam first.
              </p>
            ) : (
              <div className="space-y-4">
                {subjectPerformance.slice(0, 8).map((s) => {
                  const pct = clamp100(s.avgPercentage);
                  return (
                    <div key={s.subject} className="slms-card-soft rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">{s.subject}</div>
                          <div className="text-xs slms-muted">{s.attemptCount} attempts</div>
                        </div>
                        <div className="text-sm font-semibold text-cyan-200">{pct}%</div>
                      </div>
                      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-orange-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

