import type { PortfolioContent } from "@/types";
import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";

export const defaultContent: PortfolioContent = {
  name: "Vishwajit Yati",
  intro: "I build thoughtful digital experiences for the web.",
  roles: ["Full-stack developer", "Curious problem solver", "Always building"],
  location: "Mumbai, India",
  about: [
    "I’m a passionate software developer focused on building modern, responsive, and user-friendly web applications. I enjoy turning ideas into real-world products and continuously improving my skills by learning, experimenting, and building projects.",
    "My current focus is on full-stack web development, with technologies such as JavaScript, React, Next.js, Node.js, and databases. I’m also strengthening my foundation in Java, Data Structures & Algorithms, and software development principles.",
    "I believe the best way to learn technology is by building. Every project I work on gives me an opportunity to solve problems, explore new technologies, and write better code.",
    "I’m currently working toward becoming a strong full-stack developer, while exploring areas such as AI, automation, and modern software architecture.",
    "Outside of coding, I enjoy learning new technologies, experimenting with ideas, and challenging myself to build something better with every project."
  ],
  photoUrl: "",
  resumeUrl: "",
  education,
 skills: {
    frontend: [],
    backend: [],
    programmingLanguages: [],
    databaseTools: [],
  },
  projects,
  experience,
  contact: {
  email: "your@email.com",
  linkedin: "https://linkedin.com/in/your-profile",
  github: "https://github.com/your-username",
  instagram: "",
  x: "",
  location: "Mumbai, India"
},
  seo: {
    title: "Vishwajit Yati — Developer & Builder",
    description: "The portfolio of Vishwajit Yati — full-stack developer building thoughtful digital experiences.",
    keywords: "Vishwajit Yati, full-stack developer, portfolio",
    imageUrl: ""
  },
  siteSettings: {
    name: "Vishwajit Yati Portfolio",
    url: ""
  }
};
