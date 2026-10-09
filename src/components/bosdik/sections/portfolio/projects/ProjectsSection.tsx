import { ArrowRight, Plus, Trash2 } from "lucide-react";
import type { Project, PortfolioContent } from "@/types";
import { BosdikField } from "@/components/bosdik/sections/shared/BosdikField";
import { SectionIntro } from "@/components/bosdik/sections/shared/SectionIntro";

import { useState } from "react";

import "./ProjectsSection.css";

function normalizeProject(project: Project): Project {
  return {
    title: typeof project.title === "string" ? project.title : "",
    description:
      typeof project.description === "string"
        ? project.description
        : "",
    technologies: Array.isArray(project.technologies)
      ? project.technologies.filter(
          (technology): technology is string =>
            typeof technology === "string",
        )
      : [],
    imageUrl:
      typeof project.imageUrl === "string"
        ? project.imageUrl
        : "",
    liveUrl:
      typeof project.liveUrl === "string"
        ? project.liveUrl
        : "",
    githubUrl:
      typeof project.githubUrl === "string"
        ? project.githubUrl
        : "",
    featured: Boolean(project.featured),
  };
}

function ProjectCard({
  project,
  index,
  onChange,
  onRemove,
}: {
  project: Project;
  index: number;
  onChange: (project: Project) => void;
  onRemove: () => void;
}) {
  const [technologiesText, setTechnologiesText] = useState(
    project.technologies.join(", ")
  );
  const update = (patch: Partial<Project>) => {
    onChange(
      normalizeProject({
        ...project,
        ...patch,
      }),
    );
  };

  return (
    <article className="content-entry-card">
      <div className="content-entry-heading">
        <button
          className="content-icon-button"
          type="button"
          aria-label={`Remove project ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="content-fields-grid">
        <BosdikField
          label="Project title"
          value={project.title}
          onChange={(title) => update({ title })}
          placeholder="Project name"
        />
        <BosdikField
          label="Technologies (comma separated)"
          value={technologiesText}
          onChange={(value) => {
            const cleanedValue = value.replace(/\s+/g, " ");

            setTechnologiesText(cleanedValue);
          }}
          onBlur={() => {
            update({
              technologies: technologiesText
                .trim()
                .split(",")
                .map((technology) => technology.trim())
                .filter(Boolean),
            });
          }}
          placeholder="Next.js, TypeScript, Prisma"
        />

        <BosdikField
          label="Description"
          value={project.description}
          onChange={(description) => update({ description })}
          multiline
          placeholder="What did you build?"
        />

        <BosdikField
          label="Image URL"
          value={project.imageUrl}
          onChange={(imageUrl) => update({ imageUrl })}
          type="url"
          placeholder="https://example.com/image.jpg"
        />

        <BosdikField
          label="Live project URL"
          value={project.liveUrl}
          onChange={(liveUrl) => update({ liveUrl })}
          type="url"
          placeholder="https://example.com"
        />

        <BosdikField
          label="Source code URL"
          value={project.githubUrl}
          onChange={(githubUrl) => update({ githubUrl })}
          type="url"
          placeholder="https://github.com/..."
        />
      </div>

      <label className="content-checkbox">
        <input
          type="checkbox"
          checked={project.featured}
          onChange={(event) =>
            update({
              featured: event.target.checked,
            })
          }
        />

        <span>Feature this project on my portfolio</span>
      </label>
    </article>
  );
}

export function ProjectsSection({
  content,
  onChange,
}: {
  content: PortfolioContent;
  onChange: (content: PortfolioContent) => void;
}) {
  const updateProject = (
    index: number,
    project: Project,
  ) => {
    const projects = content.projects.map(
      (item, itemIndex) =>
        itemIndex === index
          ? normalizeProject(project)
          : normalizeProject(item),
    );
    onChange({
      ...content,
      projects,
    });
  };

  const removeProject = (index: number) => {
    onChange({
      ...content,
      projects: content.projects
        .filter((_, itemIndex) => itemIndex !== index)
        .map(normalizeProject),
    });
  };

  const addProject = () => {
    const newProject: Project = {
      title: "",
      description: "",
      technologies: [],
      imageUrl: "",
      liveUrl: "",
      githubUrl: "",
      featured: false,
    };

    onChange({
      ...content,
      projects: [
        ...content.projects.map(normalizeProject),
        newProject,
      ],
    });
  };

  return (
    <>
      <SectionIntro
        step="PROJECTS"
        title="Show what you have built."
        description="Add project details, technologies, screenshots, and links. Mark a project as featured to highlight it."
      />

      <div className="content-entry-list">
        {content.projects.map((project, index) => {
          const normalizedProject =
            normalizeProject(project);

          return (
            <ProjectCard
              key={`project-${index}`}
              project={normalizedProject}
              index={index}
              onChange={(nextProject) =>
                updateProject(index, nextProject)
              }
              onRemove={() => removeProject(index)}
            />
          );
        })}
      </div>

      <button
        className="button button-add-entry"
        type="button"
        onClick={addProject}
      >
        <Plus size={15} />
        Add a project
        <ArrowRight size={14} />
      </button>
    </>
  );
}
