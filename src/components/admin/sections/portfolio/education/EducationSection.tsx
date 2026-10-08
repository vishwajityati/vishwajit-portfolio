import { ArrowRight, Plus, Trash2 } from "lucide-react";
import type { Education, PortfolioContent } from "@/types";
import { AdminField } from "@/components/admin/sections/shared/AdminField";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";
import "./EducationSection.css";
function EducationCard({ education, index, onChange, onRemove }: { education: Education; index: number; onChange: (education: Education) => void; onRemove: () => void }) {
  const update = (patch: Partial<Education>) => onChange({ ...education, ...patch });

  return (
    <article className="content-entry-card">
      <div className="content-entry-heading">
        <div><span className="content-entry-index">EDUCATION {String(index + 1).padStart(2, "0")}</span><h3>{education.degree || "New education"}</h3></div>
        <button className="content-icon-button" type="button" aria-label={`Remove education ${index + 1}`} onClick={onRemove}><Trash2 size={15} /></button>
      </div>
      <div className="content-fields-grid">
        <AdminField label="Degree or qualification" value={education.degree} onChange={(degree) => update({ degree })} placeholder="Degree or qualification" />
        <AdminField label="School or institution" value={education.institution} onChange={(institution) => update({ institution })} placeholder="Institution name" />
        <AdminField label="Study period" value={education.period} onChange={(period) => update({ period })} placeholder="2022 – 2025" />
        <AdminField label="Summary" value={education.summary} onChange={(summary) => update({ summary })} multiline placeholder="A short overview of your studies" />
        <AdminField label="Beyond the classroom" value={education.beyond} onChange={(beyond) => update({ beyond })} multiline placeholder="Clubs, activities, or interests" />
      </div>
    </article>
  );
}

export function EducationSection({ content, onChange }: { content: PortfolioContent; onChange: (content: PortfolioContent) => void }) {
  return (
    <>
      <SectionIntro step="EDUCATION" title="Your education." description="Share your studies and activities beyond the classroom." />
      <div className="education-section">
        <div className="education-editor-note">
          <span className="education-editor-step">ACADEMIC PROFILE</span>
          <p>Keep your qualifications, institutions, dates, and supporting details current. These fields are shown on your public resume.</p>
        </div>
        <div className="content-entry-list">
          {content.education.map((education, index) => (
            <EducationCard
              key={`education-${index}`}
              education={education}
              index={index}
              onChange={(nextEducation) => onChange({ ...content, education: content.education.map((item, itemIndex) => itemIndex === index ? nextEducation : item) })}
              onRemove={() => onChange({ ...content, education: content.education.filter((_, itemIndex) => itemIndex !== index) })}
            />
          ))}
        </div>
        <button className="button button-add-entry" type="button" onClick={() => onChange({ ...content, education: [...content.education, { degree: "", institution: "", period: "", summary: "", skillGroups: [], beyond: "" }] })}>
          <Plus size={15} /> Add education <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}
