import "dotenv/config";
import bcrypt from "bcryptjs";
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { prisma } from "../src/lib/prisma";
import {
  MAX_ACCESS_CODE_LENGTH,
  MIN_ACCESS_CODE_LENGTH,
  evaluateAccessCode,
  getAccessCodePolicyError,
  normalizeAccessCode
} from "../src/lib/access-code";

interface Keypress {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
}

function promptHidden(label: string): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal so codes are not echoed.");
  }

  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  process.stdout.write(label);

  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error?: Error) => {
      input.removeListener("keypress", onKeypress);
      input.setRawMode(false);
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onKeypress = (character: string, key?: Keypress) => {
      if (key?.ctrl && key.name === "c") {
        finish(new Error("Access code reset cancelled."));
      } else if (key?.name === "return" || key?.name === "enter") {
        finish();
      } else if (key?.name === "backspace") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else if (character && !key?.ctrl && !key?.meta && value.length < MAX_ACCESS_CODE_LENGTH) {
        value += character;
        process.stdout.write("*");
      }
    };

    input.on("keypress", onKeypress);
  });
}

async function ask(question: string): Promise<string> {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
}

/** Mirrors the server-side rule so the operator sees the failure before it is written. */
function reportPolicyFailure(code: string): void {
  const error = getAccessCodePolicyError(code);
  console.log("");
  for (const rule of evaluateAccessCode(code)) {
    console.log(`  ${rule.passed ? "[x]" : "[ ]"} ${rule.label}`);
  }
  if (error) console.log(`\n  Rejected: ${error}`);
  console.log("");
}

/** Prompts until the code satisfies the policy, or gives up after three attempts. */
async function promptForNewCode(): Promise<string> {
  for (let attempt = 1; ; attempt += 1) {
    const candidate = normalizeAccessCode(
      await promptHidden(`New access code (at least ${MIN_ACCESS_CODE_LENGTH} characters): `)
    );
    if (!getAccessCodePolicyError(candidate)) return candidate;

    reportPolicyFailure(candidate);
    if (attempt >= 3) {
      throw new Error("Access code does not meet the policy. No changes were made.");
    }
    console.log(`  Attempt ${attempt} of 3 rejected. Try again.`);
  }
}

async function main() {
  if (!process.stdin.isTTY) {
    throw new Error("Run `npm run admin:reset-code` in an interactive terminal.");
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. No changes were made.");
  }

  let databaseTarget: string;
  if (databaseUrl === "file:./dev.db") {
    databaseTarget = "local SQLite database (dev.db)";
  } else if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    const parsedUrl = new URL(databaseUrl);
    const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1)) || "unknown database";
    databaseTarget = `${parsedUrl.hostname}/${databaseName}`;
  } else {
    throw new Error("DATABASE_URL must use this project's local SQLite database or a PostgreSQL database. No changes were made.");
  }

  const confirmationPrompt = createInterface({ input: process.stdin, output: process.stdout });
  let targetConfirmation: string;
  try {
    console.log(`This will reset the admin access code in: ${databaseTarget}`);
    targetConfirmation = (await confirmationPrompt.question('Type "RESET" to continue: ')).trim();
  } finally {
    confirmationPrompt.close();
  }
  if (targetConfirmation !== "RESET") {
    throw new Error("Access code reset cancelled. No changes were made.");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: 1 },
    select: { id: true, email: true }
  });

  if (!admin) {
    throw new Error("No admin account exists in this database. Complete first-time setup at /update-section.");
  }

  // The CLI mirrors the web policy exactly, so a code rejected here is also rejected
  // by /api/auth/setup and /api/auth/account.
  const code = await promptForNewCode();

  const codeConfirmation = normalizeAccessCode(await promptHidden("Confirm new access code: "));
  if (code !== codeConfirmation) {
    throw new Error("Access codes do not match. No changes were made.");
  }

  const current = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { totpEnabled: true }
  });

  // Resetting the code is usually what an intruder does after a breach, so wiping
  // authenticator verification by default would quietly remove the second factor. It is
  // therefore opt-in and has to be typed out explicitly.
  let disableAuthenticator = false;
  if (current?.totpEnabled) {
    console.log("\nTwo-factor authentication is currently enabled on this account.");
    const answer = await ask("Disable authenticator verification? This keeps you locked out without your app. Type DISABLE to confirm, anything else keeps it: ");
    disableAuthenticator = answer === "DISABLE";
    console.log(disableAuthenticator
      ? "  Authenticator verification WILL be disabled."
      : "  Authenticator verification will be kept. You will need your authenticator code to sign in.");
  }

  // sessionVersion is incremented so that every session cookie issued before this reset
  // stops validating immediately, on this device and every other one.
  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      accessCodeHash: await bcrypt.hash(code, 12),
      sessionVersion: { increment: 1 },
      ...(disableAuthenticator
        ? { totpEnabled: false, totpSecret: null, lastTotpStep: null }
        : {})
    }
  });

  console.log(`\nAdmin access code reset${admin.email ? ` for ${admin.email}` : ""}.`);
  console.log("All previously signed-in sessions were invalidated.");
  console.log(disableAuthenticator
    ? "Authenticator verification was DISABLED — re-enable it under Settings -> Two-Factor Auth once you are back in."
    : "Authenticator verification is still enabled; sign in with your app code at /update-section.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin access-code reset failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
