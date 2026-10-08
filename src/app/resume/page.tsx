import { ResumeView } from "@/components/resume/ResumeView";
import { getPortfolioContent } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Résumé — Vishwajit Yati"
};

export default async function ResumePage() {
  const content = await getPortfolioContent();
  return <ResumeView content={content} />;
}
