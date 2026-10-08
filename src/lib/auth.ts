import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSession {
  adminId?: number;
  pendingAdminId?: number;
  pendingTotpUntil?: number;
  /** Admin.sessionVersion at the time this session was authenticated. */
  sessionVersion?: number;
}

export const sessionOptions: SessionOptions = {
  cookieName: "portfolio.sid",
  password: process.env.SESSION_SECRET ?? "",
  ttl: 60 * 60 * 8,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  }
};

export async function getAdminSession() {
  if (
    typeof sessionOptions.password !== "string"
    || sessionOptions.password.length < 32
    || sessionOptions.password.includes("replace-this")
  ) {
    throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
  }
  return getIronSession<AdminSession>(await cookies(), sessionOptions);
}
