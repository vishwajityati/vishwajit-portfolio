"use client";

import { useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import type { PortfolioContent } from "@/types";

export function ResumeView({ content }: { content: PortfolioContent }) {
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("download")) return;
    const timer = window.setTimeout(() => window.print(), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="resume-page">
      <div className="resume-toolbar"><a className="admin-back" href="/"><ArrowLeft size={15} /> Back to portfolio</a><button className="button button-primary" onClick={() => window.print()}><Download size={15} /> Download as PDF</button></div>
      <article className="resume-sheet">
        <header className="resume-heading"><div><p className="eyebrow">FULL-STACK DEVELOPER</p><h1>{content.name}</h1><p className="resume-intro">{content.intro}</p></div><div className="resume-contact">{content.location && <span>{content.location}</span>}{content.contact.email && <span>{content.contact.email}</span>}{content.contact.linkedin && <span>{content.contact.linkedin.replace(/^https?:\/\//, "")}</span>}{content.contact.github && <span>{content.contact.github.replace(/^https?:\/\//, "")}</span>}</div></header>
        <section className="resume-section"><h2>PROFILE</h2>{content.about.slice(0, 2).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>
        <section className="resume-section"><h2>EXPERIENCE</h2>{content.experience.map((entry, index) => <div className="resume-entry" key={`${entry.title}-${index}`}><div className="resume-entry-heading"><h3>{entry.title}</h3><span>{entry.period}</span></div><ul>{entry.points.map((point) => <li key={point}>{point}</li>)}</ul></div>)}</section>
        <section className="resume-section"><h2>EDUCATION</h2>{content.education.map((entry, index) => <div className="resume-entry" key={`${entry.degree}-${index}`}><div className="resume-entry-heading"><h3>{entry.degree}</h3><span>{entry.period}</span></div><p>{entry.institution}</p><p>{entry.summary}</p></div>)}</section>
        <section className="resume-section"><h2>SKILLS</h2>{(content.education[0]?.skillGroups ?? []).map((group) => <div className="resume-entry" key={group.title}><div className="resume-entry-heading"><h3>{group.title}</h3></div><p>{group.skills.map((skill) => `${skill.name} (${skill.level}%)`).join(" · ")}</p></div>)}</section>
        <section className="resume-section"><h2>SELECTED PROJECTS</h2>{content.projects.map((project, index) => <div className="resume-entry" key={`${project.title}-${index}`}><div className="resume-entry-heading"><h3>{project.title}</h3><span>{project.technologies.join(" · ")}</span></div><p>{project.description}</p></div>)}</section>
      </article>
    </main>
  );
}
