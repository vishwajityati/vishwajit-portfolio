import {
  ArrowUpRight,
  ChevronDown,
  Download,
  ExternalLink
} from "lucide-react";
import { useEffect, useState } from "react";
import type { PortfolioContent } from "@/types";
import { HeroOrb } from "./HeroOrb";
import "./hero.css";

export function Hero({ content }: { content: PortfolioContent }) {
  const [resumeMenuOpen, setResumeMenuOpen] = useState(false);
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    if (!content.roles.length) return;

    const interval = window.setInterval(() => {
      setRoleIndex((current) => (current + 1) % content.roles.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [content.roles]);

  return (
    <section className="hero section-shell" id="home">
      <div className="hero-copy">
        <h1>
          <span className="hero-name-primary">
            {content.name.split(" ")[0]}
          </span>
          <br />
          <span className="gradient-text">
            {content.name.split(" ").slice(1).join(" ") || "Developer"}
          </span>
        </h1>
        <div className="hero-actions">
          <a
            className="button button-primary"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
              window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
            }}
          >
            Let’s Talk 
          </a>
          <div className="resume-menu">
            <button
              className="button button-quiet"
              onClick={() => setResumeMenuOpen(!resumeMenuOpen)}
            >
              Resume
              <ChevronDown size={15} />
            </button>

            {resumeMenuOpen && (
              <div className="resume-dropdown">
                <a
                  href={content.resumeUrl || "/resume"}
                  target="_blank"
                  rel="noreferrer"
                  className="resume-option"
                >
                  <ExternalLink size={14} />
                  View resume
                </a>

                <a
                  href={content.resumeUrl || "/resume"}
                  download
                  className="resume-option"
                >
                  <Download size={14} />
                  Download resume
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <HeroOrb />
    </section>
  );
}
