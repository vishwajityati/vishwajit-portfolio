import { useState } from "react";
import type { ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowRight, Plus, Trash2, Upload, X } from "lucide-react";

import type { Project, PortfolioContent } from "@/types";
import { BosdikField } from "@/features/bosdik/sections/shared/BosdikField";
import { SectionIntro } from "@/features/bosdik/sections/shared/SectionIntro";


import "./ProjectsSection.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

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
      typeof project.liveUrl === "string" ? project.liveUrl : "",
    githubUrl:
      typeof project.githubUrl === "string" ? project.githubUrl : "",
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
    project.technologies.join(", "),
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const update = (patch: Partial<Project>) => {
    onChange(
      normalizeProject({
        ...project,
        ...patch,
      }),
    );
  };
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

async function handleImageUpload(
  event: ChangeEvent<HTMLInputElement>,
) {
  const input = event.currentTarget;
  const file = input.files?.[0];

  // Allow the same file to be selected again.
  input.value = "";

  if (!file) return;

  setUploadError("");

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    setUploadError(
      "Choose a JPG, PNG, WebP, or AVIF image.",
    );
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    setUploadError("The image must be 5 MB or smaller.");
    return;
  }

  setUploading(true);

  try {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload/token",
      clientPayload: JSON.stringify({
        kind: "portfolio-file",
      }),
    });

    if (
      !blob.url ||
      !blob.url.startsWith("https://")
    ) {
      throw new Error(
        "The server did not return a valid image URL.",
      );
    }

    // Save the uploaded image URL to this project.
    update({ imageUrl: blob.url });
  } catch (error: unknown) {
    console.error("Portfolio image upload failed:", error);

    setUploadError(
      error instanceof Error
        ? error.message
        : "Image upload failed. Please try again.",
    );
  } finally {
    setUploading(false);
  }
}

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
            setTechnologiesText(value.replace(/\s+/g, " "));
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

        <div className="project-image-upload">
          <label className="project-image-upload-label">
            Project image
          </label>

          {project.imageUrl && (
            <div className="project-image-preview">
              <img
                src={project.imageUrl}
                alt={`Preview of ${project.title || "project image"}`}
              />

              <button
                type="button"
                className="project-image-remove"
                aria-label="Remove project image"
                onClick={() => {
                  update({ imageUrl: "" });
                  setUploadError("");
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <label className="project-image-upload-button">
            <Upload size={16} />

            <span>
              {uploading
                ? "Uploading image..."
                : project.imageUrl
                  ? "Choose another image"
                  : "Upload project image"}
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleImageUpload}
              disabled={uploading}
              hidden
            />
          </label>

          <p className="project-image-help">
            JPG, PNG, WebP, or GIF. Maximum size: 5 MB.
          </p>

          {uploadError && (
            <p className="project-image-error" role="alert">
              {uploadError}
            </p>
          )}
        </div>

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
            update({ featured: event.target.checked })
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
  const updateProject = (index: number, project: Project) => {
    const projects = content.projects.map((item, itemIndex) =>
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
        {content.projects.map((project, index) => (
          <ProjectCard
            key={`project-${index}`}
            project={normalizeProject(project)}
            index={index}
            onChange={(nextProject) =>
              updateProject(index, nextProject)
            }
            onRemove={() => removeProject(index)}
          />
        ))}
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