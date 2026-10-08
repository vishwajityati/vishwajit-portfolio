import { NextResponse } from "next/server";
import { getAdminSession, sessionOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/permissions";
import { getRateLimitSnapshot } from "@/lib/auth-rate-limit";
import { getContactEmailConfigurationStatus } from "@/lib/contact-email";
import { prisma } from "@/lib/prisma";
import { contentSecurityPolicyIsStrict, requiredSecurityHeaderKeys, securityHeaders } from "@/lib/security-headers";
import { MIN_ACCESS_CODE_LENGTH } from "@/lib/access-code";
import type { PostureCheck, SecurityOverview } from "@/lib/security-types";

export const dynamic = "force-dynamic";

/** Reads the bcrypt cost factor out of a stored hash without ever returning the hash. */
function readBcryptRounds(accessCodeHash: string): number | null {
  const match = /^\$2[aby]\$(\d{2})\$/.exec(accessCodeHash);
  if (!match) return null;
  // The pattern has a single capture group, so the cost factor is match[1].
  const rounds = Number(match[1]);
  return Number.isInteger(rounds) ? rounds : null;
}

/** Host only — credentials in DATABASE_URL are never echoed back to the browser. */
function readDatabaseHost(): string | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  try {
    return new URL(connectionString).hostname;
  } catch {
    return null;
  }
}

function scoreOf(checks: PostureCheck[]): number {
  if (checks.length === 0) return 0;
  const weight = { pass: 1, warn: 0.5, fail: 0 } as const;
  const total = checks.reduce((sum, check) => sum + weight[check.status], 0);
  return Math.round((total / checks.length) * 100);
}

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Please sign in to view security status." }, { status: 401 });
  }

  // Confirms the cookie presented by this very request matches the current policy.
  const session = await getAdminSession();

  const startedAt = Date.now();
  let admin: { email: string | null; totpEnabled: boolean; sessionVersion: number; accessCodeHash: string } | null = null;
  let portfolioRecords: number | null = null;
  let storedMessages: number | null = null;
  let connected = false;

  try {
    const [adminRow, portfolioCount, messageCount] = await Promise.all([
      prisma.admin.findUnique({
        where: { id: 1 },
        select: { email: true, totpEnabled: true, sessionVersion: true, accessCodeHash: true }
      }),
      prisma.portfolio.count(),
      prisma.contactMessage.count()
    ]);
    if (adminRow) {
      admin = adminRow;
      portfolioRecords = portfolioCount;
      storedMessages = messageCount;
      connected = true;
    }
  } catch (error) {
    console.error("Failed to read security posture from the database:", error);
  }

  const databaseLatencyMs = connected ? Date.now() - startedAt : null;

  let rateLimits: SecurityOverview["rateLimits"] = null;
  try {
    rateLimits = await getRateLimitSnapshot();
  } catch (error) {
    console.error("Failed to read rate-limit snapshot:", error);
  }

  const rounds = admin ? readBcryptRounds(admin.accessCodeHash) : null;
  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  const secretLooksWeak = secret.length < 32 || secret.includes("replace") || secret.includes("changeme");
  const cookieOptions = sessionOptions.cookieOptions ?? {};
  const emailConfiguration = getContactEmailConfigurationStatus();
  const appliedHeaderKeys = new Set(securityHeaders.map((header) => header.key));
  const missingHeaders = requiredSecurityHeaderKeys.filter((key) => !appliedHeaderKeys.has(key));
  const trustedProxyHeaders = process.env.TRUST_PROXY_HEADERS?.trim().toLowerCase() === "true";
  const nonceCsp = contentSecurityPolicyIsStrict();
  const configuredOrigin = process.env.FRONTEND_ORIGIN?.trim() ?? "";
  const checks: PostureCheck[] = [
    {
      id: "database",
      label: "Database connectivity",
      status: connected ? "pass" : "fail",
      detail: connected
        ? `Live read from ${readDatabaseHost() ?? "the configured database"} in ${databaseLatencyMs} ms.`
        : "The database could not be reached, so the live checks below are unreliable.",
      ...(connected ? {} : { remediation: "Verify DATABASE_URL and that the Neon project is reachable." })
    },
    {
      id: "session-secret",
      label: "Session secret strength",
      status: secretLooksWeak ? "fail" : "pass",
      detail: secretLooksWeak
        ? "SESSION_SECRET is missing, too short, or still a placeholder value."
        : `SESSION_SECRET is set with ${secret.length} characters and is not a placeholder.`,
      ...(secretLooksWeak
        ? { remediation: "Set SESSION_SECRET to 32+ random characters and redeploy. This signs out every session." }
        : {})
    },
    {
      id: "access-code-hash",
      label: "Access code hashing cost",
      status: rounds === null ? "fail" : rounds >= 12 ? "pass" : "warn",
      detail: rounds === null
        ? "The stored credential is not a bcrypt hash."
        : `The stored access code is bcrypt with a cost factor of ${rounds}.`,
      ...(rounds !== null && rounds < 12
        ? { remediation: "Reset the access code so it is re-hashed at cost 12." }
        : {})
    },
    {
      id: "access-code-policy",
      label: "Access code policy",
      status: "pass",
      detail: `New access codes require ${MIN_ACCESS_CODE_LENGTH}+ characters with at least 10 distinct characters, and are rejected if they are obvious or appear in a weak-code list.`
    },
    {
      id: "two-factor",
      label: "Two-factor authentication",
      status: admin?.totpEnabled ? "pass" : "warn",
      detail: admin?.totpEnabled
        ? "An authenticator app is required at sign-in."
        : "Admin sign-in currently relies on the access code alone.",
      ...(admin?.totpEnabled ? {} : { remediation: "Enable an authenticator app under Settings → Two-Factor Auth." })
    },
    {
      id: "session-cookie",
      label: "Session cookie flags",
      status: cookieOptions.httpOnly && cookieOptions.sameSite === "strict" ? "pass" : "warn",
      detail: `httpOnly=${Boolean(cookieOptions.httpOnly)}, sameSite=${cookieOptions.sameSite ?? "unset"}, secure=${Boolean(cookieOptions.secure)} (automatic outside production).`
    },
    {
      id: "session-binding",
      label: "Session revocation on password change",
      status: session.sessionVersion === admin?.sessionVersion ? "pass" : "warn",
      detail: `This session was issued at version ${session.sessionVersion ?? 0}; the account is at version ${admin?.sessionVersion ?? 0}.`
    },
    {
      id: "security-headers",
      label: "Response security headers",
      status: missingHeaders.length === 0 && nonceCsp ? "pass" : "fail",
      detail: missingHeaders.length === 0
        ? `All ${requiredSecurityHeaderKeys.length} static headers are applied by next.config.ts, and the per-request CSP allows no 'unsafe-inline' for either script or style.`
        : `Missing: ${missingHeaders.join(", ")}.`,
      ...(missingHeaders.length === 0 && nonceCsp
        ? {}
        : { remediation: "Add the missing headers in src/lib/security-headers.ts." })
    },
    {
      id: "origin-checks",
      label: "Origin pinning (CSRF)",
      status: configuredOrigin ? "pass" : "warn",
      detail: configuredOrigin
        ? `State-changing requests are pinned to ${configuredOrigin}.`
        : "FRONTEND_ORIGIN is unset, so origin checks fall back to the request host.",
      ...(configuredOrigin ? {} : { remediation: "Set FRONTEND_ORIGIN to your production origin." })
    },
    {
      id: "proxy-trust",
      label: "Client address trust",
      status: trustedProxyHeaders ? "warn" : "pass",
      detail: trustedProxyHeaders
        ? "TRUST_PROXY_HEADERS=true, so X-Forwarded-For decides the rate-limit bucket and must be overwritten by your proxy or CDN."
        : "Forwarding headers are ignored (the safe default), so unresolvable clients share one rate-limit bucket.",
      ...(trustedProxyHeaders
        ? { remediation: "Confirm a proxy overwrites X-Forwarded-For, otherwise remove TRUST_PROXY_HEADERS=true." }
        : {})
    },
    {
      id: "rate-limiting",
      label: "Brute-force throttling",
      status: rateLimits ? "pass" : "warn",
      detail: rateLimits
        ? `${rateLimits.loginMaxAttempts} attempts per ${rateLimits.windowMinutes} min per address, plus a shared ceiling of ${rateLimits.globalMaxAttempts}. ${rateLimits.trackedAddresses} addresses tracked, ${rateLimits.throttledAddresses} currently locked out, ${rateLimits.recordedFailures} failures recorded.`
        : "Rate-limit state could not be read from the database."
    },
    {
      id: "email",
      label: "Contact email alerts",
      status: emailConfiguration.configured ? "pass" : "warn",
      detail: emailConfiguration.configured
        ? "SMTP is configured, so new messages trigger an email alert."
        : `Not configured — missing ${emailConfiguration.missingSettings.join(", ")}. Messages are still stored in the inbox.`
    }
  ];

  const overview: SecurityOverview = {
    score: scoreOf(checks),
    checks,
    account: {
      email: admin?.email ?? "",
      totpEnabled: admin?.totpEnabled ?? false,
      sessionVersion: admin?.sessionVersion ?? 0,
      passwordAlgorithm: rounds === null ? null : "bcrypt",
      passwordRounds: rounds
    },
    database: {
      connected,
      host: readDatabaseHost(),
      latencyMs: databaseLatencyMs,
      portfolioRecords,
      storedMessages
    },
    rateLimits,
    session: {
      cookieName: sessionOptions.cookieName ?? "unknown",
      httpOnly: Boolean(cookieOptions.httpOnly),
      secure: Boolean(cookieOptions.secure),
      sameSite: cookieOptions.sameSite ?? "unset",
      ttlHours: Math.round((sessionOptions.ttl ?? 0) / 3600),
      trustedProxyHeaders
    },
    email: {
      configured: emailConfiguration.configured,
      missingSettings: emailConfiguration.missingSettings
    },
    checkedAt: new Date().toISOString()
  };

  return NextResponse.json(overview);
}
