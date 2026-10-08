import { emptyPortfolio, type Experience, type PortfolioContent, type Project, type SkillGroup } from "@/types";

/** Proficiency steps are rendered from `.skill-bar-*` classes, so the value is snapped to 5s. */
export const SKILL_LEVEL_STEP = 5;

/** Rounds a proficiency to the nearest step and clamps it into the 0–100 the bar classes cover. */
export function snapSkillLevel(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const clamped = Math.min(100, Math.max(0, numeric));
  return Math.round(clamped / SKILL_LEVEL_STEP) * SKILL_LEVEL_STEP;
}

/**
 * Upper bounds applied to every admin-supplied string and array.
 *
 * These are deliberately far above anything the site legitimately needs (the live record
 * tops out around 250 characters in its longest field) so tightening validation can never
 * invalidate content that is already stored.
 */
export const PORTFOLIO_LIMITS = {
  shortText: 120,
  mediumText: 400,
  longText: 2_000,
  paragraph: 4_000,
  url: 2_048,
  email: 254,
  listItem: 200,
  roles: 30,
  aboutParagraphs: 30,
  projects: 80,
  technologies: 40,
  experience: 40,
  points: 40,
  skillGroups: 20,
  skillsPerGroup: 60,
  groupTitle: 80
} as const;

// C0 control characters except tab (\t), line feed (\n) and carriage return (\r), which are
// legitimate in multi-line prose. Anything else can corrupt logs or terminal output.
const FORBIDDEN_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A string within `max` characters and free of control characters. */
function isBoundedText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max && !FORBIDDEN_CONTROL.test(value);
}

function hasStringFields(value: unknown, fields: Record<string, number>): value is Record<string, string> {
  return isRecord(value) && Object.entries(fields).every(([field, max]) => isBoundedText(value[field], max));
}

/** Empty is allowed (the site renders nothing for blank links); otherwise must be http(s). */
function isOptionalHttpUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.length > PORTFOLIO_LIMITS.url || FORBIDDEN_CONTROL.test(value)) return false;
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isOptionalEmail(value: unknown): boolean {
  if (typeof value !== "string" || value.length > PORTFOLIO_LIMITS.email || FORBIDDEN_CONTROL.test(value)) return false;
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** An array of non-empty bounded strings, with a cap on how many entries it may hold. */
function isBoundedStringList(value: unknown, maxItems: number, maxLength: number): value is string[] {
  return Array.isArray(value)
    && value.length <= maxItems
    && value.every((item) => isBoundedText(item, maxLength) && item.trim().length > 0);
}

function isProject(value: unknown): value is Project {
  return hasStringFields(value, {
    title: PORTFOLIO_LIMITS.shortText,
    description: PORTFOLIO_LIMITS.longText
  })
    && isOptionalHttpUrl(value.imageUrl)
    && isOptionalHttpUrl(value.liveUrl)
    && isOptionalHttpUrl(value.githubUrl)
    && isBoundedStringList(value.technologies, PORTFOLIO_LIMITS.technologies, PORTFOLIO_LIMITS.listItem)
    && typeof value.featured === "boolean";
}

function isExperience(value: unknown): value is Experience {
  return hasStringFields(value, {
    title: PORTFOLIO_LIMITS.shortText,
    period: PORTFOLIO_LIMITS.shortText
  })
    && isBoundedStringList(value.points, PORTFOLIO_LIMITS.points, PORTFOLIO_LIMITS.longText);
}

function isSkillGroup(value: unknown): value is SkillGroup {
  return isRecord(value)
    && isBoundedText(value.title, PORTFOLIO_LIMITS.groupTitle)
    && Array.isArray(value.skills)
    && value.skills.length <= PORTFOLIO_LIMITS.skillsPerGroup
    && value.skills.every((skill) =>
      isRecord(skill)
      && isBoundedText(skill.name, PORTFOLIO_LIMITS.listItem)
      && skill.name.trim().length > 0
      && typeof skill.level === "number"
      && Number.isFinite(skill.level)
      && skill.level >= 0
      && skill.level <= 100);
}

export function isPortfolioContent(value: unknown): value is PortfolioContent {
  if (!isRecord(value)) return false;

  if (!hasStringFields(value, {
    name: PORTFOLIO_LIMITS.shortText,
    intro: PORTFOLIO_LIMITS.mediumText,
    location: PORTFOLIO_LIMITS.shortText
  })) return false;

  if (!isOptionalHttpUrl(value.photoUrl) || !isOptionalHttpUrl(value.resumeUrl)) return false;
  if (!isBoundedStringList(value.roles, PORTFOLIO_LIMITS.roles, PORTFOLIO_LIMITS.shortText)) return false;

  if (!Array.isArray(value.about)
    || value.about.length > PORTFOLIO_LIMITS.aboutParagraphs
    || !value.about.every((paragraph) => isBoundedText(paragraph, PORTFOLIO_LIMITS.paragraph))) return false;

  if (!Array.isArray(value.projects)
    || value.projects.length > PORTFOLIO_LIMITS.projects
    || !value.projects.every(isProject)) return false;

  if (!Array.isArray(value.experience)
    || value.experience.length > PORTFOLIO_LIMITS.experience
    || !value.experience.every(isExperience)) return false;

  if (!hasStringFields(value.education, {
    degree: PORTFOLIO_LIMITS.shortText,
    institution: PORTFOLIO_LIMITS.longText,
    period: PORTFOLIO_LIMITS.shortText,
    summary: PORTFOLIO_LIMITS.longText,
    beyond: PORTFOLIO_LIMITS.longText
  })) return false;
  if (!Array.isArray(value.education.skillGroups)
    || value.education.skillGroups.length > PORTFOLIO_LIMITS.skillGroups
    || !value.education.skillGroups.every(isSkillGroup)) return false;

  if (!hasStringFields(value.contact, {
    email: PORTFOLIO_LIMITS.email,
    linkedin: PORTFOLIO_LIMITS.url,
    github: PORTFOLIO_LIMITS.url,
    instagram: PORTFOLIO_LIMITS.url,
    x: PORTFOLIO_LIMITS.url,
    location: PORTFOLIO_LIMITS.shortText
  })) return false;
  if (!isOptionalEmail(value.contact.email)) return false;
  if (!isOptionalHttpUrl(value.contact.linkedin)) return false;
  if (!isOptionalHttpUrl(value.contact.github)) return false;
  if (!isOptionalHttpUrl(value.contact.instagram)) return false;
  if (!isOptionalHttpUrl(value.contact.x)) return false;
  if (!hasStringFields(value.seo, {
    title: PORTFOLIO_LIMITS.shortText,
    description: PORTFOLIO_LIMITS.mediumText,
    keywords: PORTFOLIO_LIMITS.mediumText
  })) return false;
  if (!isOptionalHttpUrl(value.seo.imageUrl)) return false;

  return hasStringFields(value.siteSettings, {
    name: PORTFOLIO_LIMITS.shortText,
    url: PORTFOLIO_LIMITS.url
  }) && isOptionalHttpUrl(value.siteSettings.url);
}

/**
 * Brings a stored `education` object up to the current shape.
 *
 * Skills used to be a flat `string[]`. They are now grouped (`skillGroups`) and each carries a
 * proficiency level. A record written before that change would fail validation outright, which
 * `normalizePortfolioContent` treats as "malformed" and answers with defaults — silently showing
 * the owner the seed skill list instead of their own. So the legacy shape is migrated in place:
 * the old names are preserved as a single "Skills" group at a neutral level, and only when no
 * `skillGroups` are present.
 *
 * Levels are snapped to the render step so a migrated value always maps to a real CSS class.
 */
function migrateEducation(education: unknown, fallback: PortfolioContent["education"]): unknown {
  if (!isRecord(education)) return education;

  const legacySkills = education.skills;
  const hasLegacyList = Array.isArray(legacySkills) && legacySkills.length > 0;
  const alreadyMigrated = Array.isArray(education.skillGroups);

  const migrated = hasLegacyList && !alreadyMigrated
    ? [{
        title: "Skills",
        skills: legacySkills
          .filter((skill): skill is string => typeof skill === "string" && skill.trim().length > 0)
          .map((name) => ({ name, level: snapSkillLevel(75) }))
      }]
    : education.skillGroups;

  return { ...fallback, ...education, skillGroups: migrated };
}

export function normalizePortfolioContent(value: unknown, fallback: PortfolioContent = emptyPortfolio): PortfolioContent | null {
  if (!isRecord(value)) return null;

  const normalized: unknown = {
    ...value,
    education: migrateEducation(value.education, fallback.education),
    contact: isRecord(value.contact) ? { ...fallback.contact, ...value.contact } : value.contact,
    seo: isRecord(value.seo) ? { ...fallback.seo, ...value.seo } : fallback.seo,
    siteSettings: isRecord(value.siteSettings) ? { ...fallback.siteSettings, ...value.siteSettings } : value.siteSettings
  };
  return isPortfolioContent(normalized) ? normalized : null;
}