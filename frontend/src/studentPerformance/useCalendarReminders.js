import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  repeatIntervalMinutes,
  offsetReminderLabel,
} from "./studentCalendarUtils.js";

const LOG_KEY = "slms_calendar_reminder_log_v2";

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function saveLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

/**
 * @param {Array<{ id: string, startISO: string, title: string, reminderOffsetMinutes: number[], repeatMode: string }>} events
 */
export function useCalendarReminders(events) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const tick = () => {
      const list = eventsRef.current || [];
      const now = Date.now();
      const log = loadLog();
      let changed = false;

      for (const ev of list) {
        const start = new Date(ev.startISO).getTime();
        if (Number.isNaN(start)) continue;
        if (now >= start) continue;

        const offsets = Array.isArray(ev.reminderOffsetMinutes)
          ? ev.reminderOffsetMinutes
          : [];
        const repeatMin = repeatIntervalMinutes(ev.repeatMode || "once");

        for (const offMin of offsets) {
          const triggerAt = start - offMin * 60 * 1000;
          if (now < triggerAt) continue;

          const key = `${ev.id}:${offMin}`;
          const lastStr = log[key];
          const last = lastStr ? new Date(lastStr).getTime() : 0;

          const fire = () => {
            const label = offsetReminderLabel(offMin);
            toast.success(`Reminder: ${ev.title} (${label})`, {
              duration: 6500,
            });
            log[key] = new Date().toISOString();
            changed = true;
          };

          if (repeatMin <= 0) {
            if (!lastStr) {
              fire();
            }
          } else if (!lastStr) {
            fire();
          } else if (now - last >= repeatMin * 60 * 1000) {
            fire();
          }
        }
      }

      if (changed) saveLog(log);
    };

    tick();
    const id = window.setInterval(tick, 45_000);
    return () => window.clearInterval(id);
  }, []);
}
