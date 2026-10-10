import type { PortfolioContent } from "@/types";
import { BosdikField } from "@/features/bosdik/sections/shared/BosdikField";
import { SectionIntro } from "@/features/bosdik/sections/shared/SectionIntro";

export function ProfileSection({ content, onChange }: { content: PortfolioContent; onChange: (content: PortfolioContent) => void }) {
  const update = (patch: Partial<PortfolioContent["contact"]>) => onChange({
    ...content,
    location: patch.location ?? content.location,
    contact: { ...content.contact, ...patch, location: patch.location ?? content.contact.location }
  });
  return (
    <>
      <SectionIntro
          step="PUBLIC PROFILE"
          title="Manage your public contact details."
          description="Update the email address and location displayed on your public portfolio."
        />
      <div className="content-fields-grid">
        <BosdikField label="Public email" value={content.contact.email} onChange={(email) => update({ email })} type="email" placeholder="you@example.com" />
        <BosdikField label="Location" value={content.location} onChange={(location) => update({ location })} placeholder="City, Country" />
      </div>
    </>
  );
}
