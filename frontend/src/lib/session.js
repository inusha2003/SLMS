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

function parseOverallSemester(userLike) {
  if (!userLike || typeof userLike !== "object") return "";

  const directSemester = Number(userLike.semester);
  if (Number.isFinite(directSemester) && directSemester >= 1) {
    return String(Math.min(8, Math.floor(directSemester)));
  }

  const academicYearLabel = String(userLike.academicYear || "").trim().toLowerCase();
  const semesterLabel = String(userLike.semester || "").trim().toLowerCase();

  const yearMatch = academicYearLabel.match(/^(\d+)/);
  const semesterMatch = semesterLabel.match(/^(\d+)/);

  if (!yearMatch || !semesterMatch) return "";

  const year = Number(yearMatch[1]);
  const semesterOfYear = Number(semesterMatch[1]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(semesterOfYear) ||
    year < 1 ||
    year > 4 ||
    ![1, 2].includes(semesterOfYear)
  ) {
    return "";
  }

  return String((year - 1) * 2 + semesterOfYear);
}

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
  const normalizedUserSemester = parseOverallSemester(u);
  if (normalizedUserSemester) return normalizedUserSemester;
  const auth = parseSessionAuth();
  const normalizedAuthSemester = parseOverallSemester(auth);
  if (normalizedAuthSemester) return normalizedAuthSemester;
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
