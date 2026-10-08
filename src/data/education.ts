import type { Education } from "@/types/education";

export const education: Education[] = [{
  degree: "Bachelor of Computer Applications",
  institution: "Chatrapati Shivaji Maharaj University, Panvel",
  period: "2025 – Present",
  summary: "My BCA journey is helping me build a strong foundation in computer science and software development. Alongside my academic studies, I actively learn through practical projects and independent exploration.",
  skillGroups: [
    {
      title: "Frontend Development",
      skills: [
        { name: "React", level: 90 },
        { name: "Next.js", level: 80 },
        { name: "JavaScript", level: 90 },
        { name: "HTML/CSS", level: 95 }
      ]
    },
    {
      title: "Backend Development",
      skills: [
        { name: "Node.js", level: 80 },
        { name: "Express.js", level: 80 },
        { name: "Java", level: 70 }
      ]
    },
    {
      title: "Database",
      skills: [
        { name: "PostgreSQL", level: 80 },
        { name: "MySQL", level: 80 },
        { name: "Prisma", level: 70 }
      ]
    }
  ],
  beyond: "I believe programming is best learned by building. I regularly experiment with new technologies, create projects, solve programming problems, and explore areas such as AI and modern web development."
}];
