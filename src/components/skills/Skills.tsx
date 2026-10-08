import {
  Monitor,
  Server,
  Code2,
  Database,
} from "lucide-react";
import type { ReactNode } from "react";
import type { PortfolioContent } from "@/types";
import "./Skills.css";

type SkillCategory = {
  number: string;
  title: string;
  icon: ReactNode;
  skills: PortfolioContent["education"][number]["skillGroups"][number]["skills"];
};

const categoryIcons = [
  <Monitor key="frontend" size={19} strokeWidth={1.8} />,
  <Server key="backend" size={19} strokeWidth={1.8} />,
  <Code2 key="programming" size={19} strokeWidth={1.8} />,
  <Database key="database" size={19} strokeWidth={1.8} />,
];

function getDots(level?: number) {
  if (typeof level !== "number") return 1;

  if (level >= 80) return 3;
  if (level >= 50) return 2;

  return 1;
}

function SkillCard({
  category,
  index,
}: {
  category: SkillCategory;
  index: number;
}) {
  return (
    <article
      className={`skill-card reveal reveal-delay-tight-${Math.min(
        index,
        3
      )}`}
    >
      <div className="skill-card-header">
        <div className="skill-card-icon">
          {category.icon}
        </div>

        <div className="skill-card-heading">
          <span className="skill-card-number">
            {category.number}
          </span>

          <h3>{category.title.toUpperCase()}</h3>
        </div>
      </div>

      <div className="skill-card-divider" />

      <div className="skill-list">
        {category.skills.map((skill, skillIndex) => {
          const dots = getDots(skill.level);

          return (
            <div
              className="skill-item"
              key={`${skill.name}-${skillIndex}`}
            >
              <span className="skill-name">
                {skill.name || "Unnamed skill"}
              </span>

              <span className="skill-indicator">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className={`skill-dot ${
                      dot < dots ? "active" : ""
                    }`}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function Skills({
  content,
}: {
  content: PortfolioContent;
}) {
  const skillCategories: SkillCategory[] =
    (content.education[0]?.skillGroups ?? []).map((group, index) => ({
      number: String(index + 1).padStart(2, "0"),
      title: group.title,
      icon: categoryIcons[index] ?? <Database size={19} strokeWidth={1.8} />,
      skills: group.skills,
    }));

  return (
    <section
      className="skills section-shell section-block"
      id="skills"
    >
      <div className="section-kicker reveal">
        
        <span>SKILLS</span>
        <i />
      </div>

      <div className="section-heading reveal">
        <div>

          <h2>
            Tools I{" "}
            <span className="gradient-text">Know.</span>
          </h2>
        </div>
      </div>

      <div className="skills-grid">
        {skillCategories.length === 0
          ? <p className="empty-state">Skills are on their way. Check back soon.</p>
          : skillCategories.map((category, index) => (
              <SkillCard
                key={category.title}
                category={category}
                index={index}
              />
            ))}
      </div>
    </section>
  );
}
