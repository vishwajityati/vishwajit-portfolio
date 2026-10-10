import { PortfolioApp } from "@/features/portfolio/PortfolioApp";
import { getPortfolioContent } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getPortfolioContent();
  return <PortfolioApp content={content} />;
}
