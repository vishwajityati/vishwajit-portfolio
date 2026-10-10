import type { PortfolioContent } from "@/types";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

export function Projects({ content }: { content: PortfolioContent }) {
  const featured = content.projects.find((project) => project.featured);
  const remainingProjects = content.projects.filter((project) => project !== featured);

  return (
    <section className="projects section-shell section-block" id="projects">
      <div className="section-kicker reveal"><span></span><span>PROJECTS</span><i /></div>
      <div className="section-heading reveal">
        <div>
          <h1 className="eyebrow">Projects</h1>
        </div>
        <span className="heading-aside" />
      </div>
      {featured && <ProjectCard project={featured} index={0} />}
      <div className="project-grid">{remainingProjects.map((project, index) => <ProjectCard project={project} index={index + 1} key={`${project.title}-${index}`} />)}</div>
      {!content.projects.length && <p className="empty-state">Projects are on their way. Check back soon.</p>}
    </section>
  );
}
