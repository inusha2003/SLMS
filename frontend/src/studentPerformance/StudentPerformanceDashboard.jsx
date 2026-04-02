import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../context/MAuthContext";
import { getCalendarUserKey } from "./calendarStorage.js";

const MANUAL_GPA_STORAGE = "slms_performance_manual_gpa_v1";

const DEMO_PERFORMANCE_PAYLOAD = {
  overall: { avgPercentage: 78.4, attemptCount: 12 },
  bySemester: [
    { semester: "Semester 1", avgPercentage: 74.2, attemptCount: 4 },
    { semester: "Semester 2", avgPercentage: 79.6, attemptCount: 4 },
    { semester: "Semester 3", avgPercentage: 81.3, attemptCount: 4 },
  ],
  skillRadar: [
    { name: "DSA", value: 84 },
    { name: "DBMS", value: 81 },
    { name: "OOP", value: 78 },
    { name: "Networks", value: 75 },
    { name: "Maths", value: 72 },
  ],
  subjectPerformance: [
    { subject: "Data Structures & Algorithms", avgPercentage: 84.1, attemptCount: 3 },
    { subject: "Database Management Systems", avgPercentage: 81.7, attemptCount: 2 },
    { subject: "Object Oriented Programming", avgPercentage: 78.4, attemptCount: 2 },
    { subject: "Computer Networks", avgPercentage: 75.2, attemptCount: 2 },
    { subject: "Mathematics for Computing", avgPercentage: 72.9, attemptCount: 3 },
  ],
};

function loadManualGpa(userKey) {
  try {
    const raw = localStorage.getItem(`${MANUAL_GPA_STORAGE}_${userKey}`);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  } catch {
    return null;
  }
}

function saveManualGpa(userKey, value) {
  const key = `${MANUAL_GPA_STORAGE}_${userKey}`;
  if (value == null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, String(value));
}

function clamp100(n) {
  return Math.max(0, Math.min(100, Number(n) || 0));
}

function KpiCard({ label, value, hint, action }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tabular-nums tracking-tight text-white">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export default function StudentPerformanceDashboard() {
  const { loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [manualGpa, setManualGpa] = useState(null);
  const [gpaModalOpen, setGpaModalOpen] = useState(false);
  const [gpaDraft, setGpaDraft] = useState("");

  const perfUserKey = useMemo(
    () => getCalendarUserKey(user?.id, user?.email),
    [user?.id, user?.email],
  );

  useEffect(() => {
    setManualGpa(loadManualGpa(perfUserKey));
  }, [perfUserKey]);

  const openGpaModal = useCallback(() => {
    setGpaDraft(
      manualGpa != null ? String(manualGpa) : "",
    );
    setGpaModalOpen(true);
  }, [manualGpa]);

  const closeGpaModal = useCallback(() => {
    setGpaModalOpen(false);
    setGpaDraft("");
  }, []);

  const saveGpaFromModal = useCallback(() => {
    const raw = String(gpaDraft).trim();
    if (!raw) {
      saveManualGpa(perfUserKey, null);
      setManualGpa(null);
      closeGpaModal();
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 10) return;
    const rounded = Math.round(n * 100) / 100;
    saveManualGpa(perfUserKey, rounded);
    setManualGpa(rounded);
    closeGpaModal();
  }, [gpaDraft, perfUserKey, closeGpaModal]);

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
  const hasRealData =
    (payload?.subjectPerformance?.length || 0) > 0 ||
    (payload?.overall?.attemptCount || 0) > 0;
  // If there are no records yet, show demo data so the UI isn't empty.
  const useDemo = !hasRealData;
  const displayPayload = useDemo ? DEMO_PERFORMANCE_PAYLOAD : payload;
  const displaySubjectPerformance = displayPayload?.subjectPerformance || [];
  const displayOverall = displayPayload?.overall || null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Student performance
          </h1>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            Student hub
          </span>
        </div>
        <div className="max-w-2xl space-y-3">
          <p className="text-sm leading-relaxed text-slate-400">
            Subject-wise marks, GPA / average, and analytics — updates live when marks
            or goals change.
          </p>
          {guestPreview && (
            <p className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs text-violet-200/90">
              Preview — you are not signed in. Sign in as a student to load your real
              marks from the server.
            </p>
          )}
          {useDemo && (
            <p className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-100/90">
              Showing demo performance data for UI preview (no records found yet).
            </p>
          )}
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
        </div>
      )}

      {!loading && error && !useDemo && (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!loading && (!error || useDemo) && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Average mark"
              value={
                displayOverall?.avgPercentage != null
                  ? (Math.round(Number(displayOverall.avgPercentage) * 10) / 10).toFixed(1)
                  : averageMark
              }
              hint="Across completed attempts"
            />
            <KpiCard
              label="GPA"
              value={
                manualGpa != null
                  ? manualGpa.toFixed(2)
                  : "—"
              }
              hint="Saved on this device — add your current GPA to track it here."
              action={
                <button
                  type="button"
                  onClick={openGpaModal}
                  className="w-full rounded-xl border border-violet-500/35 bg-violet-500/15 px-3 py-2.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/25"
                >
                  {manualGpa != null ? "Update GPA" : "Add GPA"}
                </button>
              }
            />
            <KpiCard
              label="Subjects tracked"
              value={String(displaySubjectPerformance.length)}
              hint="Distinct subjects with attempts"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 lg:col-span-3 sm:p-6">
              <h2 className="text-sm font-semibold text-white">Marks by subject</h2>
              <p className="mt-1 text-xs text-slate-500">
                Average percentage per subject
              </p>
              <div className="mt-6 h-[280px] w-full">
                {displaySubjectPerformance.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-4 text-center text-sm text-slate-500">
                    {guestPreview
                      ? "Sign in to load your marks — or complete an exam once you are logged in."
                      : "No marks yet — complete an exam to see this chart."}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        useDemo
                          ? displaySubjectPerformance.map((s) => ({
                              subject:
                                String(s.subject || "—").length > 14
                                  ? `${String(s.subject).slice(0, 12)}…`
                                  : String(s.subject || "—"),
                              fullSubject: String(s.subject || "—"),
                              marks: clamp100(s.avgPercentage),
                              attempts: s.attemptCount ?? 0,
                            }))
                          : barData
                      }
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
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

            <section className="rounded-2xl border border-white/[0.06] bg-[#0f1624] p-5 shadow-lg shadow-black/20 lg:col-span-2 sm:p-6">
              <h2 className="text-sm font-semibold text-white">Subject summary</h2>
              <p className="mt-1 text-xs text-slate-500">Attempts and averages</p>
              <div className="mt-4 max-h-[320px] space-y-2 overflow-auto pr-1">
                {displaySubjectPerformance.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-[#0a0f1a] px-3 py-8 text-center text-sm text-slate-500">
                    {guestPreview
                      ? "Sign in to see subjects here."
                      : "No subjects yet."}
                  </p>
                ) : (
                  displaySubjectPerformance.map((row) => (
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

      {gpaModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gpa-modal-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <h2
              id="gpa-modal-title"
              className="text-lg font-bold text-white"
            >
              Add GPA
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Enter your GPA (0 – 10). Leave empty and save to clear. Stored only
              in this browser.
            </p>
            <input
              type="number"
              min={0}
              max={10}
              step={0.01}
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-3 text-sm text-white outline-none focus:border-violet-500/50"
              placeholder="e.g. 3.45"
              value={gpaDraft}
              onChange={(e) => setGpaDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveGpaFromModal();
              }}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={closeGpaModal}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  saveManualGpa(perfUserKey, null);
                  setManualGpa(null);
                  closeGpaModal();
                }}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={saveGpaFromModal}
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
