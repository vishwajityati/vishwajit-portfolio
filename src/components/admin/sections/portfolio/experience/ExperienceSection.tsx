import { ArrowRight, Plus, Trash2 } from "lucide-react";
import type { Experience, PortfolioContent } from "@/types";
import { AdminField } from "@/components/admin/sections/shared/AdminField";
import { AdminTextList } from "@/components/admin/sections/shared/AdminTextList";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";

import "./ExperienceSection.css";

function ExperienceCard({ experience, index, onChange, onRemove }: { experience: Experience; index: number; onChange: (experience: Experience) => void; onRemove: () => void }) {
  const update = (patch: Partial<Experience>) => onChange({ ...experience, ...patch });
  return (
    <article className="content-entry-card">
      <div className="content-entry-heading">
        <div><span className="content-entry-index">EXPERIENCE {String(index + 1).padStart(2, "0")}</span><h3>{experience.title || "New experience"}</h3></div>
        <button className="content-icon-button" type="button" aria-label={`Remove experience ${index + 1}`} onClick={onRemove}><Trash2 size={15} /></button>
      </div>
      <div className="content-fields-grid">
        <AdminField label="Role or position" value={experience.title} onChange={(title) => update({ title })} placeholder="Role or position" />
        <AdminField label="Dates" value={experience.period} onChange={(period) => update({ period })} placeholder="2023 – Present" />
      </div>
      <AdminTextList title={`Experience ${index + 1} highlights`} items={experience.points} addLabel="Add highlight" placeholder="Describe an achievement or responsibility" onChange={(points) => update({ points })} multiline />
    </article>
  );
}

export function ExperienceSection({ content, onChange }: { content: PortfolioContent; onChange: (content: PortfolioContent) => void }) {
  return (
    <>
      <SectionIntro step="05 / EXPERIENCE" title="Experience and impact." description="Add your roles and a few highlights to show what you worked on." />
      <div className="content-entry-list">
        {content.experience.map((experience, index) => (
          <ExperienceCard
            key={`${experience.title}-${index}`}
            experience={experience}
            index={index}
            onChange={(nextExperience) => onChange({ ...content, experience: content.experience.map((item, itemIndex) => itemIndex === index ? nextExperience : item) })}
            onRemove={() => onChange({ ...content, experience: content.experience.filter((_, itemIndex) => itemIndex !== index) })}
          />
        ))}
      </div>
      <button className="button button-add-entry" type="button" onClick={() => onChange({ ...content, experience: [...content.experience, { title: "", period: "", points: [] }] })}>
        <Plus size={15} /> Add experience <ArrowRight size={14} />
      </button>
    </>
  );
}
