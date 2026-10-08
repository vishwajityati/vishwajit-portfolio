import type { Metadata } from "next";
import { getPortfolioContent } from "@/lib/portfolio";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPortfolioContent();
  const title = content.seo.title || `${content.name} — Developer & Builder`;
  const description = content.seo.description || `The portfolio of ${content.name} — full-stack developer building thoughtful digital experiences.`;
  const keywords = content.seo.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean);
  const metadataBase = content.siteSettings.url ? new URL(content.siteSettings.url) : undefined;
  const openGraphImage = content.seo.imageUrl ? [{ url: content.seo.imageUrl }] : undefined;

  return {
    title,
    description,
    keywords,
    applicationName: content.siteSettings.name || `${content.name} Portfolio`,
    metadataBase,
    openGraph: { title, description, url: metadataBase, images: openGraphImage },
    twitter: { card: openGraphImage ? "summary_large_image" : "summary", title, description, images: openGraphImage }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
