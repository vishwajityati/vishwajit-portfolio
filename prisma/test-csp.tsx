// Guards the CSP posture described in README.md / docs/architecture.md: neither script nor
// style execution may rely on an inline escape hatch (`style-src-attr 'none'`, no
// `'unsafe-inline'` anywhere).
//
// The regression this exists for: the About portrait once rendered its photo as an inline
// `style={{ backgroundImage }}`. That only produces a violation when `photoUrl` is non-empty,
// so the rendered-HTML check only ever exercised the empty default and reported clean. This test
// renders the same components with populated image URLs so that path is actually covered.
//
// Run: npm run test:csp
import { strict as assert } from "node:assert";
import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { About } from "../src/components/about/About";
import { ProjectCard } from "../src/components/projects/ProjectCard";
import { Skills } from "../src/components/skills/Skills";
import { navigationItems } from "../src/data/navigation";
import { normalizePortfolioContent } from "../src/lib/validations";
import { contentSecurityPolicyIsStrict, buildContentSecurityPolicy } from "../src/lib/security-headers";
import { emptyPortfolio } from "../src/types";
import type { PortfolioContent, Project } from "../src/types";

const results: string[] = [];
const record = (line: string) => results.push(line);

// Any `style="..."` attribute or `<style>` element in rendered output violates style-src-attr.
function assertNoInlineStyle(html: string, label: string) {
  const attrs = [...html.matchAll(/style="[^"]*"/g)].map((m) => m[0]);
  const styleTags = [...html.matchAll(/<style\b/gi)];
  assert.equal(attrs.length + styleTags.length, 0, `${label} emitted inline styles: ${[...attrs, ...styleTags].join(" ")}`);
}

const PHOTO = "https://cdn.example.com/portrait.jpg";

const populated: PortfolioContent = {
  ...emptyPortfolio,
  name: "Vishwajit Yati",
  photoUrl: PHOTO,
  about: ["A paragraph."],
};

const project: Project = {
  title: "Example",
  description: "An example project.",
  technologies: ["TypeScript"],
  imageUrl: "https://cdn.example.com/project.png",
  liveUrl: "",
  githubUrl: "",
  featured: true,
};

async function main() {
  // --- Policy shape --------------------------------------------------------
  const policy = buildContentSecurityPolicy("TESTNONCE");
  // Under tsx NODE_ENV is not "production", so this asserts the development policy: the only
  // place 'unsafe-inline' is permitted, and only because style-loader needs it.
  if (process.env.NODE_ENV === "production") {
    assert.equal(policy.includes("'unsafe-inline'"), false, "production policy must never contain 'unsafe-inline'");
  }
  assert.equal(policy.includes("'nonce-TESTNONCE'"), true, "script-src must carry the per-request nonce");
  assert.equal(policy.includes("style-src-attr 'none'") || process.env.NODE_ENV !== "production",
    true,
    "style-src-attr must be 'none' in production");
  record("PASS built policy contains a nonce and permits 'unsafe-inline' only outside production");

  // The posture check must describe production regardless of the running environment, otherwise
  // the admin dashboard shows a permanent "fail" to every local developer.
  assert.equal(contentSecurityPolicyIsStrict(), true, "the production posture must stay strict in every environment");
  record("PASS the posture check reports production strictness even when running in development");

  // --- Populated content ---------------------------------------------------
  // This is the case the old rendered-HTML check missed.
  const aboutHtml = renderToStaticMarkup(<About content={populated} />);
  assertNoInlineStyle(aboutHtml, "About (photoUrl set)");
  assert.equal(aboutHtml.includes(`src="${PHOTO}"`), true, "the portrait must render as an <img src>");
  assert.equal(aboutHtml.includes("portrait-photo"), true, "the portrait must use the .portrait-photo class");
  record("PASS About renders the portrait as an <img> with no inline style when photoUrl is set");

  const cardHtml = renderToStaticMarkup(<ProjectCard project={project} index={0} />);
  assertNoInlineStyle(cardHtml, "ProjectCard (imageUrl set)");
  assert.equal(cardHtml.includes(`src="${project.imageUrl}"`), true, "the screenshot must render as an <img src>");
  record("PASS ProjectCard renders the screenshot as an <img> with no inline style when imageUrl is set");

  // --- Empty content (regression guard for the original check) -------------
  const emptyHtml = renderToStaticMarkup(<About content={{ ...emptyPortfolio, name: "Vishwajit Yati" }} />);
  assertNoInlineStyle(emptyHtml, "About (no photoUrl)");
  assert.equal(emptyHtml.includes("portrait-placeholder"), true, "the placeholder must still render without a photo");
  record("PASS About still renders the initials placeholder when photoUrl is empty");

  // --- Skills section ------------------------------------------------------
  // The dashboard has a dedicated Skills panel, so the public site must render them as their
  // own section rather than only as tags inside the education card.
  const skillNames = ["Java", "Data Structures & Algorithms", "SQL", "React", "Next.js"];
  const skillGroups = [{ title: "Backend", skills: skillNames.map((name) => ({ name, level: 80 })) }];
  const withSkills: PortfolioContent = { ...populated, education: [{ ...populated.education[0], skillGroups }] };
  const skillsHtml = renderToStaticMarkup(<Skills content={withSkills} />);
  assertNoInlineStyle(skillsHtml, "Skills");
  assert.equal(skillsHtml.includes('id="skills"'), true, "the section must expose id=skills for the nav anchor");
  for (const skill of skillNames) {
    // React escapes the markup-significant characters in text, so "Data Structures & Algorithms"
    // is emitted as "&amp;". Compare against the escaped form, which also proves the value was
    // escaped rather than injected raw.
    const escaped = skill.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    assert.equal(skillsHtml.includes(escaped), true, `missing skill: ${skill}`);
  }
  record("PASS Skills renders every skill in its own anchorable section with no inline style");

  // Navigation must know about the section, otherwise the nav link cannot scroll to it.
  assert.equal(navigationItems.some(({ id }) => id === "skills"), true, "navigation must include the skills section");
  record("PASS navigation includes the skills section");

  // An empty skill list must degrade gracefully rather than render an empty grid.
  const emptySkillsHtml = renderToStaticMarkup(<Skills content={{ ...populated, education: [{ ...populated.education[0], skillGroups: [] }] }} />);
  assertNoInlineStyle(emptySkillsHtml, "Skills (empty)");
  assert.equal(emptySkillsHtml.includes("empty-state"), true, "an empty skill list must show the empty state");
  record("PASS Skills shows an empty state when no skills are configured");

  // Proficiency indicators use fixed classes, never inline widths, because the production
  // policy sets style-src-attr 'none'. Values outside the normal range still render safely.
  const steppedHtml = renderToStaticMarkup(<Skills content={{ ...populated, education: [{ ...populated.education[0], skillGroups: [{ title: "Frontend", skills: [{ name: "React", level: 87 }, { name: "CSS", level: -20 }, { name: "Go", level: 1000 }] }] }] }} />);
  const activeDots = steppedHtml.match(/skill-dot active/g) ?? [];
  assert.equal(activeDots.length, 7, "levels must map to the fixed 3/1/3 active-dot indicators");
  assert.equal(steppedHtml.includes("style="), false, "proficiency indicators must not use inline styles");
  record("PASS proficiency indicators use fixed dot classes with no inline styles");

  // The stored record predates the grouped shape. It must migrate to the owner's own skills
  // rather than failing validation and silently falling back to the seed content.
  const legacy = normalizePortfolioContent(
    { ...populated, education: [{ degree: "BCA", institution: "CSM", period: "2025", summary: "s", beyond: "b", skills: ["Java", "React"] }] },
    populated
  );
  assert.notEqual(legacy, null, "a record written before the grouped skills must still normalize");
  const legacyGroups = (legacy as PortfolioContent).education[0].skillGroups;
  assert.equal(legacyGroups.length, 1, "legacy skills collapse into one group");
  assert.deepEqual(legacyGroups[0].skills.map((skill) => skill.name), ["Java", "React"], "legacy skill names must be preserved");
  record("PASS a record stored with the old flat skills list migrates instead of falling back to defaults");

  // --- Source-level guard --------------------------------------------------
  // Catches any future `style={{...}}` in JSX regardless of whether it is reachable
  // with default content, which is what let the original bug through.
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) {
        const src = fs.readFileSync(full, "utf8");
        src.split(/\r?\n/).forEach((line, i) => {
          // Ignore the comments that intentionally mention style-src / inline styles.
          const trimmed = line.trim();
          if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) return;
          if (/\bstyle\s*=\s*\{\{/.test(line) || /dangerouslySetInnerHTML/.test(line)) {
            offenders.push(`${full}:${i + 1}`);
          }
        });
      }
    }
  };
  walk("src");
  assert.equal(offenders.length, 0, `inline style attributes found at: ${offenders.join(", ")}`);
  record("PASS no source file sets an inline style attribute or uses dangerouslySetInnerHTML");

  fs.writeFileSync("csp-test-output.txt", results.join("\n"), "utf8");
  console.log(results.join("\n"));
  console.log(`\nALL ${results.length} ASSERTIONS PASSED`);
}

main().catch((error) => {
  console.error("CSP TEST FAILED:", error);
  process.exitCode = 1;
});
