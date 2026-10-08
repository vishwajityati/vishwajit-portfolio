import "server-only";
import { Prisma } from "@prisma/client";

/**
 * Prisma codes that mean "the connection could not be obtained or was dropped", as opposed to
 * a genuine query or constraint failure. Only these are worth retrying — replaying a rejected
 * write (a unique-constraint violation, say) would fail identically every time.
 */
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // Can't reach database server at all.
  "P1002", // The connection attempt exceeded connect_timeout.
  "P1008", // The database operation exceeded its timeout.
  "P1017", // The server closed the connection unexpectedly.
  "P2024", // Timed out fetching a new connection from the pool.
  "P2028", // Transaction API error, usually a dropped connection mid-transaction.
  "P2034", // Write conflict / deadlock; safe to replay.
]);

/** Node socket-level failures that surface through Prisma's engine without a Prisma code. */
const TRANSIENT_SYSTEM_CODES = new Set([
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EAI_AGAIN",
  "ENOTFOUND",
  "EPIPE",
  "ETIMEDOUT"
]);

/**
 * A missing or malformed DATABASE_URL raises the same error class as an unreachable host, but
 * retrying it only delays an actionable configuration mistake, so it is treated as permanent.
 */
function isConfigurationFailure(error: Error): boolean {
  return /environment variable not found|invalid database string|error validating datasource/i.test(error.message);
}

/**
 * True when the failure is a transient connectivity problem that a later attempt may survive.
 *
 * This matters because a serverless Postgres compute is suspended while idle and is resumed by
 * the first connection that arrives after the idle period. That first connection can be refused
 * or dropped while the compute wakes, so an un-retried read fails even though the database is
 * perfectly healthy a moment later.
 */
export function isTransientDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return !isConfigurationFailure(error);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_PRISMA_CODES.has(error.code);
  }

  const systemCode = (error as NodeJS.ErrnoException).code;
  return typeof systemCode === "string" && TRANSIENT_SYSTEM_CODES.has(systemCode);
}

interface RetryOptions {
  /** Total attempts including the first. */
  attempts?: number;
  /** Delay before the second attempt; doubles each time up to `maxDelayMs`. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Short label used in the retry log line. */
  label?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs a database operation, retrying transient connectivity failures with exponential backoff
 * and jitter.
 *
 * Backoff matters more than the retry count here: a resuming compute and a saturated pool both
 * need a moment, and synchronised retries from several requests would queue behind the same
 * wake-up. Jitter spreads those attempts out. The delay is capped so a genuine outage still
 * surfaces to the caller within a sane request budget.
 *
 * Only use this for operations that are safe to replay. A read, or an idempotent write such as
 * an upsert, always is; a plain create is not, because the first attempt may have committed
 * before the connection dropped.
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, baseDelayMs = 250, maxDelayMs = 2_000, label = "database operation" }: RetryOptions = {}
): Promise<T> {
  const totalAttempts = Math.max(1, attempts);

  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt >= totalAttempts;
      if (isLastAttempt || !isTransientDatabaseError(error)) throw error;

      // Full jitter on a capped exponential backoff.
      const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delayMs = Math.round(Math.random() * ceiling);

      console.warn(
        `[db] transient failure during ${label} (attempt ${attempt}/${totalAttempts}); `
          + `retrying in ${delayMs}ms. Cause: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`
      );

      await wait(delayMs);
    }
  }
}