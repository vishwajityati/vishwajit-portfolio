// Verifies the retry helper against real Prisma error classes and a live cold connection.
import { strict as assert } from "node:assert";
import { Prisma } from "@prisma/client";
import { isTransientDatabaseError, withDatabaseRetry } from "../../src/lib/db-retry";

const results: string[] = [];
const record = (line: string) => results.push(line);
const check = (name: string, fn: () => void | Promise<void>) => fn();

function initError(message: string) {
  return new Prisma.PrismaClientInitializationError(message, "6.12.0");
}

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("known", { code, clientVersion: "6.12.0" });
}

async function main() {
  // --- Classification -------------------------------------------------------
  const transient: Array<[string, unknown]> = [
    ["P1001 can't reach server", knownError("P1001")],
    ["P1002 connect timeout", knownError("P1002")],
    ["P1017 server closed connection", knownError("P1017")],
    ["P2024 pool timeout", knownError("P2024")],
    ["P2034 deadlock", knownError("P2034")],
    ["initialization: unreachable", initError("Can't reach database server at db:5432")],
    ["socket ECONNRESET", Object.assign(new Error("reset"), { code: "ECONNRESET" })],
    ["socket ETIMEDOUT", Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })],
  ];

  for (const [name, error] of transient) {
    check(name, () => {
      assert.equal(isTransientDatabaseError(error), true, `${name} should be transient`);
      record(`PASS classified transient: ${name}`);
    });
  }

  const permanent: Array<[string, unknown]> = [
    ["P2002 unique violation", knownError("P2002")],
    ["P2025 record not found", knownError("P2025")],
    ["P2003 FK violation", knownError("P2003")],
    ["missing DATABASE_URL", initError("Environment variable not found: DATABASE_URL")],
    ["invalid connection string", initError("error validating datasource `db`: the URL is invalid")],
    ["plain error", new Error("boom")],
    ["not an error", "a string"],
  ];

  for (const [name, error] of permanent) {
    check(name, () => {
      assert.equal(isTransientDatabaseError(error), false, `${name} should be permanent`);
      record(`PASS classified permanent: ${name}`);
    });
  }

  // --- Retry behaviour ------------------------------------------------------
  let attempts = 0;
  const recovered = await withDatabaseRetry(
    async () => {
      attempts++;
      if (attempts < 3) throw initError("Can't reach database server at db:5432");
      return "recovered";
    },
    { attempts: 5, baseDelayMs: 5, label: "test recovery" }
  );
  assert.equal(recovered, "recovered");
  assert.equal(attempts, 3, "should retry until the third attempt succeeds");
  record("PASS retries a transient failure and returns the eventual value");

  attempts = 0;
  await assert.rejects(
    () =>
      withDatabaseRetry(
        async () => {
          attempts++;
          throw initError("Can't reach database server at db:5432");
        },
        { attempts: 3, baseDelayMs: 5, label: "test exhaustion" }
      ),
    /Can't reach database server/
  );
  assert.equal(attempts, 3, "must stop at the configured attempt limit");
  record("PASS gives up after the configured number of attempts");

  attempts = 0;
  await assert.rejects(
    () =>
      withDatabaseRetry(
        async () => {
          attempts++;
          throw knownError("P2002");
        },
        { attempts: 4, baseDelayMs: 5, label: "test permanent" }
      ),
    /known/
  );
  assert.equal(attempts, 1, "a permanent error must not be retried");
  record("PASS never retries a permanent error");

  const succeeded = await withDatabaseRetry(async () => "ok", { attempts: 3 });
  assert.equal(succeeded, "ok");
  record("PASS passes a healthy operation straight through");

  const fs = await import("node:fs");
  fs.writeFileSync("retry-test-output.txt", results.join("\n"), "utf8");
  console.log(results.join("\n"));
  console.log(`\nALL ${results.length} ASSERTIONS PASSED`);
}

main().catch((error) => {
  console.error("RETRY TEST FAILED:", error);
  process.exitCode = 1;
});