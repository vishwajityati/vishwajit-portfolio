import { Sparkles } from "lucide-react";
import type { PortfolioContent } from "@/types";
import "./About.css";

export function About({ content }: { content: PortfolioContent }) {
  const initials = content.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("");

  return (
    <section className="about section-shell section-block" id="about">
      {/* Section heading */}
      <div className="section-kicker reveal">
        <span>ABOUT ME</span>
        <i />
      </div>

      <div className="about-layout">
        {/* Portrait */}
        <div className="portrait-column reveal">
          <div className="portrait-frame">
            <div
              className={`portrait-image ${
                content.photoUrl ? "" : "portrait-placeholder"
              }`}
            >
              {content.photoUrl ? (
                <img
                  className="portrait-photo"
                  src={content.photoUrl}
                  alt={`${content.name} portrait`}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <>
                  <div className="portrait-halo" />

                  <span className="portrait-initials">
                    {initials}
                  </span>

                  <span className="portrait-add-note">
                    ADD YOUR PHOTO IN THE DASHBOARD
                  </span>
                </>
              )}
            </div>

            {/* Dynamic location from Admin → Profile */}
            <span className="portrait-coordinate">
              {content.location}
            </span>

            {/* Decorative design text */}
            <div className="portrait-side-label">
              BUILDING THINGS THAT MATTER <span>✳</span>
            </div>
          </div>

          <div className="portrait-caption">
            <span>THE PERSON BEHIND THE CODE</span>
            <span>FIG. 01</span>
          </div>
        </div>

        {/* About content */}
        <div className="about-copy reveal">
          <h2>
            Curious by nature.
            <br />
            <span className="gradient-text">
              Developer by choice.
            </span>
          </h2>

          {/* Dynamic About content from Neon */}
          {content.about.map((paragraph, index) => (
            <p
              key={`${index}-${paragraph.slice(0, 15)}`}
            >
              {paragraph}
            </p>
          ))}

          {/* Decorative footer */}
          <div className="about-footnote">
            <Sparkles size={14} />
            <span>LEARNING SOMETHING NEW, EVERY DAY</span>
          </div>
        </div>
      </div>
    </section>
  );
}