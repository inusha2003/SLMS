const jwt = require("jsonwebtoken");

const DEFAULT_TOKEN_TTL = "7d";

function getTokenSecret() {
  return String(process.env.JWT_SECRET || process.env.AUTH_TOKEN_SECRET || "").trim();
}

function issueAuthToken(user) {
  const secret = getTokenSecret() || "slms-dev-secret";
  return jwt.sign(
    {
      userId: String(user._id),
      role: String(user.role || "Student"),
      email: String(user.email || ""),
    },
    secret,
    { expiresIn: DEFAULT_TOKEN_TTL },
  );
}

function verifyAuthToken(token) {
  const secret = getTokenSecret() || "slms-dev-secret";
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret);
    const userId = decoded?.userId || decoded?.sub;
    const role = decoded?.role;
    if (!userId || !role) return null;
    return {
      ...decoded,
      sub: String(userId),
      userId: String(userId),
      role: String(role),
      email: String(decoded?.email || ""),
    };
  } catch {
    return null;
  }
}

function readBearerToken(req) {
  const header = req.header("authorization") || req.header("Authorization") || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

module.exports = {
  issueAuthToken,
  verifyAuthToken,
  readBearerToken,
};
