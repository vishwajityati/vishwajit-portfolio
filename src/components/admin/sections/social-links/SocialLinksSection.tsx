import type { PortfolioContent } from "@/types";
import { AdminField } from "@/components/admin/sections/shared/AdminField";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";

export function SocialLinksSection({
  content,
  onChange
}: {
  content: PortfolioContent;
  onChange: (content: PortfolioContent) => void;
}) {
  const update = (patch: Partial<PortfolioContent["contact"]>) =>
    onChange({
      ...content,
      contact: {
        ...content.contact,
        ...patch
      }
    });

  return (
    <>
      <SectionIntro
        step="SOCIAL LINKS"
        title="Your social links."
        description="Add the profiles visitors can use to find your work and connect with you."
      />

      <div className="content-fields-grid">
        <AdminField
          label="LinkedIn profile"
          value={content.contact.linkedin}
          onChange={(linkedin) => update({ linkedin })}
          type="url"
          placeholder="https://linkedin.com/in/your-profile"
        />

        <AdminField
          label="GitHub profile"
          value={content.contact.github}
          onChange={(github) => update({ github })}
          type="url"
          placeholder="https://github.com/your-username"
        />

        <AdminField
          label="Instagram profile"
          value={content.contact.instagram}
          onChange={(instagram) => update({ instagram })}
          type="url"
          placeholder="https://instagram.com/your-username"
        />

        <AdminField
          label="X profile"
          value={content.contact.x}
          onChange={(x) => update({ x })}
          type="url"
          placeholder="https://x.com/your-username"
        />
      </div>
    </>
  );
}