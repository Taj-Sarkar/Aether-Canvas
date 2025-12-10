import crypto from "crypto";

const secret = process.env.AUTH_SECRET || "";
const defaultUser = {
  email: process.env.AUTH_EMAIL || "demo@example.com",
  password: process.env.AUTH_PASSWORD || "password123",
  name: "Demo User",
};

const sign = (data: string) =>
  crypto.createHmac("sha256", secret || "fallback-secret").update(data).digest("hex");

export const createSessionToken = (email: string) => {
  const payload = JSON.stringify({ email, ts: Date.now() });
  const sig = sign(payload);
  return Buffer.from(`${payload}::${sig}`).toString("base64");
};

export const verifySessionToken = (token: string) => {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [payload, sig] = decoded.split("::");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const parsed = JSON.parse(payload);
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
};

export const authenticateUser = (email: string, password: string) => {
  if (!email || !password) return false;
  return email === defaultUser.email && password === defaultUser.password;
};

export const getDefaultUser = () => ({ email: defaultUser.email, name: defaultUser.name });

