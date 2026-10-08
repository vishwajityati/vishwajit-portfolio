// Confirms every stylesheet referenced by globals.css exists, that nothing still imports the old
// base.css monolith, and reports selectors that appear in more than one split file.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const globals = fs.readFileSync(path.join(root, "src", "app", "globals.css"), "utf8");

const imports = [...globals.matchAll(/@import\s+"([^"]+)"/g)].map((m) => m[1]);
console.log("imports declared: " + imports.length);

let problems = 0;
const seen = new Map();

for (const spec of imports) {
  const abs = path.resolve(path.join(root, "src", "app"), spec);
  if (!fs.existsSync(abs)) {
    console.log("MISSING: " + spec);
    problems++;
    continue;
  }
  const css = fs.readFileSync(abs, "utf8");
  const lineCount = css.split(/\r?\n/).length;
  console.log("  ok  " + spec.replace("../", "src/").padEnd(46) + String(lineCount).padStart(5) + " lines");
  for (const m of css.matchAll(/^\s*([.#][A-Za-z0-9_-]+)/gm)) {
    if (!seen.has(m[1])) seen.set(m[1], new Set());
    seen.get(m[1]).add(spec.replace("../", "src/"));
  }
}

const dupes = [...seen.entries()].filter(([, files]) => files.size > 1);
console.log("");
console.log("selectors defined in more than one split file:");
if (dupes.length === 0) {
  console.log("  none");
} else {
  for (const [rule, files] of dupes) console.log("  " + rule.padEnd(30) + [...files].join(", "));
}

const legacyGone = !fs.existsSync(path.join(root, "src", "styles", "base.css"));
console.log("");
console.log("base.css removed: " + legacyGone);

const walk = (dir, acc = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|css)$/.test(entry.name)) acc.push(full);
  }
  return acc;
};
const stale = walk(path.join(root, "src")).filter((f) => fs.readFileSync(f, "utf8").includes("styles/base.css"));
console.log("files still importing base.css: " + (stale.length ? stale.join(", ") : "none"));

process.exit(problems === 0 && legacyGone && stale.length === 0 ? 0 : 1);