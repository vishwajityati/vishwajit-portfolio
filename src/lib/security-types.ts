/**
 * Shape of the security posture payload returned by `GET /api/admin/security`.
 * Kept out of the route file so client components can import the types without
 * pulling server-only code into the browser bundle.
 */

export type PostureStatus = "pass" | "warn" | "fail";

export interface PostureCheck {
  id: string;
  label: string;
  status: PostureStatus;
  detail: string;
  remediation?: string;
}

export interface RateLimitSnapshot {
  windowMinutes: number;
  loginMaxAttempts: number;
  globalMaxAttempts: number;
  contactMaxAttempts: number;
  trackedAddresses: number;
  activeWindows: number;
  throttledAddresses: number;
  recordedFailures: number;
  lastAttemptAt: string | null;
}

export interface SecurityOverview {
  score: number;
  checks: PostureCheck[];
  account: {
    email: string;
    totpEnabled: boolean;
    sessionVersion: number;
    passwordAlgorithm: string | null;
    passwordRounds: number | null;
  };
  database: {
    connected: boolean;
    host: string | null;
    latencyMs: number | null;
    portfolioRecords: number | null;
    storedMessages: number | null;
  };
  rateLimits: RateLimitSnapshot | null;
  session: {
    cookieName: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
    ttlHours: number;
    trustedProxyHeaders: boolean;
  };
  email: { configured: boolean; missingSettings: string[] };
  checkedAt: string;
}
