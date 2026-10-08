export interface Skill {
  name: string;
  /**
   * Self-assessed proficiency, 0–100.
   *
   * The public bar is drawn from stepped CSS classes rather than an inline `width`, so the value
   * is snapped to the nearest 5 to guarantee a matching class always exists. That keeps
   * `style-src-attr 'none'` intact — see `.skill-bar-*` in components/skills/Skills.css.
   */
  level: number;
}

export interface SkillGroup {
  title: string;
  skills: Skill[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  summary: string;
  skillGroups: SkillGroup[];
  beyond: string;
}
