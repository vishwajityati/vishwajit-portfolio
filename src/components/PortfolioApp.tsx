"use client";
import { LockKeyhole } from "lucide-react";
import type { PortfolioContent } from "@/types";
import { About } from "./about/About";
import { AnimatedBackground } from "./background/AnimatedBackground";
import { Contact } from "./contact/Contact";
import { Education } from "./education/Education";
import { Experience } from "./experience/Experience";
import { Hero } from "./hero/Hero";
import { BottomNav } from "./navigation/BottomNav";
import { Projects } from "./projects/Projects";
import { Skills } from "./skills/Skills";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function PortfolioApp({ content }: { content: PortfolioContent }) {
  useScrollAnimation();
  const active = useActiveSection();

  return (
    <div className="portfolio">
      <AnimatedBackground />
      <main>
        <Hero content={content} />
        <About content={content} />
        <Skills content={content} />
        <Education content={content} />
        <Projects content={content} />
        <Experience content={content} />
        <Contact content={content} />
      </main>
      <BottomNav active={active} />
      <a className="admin-shortcut" href="/badmash-studio" aria-label="Open admin dashboard" title="Admin dashboard">
      <LockKeyhole size={14} /></a>
    </div>
  );
}
