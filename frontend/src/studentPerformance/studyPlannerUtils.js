export const TASK_TYPES = {
  exam_prep: "exam_prep",
  assignment: "assignment",
  deadline: "deadline",
  revision: "revision",
  goal_support: "goal_support",
};

function daysUntil(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const now = Date.now();
  return Math.ceil((t - now) / (24 * 60 * 60 * 1000));
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function computePriorityScore({
  taskType,
  dueISO,
  subjectMark,
  linkedToGoal,
}) {
  let score = 0;
  const d = daysUntil(dueISO);

  // Deadlines
  if (taskType === TASK_TYPES.assignment || taskType === TASK_TYPES.deadline) {
    if (d != null && d <= 2) score += 50;
  }
  // Exams
  if (taskType === TASK_TYPES.exam_prep) {
    if (d != null && d <= 5) score += 40;
  }

  const mark = subjectMark == null ? null : Number(subjectMark);
  if (mark != null && Number.isFinite(mark)) {
    if (mark < 50) score += 30;
    else if (mark < 65) score += 20;
  }

  if (linkedToGoal) score += 10;
  return score;
}

export function suggestedHoursForTask(task) {
  const base =
    task.taskType === TASK_TYPES.assignment
      ? 1.5
      : task.taskType === TASK_TYPES.exam_prep
        ? 2
        : task.taskType === TASK_TYPES.deadline
          ? 1
          : task.taskType === TASK_TYPES.revision
            ? 1.5
            : 1;
  // higher priority → slightly more time (capped)
  const bump = clamp((Number(task.priorityScore) || 0) / 100, 0, 0.75);
  return Math.round((base + bump) * 2) / 2; // 0.5h increments
}

export function buildPlannerTasks({
  calendarEvents,
  performanceSubjects,
  goals,
}) {
  const perfMap = {};
  for (const s of performanceSubjects || []) {
    const k = String(s.subject || "").trim();
    if (!k) continue;
    const v = Number(s.avgPercentage);
    if (!Number.isFinite(v)) continue;
    perfMap[k.toLowerCase()] = { subject: k, mark: Math.round(v * 10) / 10 };
  }

  const goalSubjects = new Set(
    (goals || [])
      .filter((g) => String(g.type) === "subject_marks" && g.subjectName)
      .map((g) => String(g.subjectName).trim().toLowerCase()),
  );

  const tasks = [];

  // Calendar-driven tasks
  for (const ev of calendarEvents || []) {
    const dueISO = ev.startISO;
    const title = String(ev.title || "").trim() || "Untitled event";
    const cat = String(ev.category || "other");

    let taskType = TASK_TYPES.deadline;
    if (cat === "exam") taskType = TASK_TYPES.exam_prep;
    else if (cat === "assignment") taskType = TASK_TYPES.assignment;
    else if (cat === "deadline") taskType = TASK_TYPES.deadline;

    // try to match subject by substring
    let matched = null;
    const lowTitle = title.toLowerCase();
    for (const key of Object.keys(perfMap)) {
      if (lowTitle.includes(key)) {
        matched = perfMap[key];
        break;
      }
    }
    const subject = matched?.subject || null;
    const subjectMark = matched?.mark ?? null;
    const linkedToGoal = subject ? goalSubjects.has(subject.toLowerCase()) : false;
    const priorityScore = computePriorityScore({
      taskType,
      dueISO,
      subjectMark,
      linkedToGoal,
    });

    tasks.push({
      id: `cal_${ev.id}`,
      title,
      taskType,
      subject,
      dueISO,
      subjectMark,
      linkedToGoal,
      priorityScore,
      reason: [
        taskType === TASK_TYPES.assignment ? "Assignment due" : null,
        taskType === TASK_TYPES.exam_prep ? "Exam coming soon" : null,
        taskType === TASK_TYPES.deadline ? "Deadline coming soon" : null,
        subjectMark != null ? `Mark: ${subjectMark.toFixed(1)}%` : null,
        linkedToGoal ? "Linked goal" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  // Weak-subject revision tasks (no due date)
  for (const k of Object.keys(perfMap)) {
    const { subject, mark } = perfMap[k];
    if (mark >= 65) continue;
    const linkedToGoal = goalSubjects.has(subject.toLowerCase());
    const priorityScore = computePriorityScore({
      taskType: TASK_TYPES.revision,
      dueISO: null,
      subjectMark: mark,
      linkedToGoal,
    });
    tasks.push({
      id: `rev_${subject}`,
      title: `${subject} revision`,
      taskType: TASK_TYPES.revision,
      subject,
      dueISO: null,
      subjectMark: mark,
      linkedToGoal,
      priorityScore,
      reason: [
        mark < 50 ? "Low mark (<50)" : "Needs improvement (<65)",
        linkedToGoal ? "Linked goal" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  // Deduplicate by id and sort
  const uniq = new Map();
  for (const t of tasks) uniq.set(t.id, t);
  return [...uniq.values()].sort((a, b) => b.priorityScore - a.priorityScore);
}

export function generateStudyPlan({ tasks, hoursPerDay }) {
  const perDay = clamp(Number(hoursPerDay) || 3, 0.5, 12);
  const picked = tasks.map((t) => ({
    ...t,
    suggestedHours: suggestedHoursForTask(t),
  }));

  const today = [];
  let remaining = perDay;
  for (const t of picked) {
    if (remaining <= 0) break;
    const h = Math.min(t.suggestedHours, remaining);
    if (h < 0.25) continue;
    today.push({ ...t, suggestedHours: Math.round(h * 2) / 2 });
    remaining -= h;
  }

  // week plan: simple spread, 7 days including today
  const week = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const start = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const name = dayNames[(d.getDay() + 6) % 7];
    week.push({ day: name, dateISO: d.toISOString(), items: [], limitHours: perDay });
  }

  // Assign remaining tasks round-robin with per-day caps
  const usedIdsToday = new Set(today.map((t) => t.id));
  const rest = picked.filter((t) => !usedIdsToday.has(t.id));
  let wi = 0;
  for (const t of rest) {
    for (let tries = 0; tries < week.length; tries += 1) {
      const idx = (wi + tries) % week.length;
      const day = week[idx];
      const used = day.items.reduce((sum, x) => sum + x.suggestedHours, 0);
      if (used + t.suggestedHours <= day.limitHours + 0.01) {
        day.items.push(t);
        wi = idx + 1;
        break;
      }
    }
  }

  const focus = picked.find((t) => t.subject)?.subject || picked[0]?.subject || "—";

  return {
    hoursPerDay: perDay,
    focusSubject: focus,
    highPriority: picked.slice(0, 6),
    today,
    week,
  };
}

