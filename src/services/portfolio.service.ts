import type { PortfolioContent } from "@/types";
import {
  getPortfolioContent,
  savePortfolioContent,
} from "@/lib/portfolio";

export async function getPortfolioService(): Promise<PortfolioContent> {
  return getPortfolioContent();
}

export async function updatePortfolioService(
  content: PortfolioContent,
): Promise<PortfolioContent> {
  await savePortfolioContent(content);

  return getPortfolioContent();
}