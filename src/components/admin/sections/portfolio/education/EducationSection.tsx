import type { Education, PortfolioContent } from "@/types";
import { AdminField } from "@/components/admin/sections/shared/AdminField";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";
import "./EducationSection.css";
export function EducationSection({ content, onChange }: { content: PortfolioContent; onChange: (content: PortfolioContent) => void }) {
  const update = (patch: Partial<Education>) => onChange({ ...content, education: { ...content.education, ...patch } });
  return (
    <>
      <SectionIntro step="EDUCATION" title="Your education." description="Share your studies and activities beyond the classroom." />
      <div className="education-section">
        <div className="content-fields-grid">   
          <AdminField label="Degree or qualification" value={content.education.degree} onChange={(degree) => update({ degree })} placeholder="Degree or qualification" />
          <AdminField label="School or institution" value={content.education.institution} onChange={(institution) => update({ institution })} placeholder="Institution name" />
          <AdminField label="Study period" value={content.education.period} onChange={(period) => update({ period })} placeholder="2022 – 2025" />
          <AdminField label="Summary" value={content.education.summary} onChange={(summary) => update({ summary })} multiline placeholder="A short overview of your studies" />
          <AdminField label="Beyond the classroom" value={content.education.beyond} onChange={(beyond) => update({ beyond })} multiline placeholder="Clubs, activities, or interests" />
        </div>
      </div>
    </>
  );
}
