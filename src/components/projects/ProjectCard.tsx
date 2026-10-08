import { ArrowUpRight, Code2, Sparkles } from "lucide-react";
import type { Project } from "@/types";

function ArrowLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return <a className={`arrow-link ${secondary ? "secondary" : ""}`} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{children}<ArrowUpRight size={16} /></a>;
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
          : <div className="visual-placeholder"><span className="visual-number">0{index + 1}</span><Code2 size={42} strokeWidth={1.3} /><span className="visual-caption">A PROJECT BY {project.title.split(" ")[0].toUpperCase()}</span></div>}
        {project.featured && <span className="featured-tag"><Sparkles size={12} /> FEATURED PROJECT</span>}
        <span className="visual-corner">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="project-body">
        <div className="project-heading"><h3>{project.title}</h3><ArrowUpRight className="project-arrow" size={19} /></div>
        <p>{project.description}</p>
        <div className="tag-row">{project.technologies.map((technology) => <span className="tech-tag" key={technology}>{technology}</span>)}</div>
        <div className="project-links">
          {project.liveUrl && <ArrowLink href={project.liveUrl}>Live demo</ArrowLink>}
          {project.githubUrl && <ArrowLink href={project.githubUrl} secondary>Source code</ArrowLink>}
          {!project.liveUrl && !project.githubUrl && <span className="edit-hint">Add project links in the admin dashboard</span>}
        </div>
      </div>
    </article>
  );
}
