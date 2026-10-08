"use client";

import type { PortfolioContent } from "@/types";
import { AdminField } from "@/components/admin/sections/shared/AdminField";
import { AdminTextList } from "@/components/admin/sections/shared/AdminTextList";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";

import "./HeroSection.css";

export function HeroSection({
  content,
  onChange,
}: {
  content: PortfolioContent;
  onChange: (content: PortfolioContent) => void;
}) {
  const update = (patch: Partial<PortfolioContent>) =>
    onChange({ ...content, ...patch });

  return (
    <>
      <SectionIntro
        step="HERO"
        title="Make a strong first impression."
        description="Edit the headline, introduction, and professional roles shown at the top of your portfolio."
      />

      <div className="hero-section">
        <div className="content-fields-grid">
          <AdminField
            label="Your name"
            value={content.name}
            onChange={(name) => update({ name })}
            placeholder="Your name"
          />

          <AdminField
            label="Location"
            value={content.location}
            onChange={(location) => update({ location })}
            placeholder="City, Country"
          />

          <AdminField
            label="Introduction"
            value={content.intro}
            onChange={(intro) => update({ intro })}
            multiline
            placeholder="A short introduction for your homepage"
          />
        </div>

        <AdminTextList
          title="Professional roles"
          items={content.roles}
          addLabel="Add role"
          placeholder="Full-stack developer"
          onChange={(roles) => update({ roles })}
        />
      </div>
    </>
  );
}