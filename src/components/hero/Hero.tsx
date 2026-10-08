import {
  ArrowUpRight,
  ChevronDown,
  Download,
  ExternalLink
} from "lucide-react";
import { useState ,useEffect} from "react";
import type { PortfolioContent } from "@/types";
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
        <p className="hero-eyebrow"><span className="status-dot" /> HELLO, I’M {content.name.toUpperCase()}</p>
        <h1>
            <span className="hero-name-primary">
              {content.name.split(" ")[0]}
            </span>
            <br />
            <span className="gradient-text">
              {content.name.split(" ").slice(1).join(" ") || "Developer"}
            </span>
            <span className="hero-star">✳</span>
          </h1>

          <p className="hero-intro">{content.intro}</p>

          {content.roles.length > 0 && (
            <p className="hero-role" key={content.roles[roleIndex]}>
              {content.roles[roleIndex]}
            </p>
          )}

          <div className="hero-actions">
          <a className="button button-primary"
            href="#contact">Let’s talk <ArrowUpRight size={16} />
          </a>
          <div className="resume-menu">
            <button
              className="button button-quiet"
              onClick={() => setResumeMenuOpen(!resumeMenuOpen)}
            >
              Résumé
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
                  View résumé
                </a>

                <a
                  href={content.resumeUrl || "/resume"}
                  download
                  className="resume-option"
                >
                  <Download size={14} />
                  Download résumé
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="hero-orbit-mark" aria-hidden="true"><span>V</span><i /><b /></div>
    </section>
  );
}
