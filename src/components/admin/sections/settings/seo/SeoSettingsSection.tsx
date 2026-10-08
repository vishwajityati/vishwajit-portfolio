import type { PortfolioContent } from "@/types";
import { AdminField } from "@/components/admin/sections/shared/AdminField";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";

export function SeoSettingsSection({ content, onChange }: { content: PortfolioContent; onChange: (content: PortfolioContent) => void }) {
  const update = (patch: Partial<PortfolioContent["seo"]>) => onChange({ ...content, seo: { ...content.seo, ...patch } });
  return (
    <>
      <SectionIntro step="SEARCH & SHARING" title="SEO and social previews." description="Control the page title, search description, keywords, and image shown when your site is shared." />
      <div className="content-fields-grid">
        <AdminField label="Page title" value={content.seo.title} onChange={(title) => update({ title })} placeholder={`${content.name} — Portfolio`} />
        <AdminField label="Keywords (comma separated)" value={content.seo.keywords} onChange={(keywords) => update({ keywords })} placeholder="developer, portfolio, projects" />
        <AdminField label="Search description" value={content.seo.description} onChange={(description) => update({ description })} multiline placeholder="A concise summary of your portfolio" />
        <AdminField label="Social preview image URL" value={content.seo.imageUrl} onChange={(imageUrl) => update({ imageUrl })} type="url" placeholder="https://example.com/social-preview.png" />
      </div>
    </>
  );
}
