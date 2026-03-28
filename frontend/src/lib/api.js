/**
 * Backend base URL (no trailing slash).
 * - Default: http://localhost:5000
 * - If VITE_API_URL ends with /api, that suffix is stripped (prevents /api/api/... 404s)
 * - Set VITE_API_URL= (empty) to use relative /api/... with Vite dev proxy (see vite.config.js)
 */
function normalizeApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  const fallback = "http://localhost:5000";
  // Missing env → direct backend URL
  if (raw === undefined || raw === null) return fallback;
  const s = String(raw).trim();
  // Explicit empty → relative `/api/...` (Vite dev proxy to :5000)
  if (s === "") return "";
  let base = s.replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4).replace(/\/+$/, "");
  }
  return base || fallback;
}

export const API_BASE = normalizeApiBase();

/** Build request URL: apiUrl("/api/mcq-bank") */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
