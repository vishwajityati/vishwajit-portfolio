import "server-only";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";

/** Bucket used when the true client address cannot be established. */
const UNKNOWN_ADDRESS = "unresolved";

/**
 * Forwarding headers are only trustworthy when a proxy overwrites them. When the app
 * is exposed directly an attacker can rotate `X-Forwarded-For` to get a fresh
 * rate-limit bucket per request.
 *
 * This fails closed: forwarding headers are honoured only when an operator opts in with
 * TRUST_PROXY_HEADERS=true. The default instead collapses every unresolvable client into
 * a single shared bucket, which for a single-admin site is the safer trade-off — a
 * legitimate administrator cannot be brute-forced by rotating a header.
 */
function trustsProxyHeaders(): boolean {
  return process.env.TRUST_PROXY_HEADERS?.trim().toLowerCase() === "true";
}

/** Returns a validated IP literal, or null when the header is absent or malformed. */
function firstValidAddress(header: string | null): string | null {
  if (!header) return null;
  for (const candidate of header.split(",")) {
    const value = candidate.trim().replace(/^\[|\]$/g, "");
    if (isIP(value)) return value;
  }
  return null;
}

/**
 * Best-effort client address for rate limiting. Falls back to a single shared bucket
 * rather than trusting arbitrary input, so an attacker cannot evade limits by forging
 * headers — at the cost of shared throttling when the address is genuinely unknown.
 */
export function getClientAddress(request: NextRequest): string {
  if (trustsProxyHeaders()) {
    const forwarded = firstValidAddress(request.headers.get("x-forwarded-for"))
      ?? firstValidAddress(request.headers.get("x-real-ip"));
    if (forwarded) return forwarded;
  }
  return UNKNOWN_ADDRESS;
}

/**
 * Cheap pre-check against the declared body size so an oversized upload is rejected
 * before it is buffered or parsed.
 */
export function exceedsDeclaredSize(request: NextRequest, limitBytes: number): boolean {
  const contentLength = Number(request.headers.get("content-length"));
  return Number.isFinite(contentLength) && contentLength > limitBytes;
}

/**
 * Authoritative size check performed on the parsed payload, because `content-length` is
 * absent for chunked requests and can be spoofed by a client that streams its body.
 */
export function exceedsSerializedSize(payload: unknown, limitBytes: number): boolean {
  try {
    return Buffer.byteLength(JSON.stringify(payload) ?? "", "utf8") > limitBytes;
  } catch {
    return true;
  }
}

export function hasSameOrigin(request: NextRequest): boolean {
  // Defence in depth: browsers attach Sec-Fetch-Site to every request and page
  // JavaScript cannot set it, so a cross-site request is rejected even when the
  // Origin header is absent.
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site" && fetchSite !== "none") {
    return false;
  }

  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.FRONTEND_ORIGIN?.trim();
  if (origin && configuredOrigin) {
    try {
      if (new URL(origin).origin === new URL(configuredOrigin).origin) return true;
    } catch {
      return false;
    }
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProtocol ? `${forwardedProtocol}:` : new URL(request.url).protocol;
    return new URL(origin).origin === `${protocol}//${host}`;
  } catch {
    return false;
  }
}
