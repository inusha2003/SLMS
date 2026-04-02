const AUTH_KEY = "auth";
const LMS_TOKEN_KEY = "lms_token";
const LMS_USER_KEY = "lms_user";

const safeJsonParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const parseSessionAuth = () => safeJsonParse(sessionStorage.getItem(AUTH_KEY));

const parseLmsUser = () => safeJsonParse(localStorage.getItem(LMS_USER_KEY));

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Token used by `api` axios client and fetch helpers (localStorage JWT). */
export const getAuthToken = () => {
  const fromLs = localStorage.getItem(LMS_TOKEN_KEY);
  if (fromLs) return fromLs;
  const auth = parseSessionAuth();
  return auth?.token ?? null;
};

/** Headers for `fetch`; merges optional extra headers (e.g. Content-Type). */
export const getAuthHeaders = (extra = {}) => {
  const headers = { ...extra };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const isLoggedIn = () => Boolean(getAuthToken());

export const getStoredUserRole = () => {
  const u = parseLmsUser();
  if (u?.role) return u.role;
  const auth = parseSessionAuth();
  if (auth?.role) return auth.role;
  const payload = decodeJwtPayload(getAuthToken());
  return payload?.role ?? "";
};

export const getStoredUserSemester = () => {
  const u = parseLmsUser();
  if (u != null && u.semester != null && u.semester !== "")
    return String(u.semester);
  const auth = parseSessionAuth();
  if (auth != null && auth.semester != null && auth.semester !== "")
    return String(auth.semester);
  return "";
};

export const getStoredUserName = () => {
  const u = parseLmsUser();
  if (u) {
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    if (name) return name;
    if (u.email) return u.email;
  }
  const auth = parseSessionAuth();
  if (auth?.name) return auth.name;
  if (auth?.email) return auth.email;
  return "";
};

export const isAdminLoggedIn = () => {
  try {
    const auth = parseSessionAuth();
    if (auth?.isAdmin === true) return true;
    if (auth?.role === "admin" || auth?.role === "Admin") return true;
  } catch {
    /* ignore */
  }
  const role = getStoredUserRole();
  if (role === "Admin") return true;
  const payload = decodeJwtPayload(getAuthToken());
  return payload?.role === "Admin";
};

export const clearAuthSession = () => {
  localStorage.removeItem(LMS_TOKEN_KEY);
  localStorage.removeItem(LMS_USER_KEY);
  sessionStorage.removeItem(AUTH_KEY);
};

export const getSessionToken = () => getAuthToken();

export const isAuthenticated = () => isLoggedIn();

export const getCurrentUser = () => parseLmsUser() || parseSessionAuth();

export const clearSession = () => {
  sessionStorage.removeItem(AUTH_KEY);
};
