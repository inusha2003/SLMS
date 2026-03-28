const crypto = require("crypto");

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function getTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || "slms-dev-secret";
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function signPayload(payloadPart) {
  return crypto
    .createHmac("sha256", getTokenSecret())
    .update(payloadPart)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function issueAuthToken(user) {
  const payload = {
    sub: String(user._id),
    role: String(user.role),
    email: String(user.email || ""),
    exp: Math.floor(Date.now() / 1000) + DEFAULT_TOKEN_TTL_SECONDS,
  };

  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signaturePart = signPayload(payloadPart);
  return `${payloadPart}.${signaturePart}`;
}

function verifyAuthToken(token) {
  const [payloadPart, signaturePart] = String(token || "").split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = signPayload(payloadPart);
  const actualBuffer = Buffer.from(signaturePart);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart));
    if (!payload?.sub || !payload?.role || !payload?.exp) return null;
    if (Number(payload.exp) <= Math.floor(Date.now() / 1000)) return null;
    return payload;
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
