// End-to-end: exercises getPortfolioContent() through repeated cold starts, which is the
// exact scenario that produced the reported PrismaClientInitializationError.
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

for (const file of [".env", ".env.local"]) {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const log: string[] = [];

// Each iteration gets a fresh module registry so a brand new PrismaClient is constructed,
// mimicking a cold server where the connection pool starts empty.
const COLD_STARTS = 8;

async function main() {
  let failures = 0;

  for (let i = 1; i <= COLD_STARTS; i++) {
    for (const key of Object.keys(require.cache)) {
      if (key.includes(`${path.sep}src${path.sep}lib${path.sep}`) || key.includes(`${path.sep}src${path.sep}data${path.sep}`)) {
        delete require.cache[key];
      }
    }

    const { getPortfolioContent } = await import("../src/lib/portfolio");
    const started = Date.now();
    try {
      const content = await getPortfolioContent();
      const name = content?.name ? "real" : "EMPTY";
      log.push(`cold start ${i}: OK in ${Date.now() - started}ms (name source: ${name})`);
    } catch (error) {
      failures++;
      const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
      log.push(`cold start ${i}: FAIL in ${Date.now() - started}ms ${(error as Error).constructor.name} :: ${message}`);
    }
  }

  log.push(`\nRESULT: ${COLD_STARTS - failures}/${COLD_STARTS} cold starts succeeded (${failures} failed)`);
  fs.writeFileSync("coldstart-test-output.txt", log.join("\n"), "utf8");
  console.log(log.join("\n"));
  process.exit(failures > 0 ? 1 : 0);
}

main();