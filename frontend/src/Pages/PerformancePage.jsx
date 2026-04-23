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
import { Link } from "react-router-dom";
import { BookOpen, Sparkles, Target, Trophy } from "lucide-react";
import { apiUrl } from "../lib/api.js";
import { getAuthHeaders, getAuthToken, getStoredUserRole } from "../lib/session.js";

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

function formatScore(value) {
  const num = Number(value) || 0;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatSubmittedAt(value) {
  if (!value) return "Recently completed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently completed";
  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [adminNotice, setAdminNotice] = useState("");

  const authToken = useMemo(() => getAuthToken(), []);
  const storedRole = useMemo(() => getStoredUserRole(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      setAdminNotice("");
      try {
        if (!authToken) {
          throw new Error("Please log in as a student to view performance.");
        }
        if (storedRole === "Admin") {
          setData(null);
          setAdminNotice(
            "This dashboard shows each student's own exam results. Sign in with a student account (or open the student hub under Performance) to see live charts."
          );
          return;
        }
        const res = await fetch(apiUrl("/api/assessment/performance/dashboard"), {
          headers: getAuthHeaders(),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error(json.message || "You need a student account to view this dashboard.");
        }
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
  }, [authToken, storedRole]);

  const subjectPerformance = data?.subjectPerformance || [];
  const skillRadar = data?.skillRadar || [];
  const recentAttempts = data?.recentAttempts || [];
  const overall = data?.overall || null;
  const summary = data?.summary || null;
  const hasAttempts = (overall?.attemptCount || 0) > 0;
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

      {adminNotice && !loading && (
        <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          {adminNotice}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {summary && hasAttempts && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="slms-card-soft rounded-2xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Total attempts
                </p>
                <p className="mt-1 text-2xl font-bold text-white">{summary.totalAttempts ?? 0}</p>
                <p className="mt-1 text-xs slms-muted">Submitted exam papers</p>
              </div>
              <div className="slms-card-soft rounded-2xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Distinct exams
                </p>
                <p className="mt-1 text-2xl font-bold text-white">{summary.uniqueExamCount ?? 0}</p>
                <p className="mt-1 text-xs slms-muted">Different exams attempted</p>
              </div>
              <div className="slms-card-soft rounded-2xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Best score
                </p>
                <p className="mt-1 text-2xl font-bold text-cyan-200">
                  {clamp100(summary.bestPercentage)}%
                </p>
                <p className="mt-1 text-xs slms-muted">Highest percentage in one attempt</p>
              </div>
              <div className="slms-card-soft rounded-2xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Last activity
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatSubmittedAt(summary.lastSubmittedAt)}
                </p>
                <p className="mt-1 text-xs slms-muted">Most recent submission</p>
              </div>
            </div>
          )}

          {(summary?.strongestSubject || summary?.weakestSubject) && hasAttempts && (
            <div className="grid gap-3 md:grid-cols-2">
              {summary.strongestSubject && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                  <span className="font-semibold text-emerald-200">Strongest: </span>
                  {summary.strongestSubject.subject} —{" "}
                  {clamp100(summary.strongestSubject.avgPercentage)}% avg
                </div>
              )}
              {summary.weakestSubject && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-50">
                  <span className="font-semibold text-orange-200">Needs focus: </span>
                  {summary.weakestSubject.subject} —{" "}
                  {clamp100(summary.weakestSubject.avgPercentage)}% avg
                </div>
              )}
            </div>
          )}

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
                {hasAttempts ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={semesterChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#274059" />
                      <XAxis dataKey="semester" tick={{ fill: "#8fa7c2" }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#8fa7c2" }} />
                      <Tooltip
                        contentStyle={{ background: "#0d1728", border: "1px solid rgba(148,163,184,0.15)" }}
                        formatter={(value, _name, props) => {
                          const attempts = props?.payload?.attemptCount;
                          const suffix =
                            attempts != null ? ` (${attempts} attempt${attempts === 1 ? "" : "s"})` : "";
                          return [`${clamp100(value)}%${suffix}`, "Avg %"];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="avgPercentage" name="Avg %" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
                    <BookOpen className="mb-3 h-10 w-10 text-cyan-400/70" />
                    <p className="text-sm text-slate-200">No exam results yet</p>
                    <p className="mt-2 max-w-md text-xs slms-muted">
                      Charts fill automatically from timed exams you complete (Exam Schedule). MCQ Bank
                      practice sets are not counted here.
                    </p>
                    <Link
                      to="/ai-tools/exams"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Go to Exams
                    </Link>
                  </div>
                )}
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
                      Complete a few timed exams; subject averages will populate this radar.
                    </p>
                    <Link
                      to="/ai-tools/exams"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/10"
                    >
                      Browse exams
                    </Link>
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
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

            <div className="slms-card rounded-[26px] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent Exam Marks</h2>
                  <p className="text-xs slms-muted">
                    Latest submitted exams with raw marks and percentages
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                  {recentAttempts.length} Recent
                </span>
              </div>

              {recentAttempts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center">
                  <p className="text-sm text-slate-300">No exam marks yet.</p>
                  <p className="mt-2 text-xs slms-muted">
                    Once you submit exams, your real marks will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => {
                    const pct = clamp100(attempt.percentage);
                    return (
                      <div
                        key={attempt.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {attempt.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {attempt.subject}
                              {attempt.semester > 0 ? ` • Semester ${attempt.semester}` : ""}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              {formatSubmittedAt(attempt.submittedAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-cyan-200">
                              {formatScore(attempt.score)} / {formatScore(attempt.totalMarks)}
                            </div>
                            <div className="mt-1 text-xs font-medium text-orange-200">
                              {pct}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
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
        </div>
      )}
    </div>
  );
}

