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
              ) : null}
            </div>
          </div>
        </div>
        {/* About content */}
        <div className="about-copy reveal">
          <h2>
            Learning new things{" "}
            <span className="gradient-text">
               exploring technologies Improving My Skills.
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
        </div>
      </div>
    </section>
  );
}