"use client";

import type { PortfolioContent } from "@/types";
import { BosdikField } from "@/components/bosdik/sections/shared/BosdikField";
import { BosdikTextList } from "@/components/bosdik/sections/shared/BosdikTextList";
import { SectionIntro } from "@/components/bosdik/sections/shared/SectionIntro";

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
          <BosdikField
            label="Your name"
            value={content.name}
            onChange={(name) => update({ name })}
            placeholder="Your name"
          />

          <BosdikField
            label="Location"
            value={content.location}
            onChange={(location) => update({ location })}
            placeholder="City, Country"
          />

          <BosdikField
            label="Introduction"
            value={content.intro}
            onChange={(intro) => update({ intro })}
            multiline
            placeholder="A short introduction for your homepage"
          />
        </div>

        <BosdikTextList
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
