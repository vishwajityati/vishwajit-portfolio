import {
  Code2,
  Database,
  Monitor,
  Plus,
  Server,
  Trash2,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import type { PortfolioContent } from "@/types";
import { snapSkillLevel } from "@/lib/validations";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";

import "./SkillsSection.css";

type SkillCategory = {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
};
type SkillGroup =
  PortfolioContent["education"]["skillGroups"][number];

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    key: "frontend",
    title: "Frontend",
    description: "User interfaces and client-side development",
    icon: <Monitor size={16} />,
  },
  {
    key: "backend",
    title: "Backend",
    description: "Server-side development and APIs",
    icon: <Server size={16} />,
  },
  {
    key: "programming",
    title: "Programming Languages",
    description: "Languages used for development and problem solving",
    icon: <Code2 size={16} />,
  },
  {
    key: "database",
    title: "Database & Tools",
    description: "Databases, ORM, version control and development tools",
    icon: <Database size={16} />,
  },
];

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findExistingGroup(
  groups: SkillGroup[],
  category: SkillCategory,
  index: number,
): SkillGroup {
  const normalizedCategory = normalizeTitle(category.title);

  const exactMatch = groups.find((group) => {
    const normalizedGroup = normalizeTitle(group.title);

    if (normalizedGroup === normalizedCategory) {
      return true;
    }

    if (
      category.key === "frontend" &&
      (normalizedGroup.includes("frontend") ||
        normalizedGroup.includes("front end"))
    ) {
      return true;
    }

    if (
      category.key === "backend" &&
      (normalizedGroup.includes("backend") ||
        normalizedGroup.includes("back end"))
    ) {
      return true;
    }

    if (
      category.key === "programming" &&
      (normalizedGroup.includes("program") ||
        normalizedGroup.includes("language") ||
        normalizedGroup.includes("coding"))
    ) {
      return true;
    }

    if (
      category.key === "database" &&
      (normalizedGroup.includes("database") ||
        normalizedGroup.includes("database tools") ||
        normalizedGroup.includes("tools"))
    ) {
      return true;
    }

    return false;
  });

  if (exactMatch) {
    return {
      ...exactMatch,
      title: category.title,
    };
  }

  // If old data does not have recognizable category names,
  // preserve the existing order as a fallback.
  const fallbackGroup = groups[index];

  if (fallbackGroup) {
    return {
      ...fallbackGroup,
      title: category.title,
    };
  }

  return {
    title: category.title,
    skills: [],
  };
}

export function SkillsSection({
  content,
  onChange,
}: {
  content: PortfolioContent;
  onChange: (content: PortfolioContent) => void;
}) {
  const existingGroups = content.education.skillGroups;

  /*
   * Always expose exactly four categories in the Admin dashboard.
   *
   * The stored data still uses education.skillGroups, so this change
   * does not require a database migration.
   */
  const groups = SKILL_CATEGORIES.map((category, index) =>
    findExistingGroup(existingGroups, category, index),
  );

  const updateGroups = (next: SkillGroup[]) => {
    onChange({
      ...content,
      education: {
        ...content.education,
        skillGroups: next,
      },
    });
  };

  const updateGroup = (
    groupIndex: number,
    patch: Partial<SkillGroup>,
  ) => {
    const nextGroups = groups.map((group, index) =>
      index === groupIndex
        ? {
            ...group,
            ...patch,
            // Category names are controlled by the system.
            title: SKILL_CATEGORIES[index].title,
          }
        : group,
    );

    updateGroups(nextGroups);
  };

  const updateSkill = (
    groupIndex: number,
    skillIndex: number,
    patch: Partial<SkillGroup["skills"][number]>,
  ) => {
    const nextGroups = groups.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }

      return {
        ...group,
        title: SKILL_CATEGORIES[index].title,
        skills: group.skills.map((skill, position) =>
          position === skillIndex
            ? {
                ...skill,
                ...patch,
              }
            : skill,
        ),
      };
    });

    updateGroups(nextGroups);
  };

  const addSkill = (groupIndex: number) => {
    const nextGroups = groups.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }

      return {
        ...group,
        title: SKILL_CATEGORIES[index].title,
        skills: [
          ...group.skills,
          {
            name: "",
            level: 75,
          },
        ],
      };
    });

    updateGroups(nextGroups);
  };

  const removeSkill = (
    groupIndex: number,
    skillIndex: number,
  ) => {
    const nextGroups = groups.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }

      return {
        ...group,
        title: SKILL_CATEGORIES[index].title,
        skills: group.skills.filter(
          (_, position) => position !== skillIndex,
        ),
      };
    });

    updateGroups(nextGroups);
  };

  return (
    <>
      
        <div className="skills-admin-grid">
        {SKILL_CATEGORIES.map((category, groupIndex) => {
          const group = groups[groupIndex];

          return (
            <section
              className="skills-admin-card"
              key={category.key}
            >
              {/* Category header */}
              <div className="skills-admin-card-header">
                <div className="skills-admin-card-icon">
                  {category.icon}
                </div>

                <div className="skills-admin-card-title">
                  <span className="skills-admin-number">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>

                  <h3>{category.title}</h3>

                  <p>{category.description}</p>
                </div>

                <button
                  className="button button-quiet content-add-button"
                  type="button"
                  onClick={() => addSkill(groupIndex)}
                >
                  <Plus size={14} />
                  Add skill
                </button>
              </div>

              {/* Divider */}
              <div className="skills-admin-divider" />

              {/* Skills */}
              {group.skills.length === 0 ? (
                <div className="skills-admin-empty">
                  <Wrench size={15} />
                  <span>No skills added yet.</span>
                </div>
              ) : (
                <div className="skills-admin-list">
                  {group.skills.map((skill, skillIndex) => (
                    <div
                      className="skills-admin-row"
                      key={`${category.key}-${skillIndex}`}
                    >
                      <div className="skills-admin-skill-number">
                        {String(skillIndex + 1).padStart(2, "0")}
                      </div>

                      <div className="skills-admin-name">
                        <label
                          htmlFor={`skill-${groupIndex}-${skillIndex}`}
                        >
                          Skill
                        </label>

                        <input
                          id={`skill-${groupIndex}-${skillIndex}`}
                          value={skill.name}
                          placeholder={
                            category.key === "frontend"
                              ? "React"
                              : category.key === "backend"
                                ? "Node.js"
                                : category.key === "programming"
                                  ? "Java"
                                  : "PostgreSQL"
                          }
                          onChange={(event) =>
                            updateSkill(
                              groupIndex,
                              skillIndex,
                              {
                                name: event.target.value,
                              },
                            )
                          }
                        />
                      </div>

                      <div className="skills-admin-level">
                        <label
                          htmlFor={`level-${groupIndex}-${skillIndex}`}
                        >
                          Level
                        </label>

                        <div className="skills-admin-level-input">
                          <input
                            id={`level-${groupIndex}-${skillIndex}`}
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={skill.level}
                            onChange={(event) =>
                              updateSkill(
                                groupIndex,
                                skillIndex,
                                {
                                  level: snapSkillLevel(
                                    event.target.value,
                                  ),
                                },
                              )
                            }
                          />

                          <span>%</span>
                        </div>
                      </div>

                      <button
                        className="content-icon-button skills-admin-delete"
                        type="button"
                        aria-label={`Remove ${
                          skill.name || "skill"
                        }`}
                        onClick={() =>
                          removeSkill(
                            groupIndex,
                            skillIndex,
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}