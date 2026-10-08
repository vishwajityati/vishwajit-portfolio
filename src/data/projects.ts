import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    title: "Secquiority",
    description: "A security-focused digital product experience built to simplify cyber risk visibility and support smarter operational decision-making.",
    technologies: ["Next.js", "TypeScript", "Security", "UX Design"],
    imageUrl: "",
    liveUrl: "",
    githubUrl: "",
    featured: true
  },
  {
    title: "E-Commerce Platform",
    description: "A modern full-stack shopping platform designed around a clear, seamless shopping experience.",
    technologies: ["Next.js", "Node.js", "PostgreSQL", "Prisma"],
    imageUrl: "",
    liveUrl: "",
    githubUrl: "",
    featured: false
  },
  {
    title: "Clinic Management System",
    description: "A streamlined clinic system for organizing patient and appointment workflows.",
    technologies: ["Java", "MySQL"],
    imageUrl: "",
    liveUrl: "",
    githubUrl: "",
    featured: false
  },
  {
    title: "AI Resume Tool",
    description: "An AI-assisted resume tool exploring more helpful ways to improve job applications.",
    technologies: ["Next.js", "Gemini"],
    imageUrl: "",
    liveUrl: "",
    githubUrl: "",
    featured: false
  }
];
