/**
 * Access-code rules shared by the setup route, the account route, the TOTP route and the
 * admin UI, so the client can validate before submitting.
 *
 * The access code replaces the former email + password pair. Because a code has no
 * second identifying factor, the length floor is the primary defence against guessing,
 * which is why it is higher than a typical password floor.
 *
 * Intentionally free of `server-only` and of Node built-ins because client components
 * import it.
 */

export const MIN_ACCESS_CODE_LENGTH = 20;
export const MAX_ACCESS_CODE_LENGTH = 200;

/** Rejected outright: obvious, sequential or dictionary-trivial values. */
const WEAK_CODES = new Set([
  "password", "password1", "password123", "passw0rd", "12345678", "123456789", "1234567890",
  "qwertyuiop", "qwerty123", "letmein123", "welcome123", "admin123", "administrator",
  "iloveyou", "sunshine1", "princess1", "football1", "baseball1", "trustno123",
  "portfolio", "portfolio123", "portfolioadmin", "changeme", "changeme123", "default",
  "secret123", "changethis", "accesscode", "adminaccess", "portfolioaccess"
]);

const SEQUENTIAL = /^(?:abcdef|qwerty|123456|098765|password|letmein|welcome|admin|access)/;

/**
 * Normalises a code so that capitalisation and stray spacing cannot lock the owner out:
 * there is no email recovery path, so a code must be reproducible by hand.
 *
 * Upper-casing costs the entropy that letter case would otherwise add, which is an
 * acceptable trade against the length floor enforced in {@link getAccessCodePolicyError}.
 */
export function normalizeAccessCode(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

export type AccessCodeCheckId = "length" | "variety" | "sequential" | "common";

export interface AccessCodeCheck {
  id: AccessCodeCheckId;
  label: string;
  passed: boolean;
}

export function evaluateAccessCode(code: string): AccessCodeCheck[] {
  const normalized = normalizeAccessCode(code).toLowerCase();
  const distinct = new Set(normalized.replace(/[^a-z0-9]/g, "")).size;

  return [
    {
      id: "length",
      label: `At least ${MIN_ACCESS_CODE_LENGTH} characters`,
      passed: code.length >= MIN_ACCESS_CODE_LENGTH
    },
    {
      // A long but low-variety code ("aaaaaaaaaaaaaaaaaaaa") has very little entropy
      // despite its length, so the number of distinct characters is checked directly.
      id: "variety",
      label: "Uses at least 10 different characters",
      passed: distinct >= 10
    },
    {
      id: "sequential",
      label: "Not an obvious sequence or a repeated character",
      passed: !SEQUENTIAL.test(normalized) && !/^(.)\1+$/.test(normalized)
    },
    {
      id: "common",
      label: "Not a commonly used code",
      passed: code.length >= MIN_ACCESS_CODE_LENGTH && !WEAK_CODES.has(normalized)
    }
  ];
}

/** Returns a human-readable rejection reason, or null when the code is acceptable. */
export function getAccessCodePolicyError(code: string): string | null {
  if (code.length > MAX_ACCESS_CODE_LENGTH) {
    return `Access code must be at most ${MAX_ACCESS_CODE_LENGTH} characters.`;
  }
  const failed = evaluateAccessCode(code).find((check) => !check.passed);
  if (!failed) return null;
  if (failed.id === "length") return `Access code must be at least ${MIN_ACCESS_CODE_LENGTH} characters.`;
  if (failed.id === "variety") return "Use at least 10 different characters in your access code.";
  if (failed.id === "common") return "That access code is too common. Choose something harder to guess.";
  return "That access code is too predictable. Choose something harder to guess.";
}