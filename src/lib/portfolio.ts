import "server-only";
import { defaultContent } from "@/data/personal";
import type { PortfolioContent } from "@/types";
import { prisma } from "@/lib/prisma";
import { normalizePortfolioContent } from "@/lib/validations";
import { withDatabaseRetry } from "@/lib/db-retry";

function serializePortfolioContent(content: PortfolioContent): string {
  return JSON.stringify(content);
}

async function ensurePortfolioSeed(): Promise<PortfolioContent> {
  const seeded = serializePortfolioContent(defaultContent);

  const existing = await withDatabaseRetry(
    () => prisma.portfolio.findUnique({ where: { id: 1 } }),
    { label: "portfolio seed lookup" }
  );

  // Only seed when there is genuinely no record. If a record exists but cannot be
  // normalised we deliberately leave it untouched: overwriting it here would destroy the
  // owner's real content the first time validation tightened or a field drifted.
  if (!existing) {
    try {
      await prisma.portfolio.create({ data: { id: 1, content: seeded } });
      return defaultContent;
    } catch (error) {
      // Multiple cold requests can all observe the missing singleton row. If another
      // request won the insert, use that record instead of surfacing a unique violation.
      const isUniqueViolation = typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === "P2002";
      if (!isUniqueViolation) throw error;

      const createdByAnotherRequest = await withDatabaseRetry(
        () => prisma.portfolio.findUnique({ where: { id: 1 } }),
        { label: "portfolio seed race recovery" }
      );
      if (!createdByAnotherRequest) throw error;

      try {
        return normalizePortfolioContent(JSON.parse(createdByAnotherRequest.content), defaultContent) ?? defaultContent;
      } catch {
        return defaultContent;
      }
    }
  }

  try {
    const normalized = normalizePortfolioContent(JSON.parse(existing.content), defaultContent);
    if (!normalized) {
      console.error(
        "Stored portfolio content failed validation and was left untouched. "
          + "The site is rendering defaults; re-save from the admin dashboard to repair the record."
      );
    }
    return normalized ?? defaultContent;
  } catch (error) {
    console.error("Stored portfolio data is invalid JSON and was left untouched:", error);
    return defaultContent;
  }
}

export async function getPortfolioContent(): Promise<PortfolioContent> {
  const record = await withDatabaseRetry(
    () => prisma.portfolio.findUnique({ where: { id: 1 } }),
    { label: "portfolio content read" }
  );

  if (!record) {
    return ensurePortfolioSeed();
  }

  try {
    const content = normalizePortfolioContent(JSON.parse(record.content), defaultContent);
    if (!content) {
      return ensurePortfolioSeed();
    }
    return content;
  } catch (error) {
    console.error("Stored portfolio data is invalid JSON:", error);
    return ensurePortfolioSeed();
  }
}

export async function savePortfolioContent(content: PortfolioContent): Promise<void> {
  // An upsert is idempotent, so replaying it after a dropped connection cannot duplicate or
  // corrupt the single portfolio record.
  await withDatabaseRetry(
    () => prisma.portfolio.upsert({
      where: { id: 1 },
      update: { content: serializePortfolioContent(content) },
      create: { id: 1, content: serializePortfolioContent(content) }
    }),
    { label: "portfolio content save" }
  );
}
