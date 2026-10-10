import { ArrowUpRight, ExternalLink, Github, type LucideIcon } from "lucide-react";
import type { Project } from "@/types";

function ProjectLink({ href, children, secondary = false, icon: Icon }: { href: string; children: React.ReactNode; secondary?: boolean; icon: LucideIcon }) {
  const hasUrl = href.trim().length > 0;

  return (
    <a
      aria-disabled={!hasUrl}
      className={`arrow-link ${secondary ? "secondary" : ""} ${!hasUrl ? "disabled" : ""}`}
      href={hasUrl ? href : undefined}
      target={hasUrl && href.startsWith("http") ? "_blank" : undefined}
      rel={hasUrl && href.startsWith("http") ? "noreferrer" : undefined}
      tabIndex={hasUrl ? undefined : -1}
    >
      <Icon size={16} />
      {children}  
    </a>
  );
}

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className={`project-card ${project.featured ? "featured-project" : ""} reveal reveal-delay-tight-${Math.min(index, 3)}`}>
      <div className={`project-visual visual-${index % 3}`}>
        {/* A real <img> rather than an inline background-image, so the Content-Security-
            Policy needs no style-src 'unsafe-inline'. `imageUrl` is validated as
            http/https, and an <img> src cannot execute script either way. */}
        {project.imageUrl
          ? <img className="project-visual-image" src={project.imageUrl} alt={`${project.title} preview`} loading="lazy" decoding="async" />
          : <div className="visual-placeholder"><span className="visual-number">0{index + 1}</span> </div>}
        {project.featured}
      </div>
      <div className="project-body">
        <div className="project-heading"><h3>{project.title}</h3></div>
        <p>{project.description}</p>
        <div className="tag-row">{project.technologies.map((technology) => <span className="tech-tag" key={technology}>{technology}</span>)}</div>
        <div className="project-links">
          <ProjectLink href={project.liveUrl} icon={ExternalLink}>Live Demo</ProjectLink>
          <ProjectLink href={project.githubUrl} icon={Github} >GitHub URL</ProjectLink>
        </div>  
      </div>
    </article>
  );
}
