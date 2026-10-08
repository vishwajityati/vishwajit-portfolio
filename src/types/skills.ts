export interface Skill {
  name: string;
  level: number;
}

export interface SkillGroup {
  title: string;
  skills: Skill[];
}

export interface Skills {
  frontend: Skill[];
  backend: Skill[];
  programmingLanguages: Skill[];
  databaseTools: Skill[];
}