import { GraduationCap } from "lucide-react";
import type { PortfolioContent } from "@/types";
import "./Education.css";

export function Education({ content }: { content: PortfolioContent }) {
  const totalSkills = content.education.skillGroups.reduce((total, group) => total + group.skills.length, 0);

  return (
    <section className="education section-shell section-block" id="education">
      <div className="section-kicker reveal"><span></span><span>EDUCATION</span><i /></div>
      <div className="section-heading reveal"><div><h2>My <span className="gradient-text">Education.</span></h2></div><span className="heading-aside"></span></div>
      <article className="education-card reveal">
        <div className="education-icon"><GraduationCap size={26} strokeWidth={1.5} /></div>
        <div className="education-content">
          <div className="education-meta"><span>FORMAL EDUCATION</span><span className="timeline-period">{content.education.period}</span></div>
          <h3>{content.education.degree}</h3>
          <p className="institution">{content.education.institution}</p>
          <p className="education-description">{content.education.summary}</p>
          <div className="beyond-class"><span className="beyond-symbol">✳</span><div><span className="learning-label">BEYOND THE CLASSROOM</span><p>{content.education.beyond}</p></div></div>
          {/* The skill bars live in their own section now; this is a pointer, not a copy. */}
          {content.education.skillGroups.length > 0 && <p className="education-skill-teaser"><span className="learning-label">SKILLS IN THE TOOLKIT</span><a href="#skills">Explore {totalSkills} skills →</a></p>}
        </div>
        <div className="education-side-number">01</div>
      </article>
    </section>
  );
}
