import type { Education } from "./education";
import type { Experience } from "./experience";
import type { Project } from "./project";
import type { Skills } from "./skills";


export type { Education , SkillGroup } from "./education";
export type { Experience } from "./experience";
export type { Project } from "./project";
export type { Skills } from "./skills";

export interface Contact {
  email: string;
  linkedin: string;
  github: string;
  instagram: string;
  x: string;
  location: string;
}

export interface PortfolioSeo {
  title: string;
  description: string;
  keywords: string;
  imageUrl: string;
}

export interface PortfolioSiteSettings {
  name: string;
  url: string;
}

export interface PortfolioContent {
  name: string;
  intro: string;
  roles: string[];
  location: string;
  about: string[];
  photoUrl: string;
  resumeUrl: string;
  education: Education;
  skills: Skills;   
  projects: Project[];
  experience: Experience[];
  contact: Contact;
  seo: PortfolioSeo;
  siteSettings: PortfolioSiteSettings;
}

export const emptyPortfolio: PortfolioContent = {
  name: "",
  intro: "",
  roles: [],
  location: "",
  about: [],
  photoUrl: "",
  resumeUrl: "",

  education: {
    degree: "",
    institution: "",
    period: "",
    summary: "",
    skillGroups: [],
    beyond: "",
  },

  skills: {
    frontend: [],
    backend: [],
    programmingLanguages: [],
    databaseTools: [],
  },

  projects: [],
  experience: [],

  contact: {
    email: "",
    linkedin: "",
    github: "",
    instagram: "",
    x: "",
    location: "",
  },

  seo: {
    title: "",
    description: "",
    keywords: "",
    imageUrl: "",
  },

  siteSettings: {
    name: "",
    url: "",
  },
};
