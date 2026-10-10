import { ArrowUpRight, Code2, GraduationCap, Sparkles } from "lucide-react";
import type { PortfolioContent } from "@/types";
import "./experience.css";

const icons = [Code2, GraduationCap, Sparkles];

export function Experience({ content }: { content: PortfolioContent }) {
  return (
    <section className="experience section-shell section-block" id="experience">
      <div className="section-kicker reveal">
        <span></span>
        <span>EXPERIENCE</span>
        <i />
      </div>
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow"></p>
          <h2>
            <span className="gradient-text">Experience.</span>
          </h2>
        </div>
        <span className="heading-aside"></span>
      </div>
      <div className="experience-list">{content.experience.map((entry, index) => {
        const Icon = icons[index % icons.length];
        return (
          <article className={`experience-entry reveal reveal-delay-${Math.min(index, 7)}`} key={`${entry.title}-${index}`}>
            <div className="experience-rail"><span className="experience-dot"><Icon size={14} /></span></div>
            <div className="experience-main"><div className="experience-meta"><span>  </span><span>{entry.period}</span></div><h3>{entry.title}</h3><ul>{entry.points.map((point) => <li key={point}>{point}</li>)}</ul></div>

          </article>
        );
      })}</div>
    </section>
  );
}
