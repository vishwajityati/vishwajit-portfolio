"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  Globe2,
  GraduationCap,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import type { PortfolioContent } from "@/types";
import type { InboxSummary } from "@/features/bosdik/MessageInbox/MessageInbox";
import { ExperienceSection } from "@/features/bosdik/sections/portfolio/experience/ExperienceSection";
import { EducationSection } from "@/features/bosdik/sections/portfolio/education/EducationSection";
import { AboutSection } from "@/features/bosdik/sections/portfolio/about/AboutSection";
import { SkillsSection } from "@/features/bosdik/sections/portfolio/skills/SkillsSection";
import { ProjectsSection } from "@/features/bosdik/sections/portfolio/projects/ProjectsSection";
import { ResumeSection } from "@/features/bosdik/sections/portfolio/resume/ResumeSection";
import { MessagesSection } from "@/features/bosdik/sections/messages/MessagesSection";
import { OverviewSection } from "@/features/bosdik/sections/overview/OverviewSection";
import { ProfileSection } from "@/features/bosdik/sections/profile/ProfileSection";
import { SocialLinksSection } from "@/features/bosdik/sections/social-links/SocialLinksSection";
import { BosdikAccountSection } from "@/features/bosdik/sections/settings/bosdik-account/BosdikAccountSection";
import { PasswordSection } from "@/features/bosdik/sections/settings/password/PasswordSection";
import { TwoFactorSection } from "@/features/bosdik/sections/settings/security/TwoFactorSection";
import { SecurityStatusSection } from "@/features/bosdik/sections/settings/security/SecurityStatusSection";
import { SeoSettingsSection } from "@/features/bosdik/sections/settings/seo/SeoSettingsSection";
import { SiteSettingsSection } from "@/features/bosdik/sections/settings/site-settings/SiteSettingsSection";

import "./BosdikDashboard.css";

export type BosdikSection =
  | "overview"
  | "hero"
  | "about"
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "resume"
  | "messages"
  | "profile"
  | "social-links"
  | "bosdik-account"
  | "password"
  | "security-status"
  | "security"
  | "seo"
  | "site-settings";

interface BosdikDashboardProps {
  content: PortfolioContent;
  savedContent: PortfolioContent | null;
  inboxSummary: InboxSummary;
  busy: boolean;
  error: string;
  message: string;
  activeSection: BosdikSection;
  onSectionChange: (section: BosdikSection) => void;
  onSave: () => void;
  onDiscard: () => void;
  onContentChange: (content: PortfolioContent) => void;
  onInboxSummaryChange: (summary: InboxSummary) => void;
  onLogout: () => void;
}

interface NavLink {
  id: BosdikSection;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  icon: typeof LayoutDashboard;
  items: NavLink[];
}

const mainLinks: NavLink[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard }
];

const portfolioGroup: NavGroup = {
  label: "Portfolio",
  icon: PenLine,
  items: [
    { id: "about", label: "About", icon: UserRound },
    { id: "skills", label: "Skills", icon: BookOpen },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "experience", label: "Experience", icon: BriefcaseBusiness },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "resume", label: "Resume", icon: FileText }
  ]
};

const messageLinks: NavLink[] = [
  { id: "messages", label: "Messages", icon: Inbox }
];

const profileLinks: NavLink[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "social-links", label: "Social Links", icon: Globe2 }
];

const settingsGroup: NavGroup = {
  label: "Settings",
  icon: Settings,
  items: [
    { id: "bosdik-account", label: "Admin Account", icon: UsersRound },
    { id: "password", label: "Access Code", icon: KeyRound },
    { id: "security-status", label: "Security Status", icon: ShieldCheck },
    { id: "security", label: "Two-Factor Auth", icon: Smartphone },
    { id: "seo", label: "SEO", icon: Search },
    { id: "site-settings", label: "Site Settings", icon: Globe2 }
  ]
};

const sectionLabels: Record<BosdikSection, string> = {
  overview: "Overview",
  hero: "Hero",
  about: "About",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  resume: "Resume",
  messages: "Messages",
  profile: "Profile",
  "social-links": "Social Links",
  "bosdik-account": "Admin Account",
  password: "Access Code",
  "security-status": "Security Status",
  security: "Two-Factor Auth",
  seo: "SEO",
  "site-settings": "Site Settings"
};

const portfolioSections: BosdikSection[] = ["hero", "about", "skills", "projects", "experience", "education", "resume", "profile", "social-links", "seo", "site-settings"];

function SidebarLink({ link, active, badge, onClick }: { link: NavLink; active: boolean; badge?: number; onClick: () => void }) {
  const Icon = link.icon;
  return (
    <button className={active ? "admin-sidebar-link is-active" : "admin-sidebar-link"} type="button" aria-current={active ? "page" : undefined} onClick={onClick}>
      <Icon size={16} />
      <span>{link.label}</span>
      {badge !== undefined && badge > 0 && <span className="admin-sidebar-badge">{badge}</span>}
    </button>
  );
}

function SidebarGroup({ group, activeSection, onNavigate, badge }: { group: NavGroup; activeSection: BosdikSection; onNavigate: (section: BosdikSection) => void; badge?: number }) {
  const active = group.items.some((item) => item.id === activeSection);
  const [open, setOpen] = useState(active);
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const Icon = group.icon;
  return (
    <div className={active ? "admin-sidebar-group is-active" : "admin-sidebar-group"}>
      <button className="admin-sidebar-group-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Icon size={16} />
        <span>{group.label}</span>
        {badge !== undefined && badge > 0 && <span className="admin-sidebar-badge">{badge}</span>}
        {open ? <ChevronDown className="admin-sidebar-chevron" size={14} /> : <ChevronRight className="admin-sidebar-chevron" size={14} />}
      </button>
      {open && (
        <div className="admin-sidebar-subnav">
          {group.items.map((item) => <SidebarLink key={item.id} link={item} active={activeSection === item.id} onClick={() => onNavigate(item.id)} />)}
        </div>
      )}
    </div>
  );
}

function BosdikSidebar({ activeSection, unreadCount, onNavigate, onLogout, onClose }: { activeSection: BosdikSection; unreadCount: number; onNavigate: (section: BosdikSection) => void; onLogout: () => void; onClose: () => void }) {
  return (
    <aside className="admin-sidebar" id="admin-navigation">
      <div className="admin-sidebar-mobile-header">
        <a href="/" className="brand admin-sidebar-brand" aria-label="Back to portfolio home">
          <span className="brand-mark">Vishwajit{" "}</span>
          <span className="brand-name">Portfolio <span></span></span>
        </a>
         <button
           className="admin-sidebar-close"
           type="button"
           aria-label="Close navigation"
           onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
           onMouseDown={(event) => event.stopPropagation()}
           onTouchStart={(event) => event.stopPropagation()}
           onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
         >
           <X size={18} />
         </button>
      </div>
      <div className="admin-sidebar-caption">DASHBOARD</div>
       <nav className="admin-sidebar-nav" aria-label="Admin dashboard" onClick={onClose}>
        {mainLinks.map((link) => <SidebarLink key={link.id} link={link} active={activeSection === link.id} onClick={() => onNavigate(link.id)} />)}
        <SidebarGroup group={portfolioGroup} activeSection={activeSection} onNavigate={onNavigate} />
        {messageLinks.map((link) => <SidebarLink key={link.id} link={link} active={activeSection === link.id} badge={unreadCount} onClick={() => onNavigate(link.id)} />)}
        {profileLinks.map((link) => <SidebarLink key={link.id} link={link} active={activeSection === link.id} onClick={() => onNavigate(link.id)} />)}
        <SidebarGroup group={settingsGroup} activeSection={activeSection} onNavigate={onNavigate} />
      </nav>
      <div className="admin-sidebar-footer">
        <button className="admin-sidebar-link admin-logout-link" type="button" onClick={onLogout}><LogOut size={16} /><span>Logout</span></button>
      </div>
    </aside>
  );
}

function SectionPanel({ section, content, inboxSummary, onNavigate, onContentChange, onInboxSummaryChange }: {
  section: BosdikSection;
  content: PortfolioContent;
  inboxSummary: InboxSummary;
  onNavigate: (section: BosdikSection) => void;
  onContentChange: (content: PortfolioContent) => void;
  onInboxSummaryChange: (summary: InboxSummary) => void;
}) {
  switch (section) {
    case "overview": return <OverviewSection content={content} inboxSummary={inboxSummary} onNavigate={onNavigate} />;
    case "about": return <AboutSection content={content} onChange={onContentChange} />;
    case "skills": return <SkillsSection content={content} onChange={onContentChange} />;
    case "projects": return <ProjectsSection content={content} onChange={onContentChange} />;
    case "experience": return <ExperienceSection content={content} onChange={onContentChange} />;
    case "education": return <EducationSection content={content} onChange={onContentChange} />;
    case "resume": return <ResumeSection content={content} onChange={onContentChange} />;
    case "messages": return <MessagesSection onSummaryChange={onInboxSummaryChange} />;
    case "profile": return <ProfileSection content={content} onChange={onContentChange} />;
    case "social-links": return <SocialLinksSection content={content} onChange={onContentChange} />;
    case "bosdik-account": return <BosdikAccountSection />;
    case "password": return <PasswordSection />;
    case "security-status": return <SecurityStatusSection />;
    case "security": return <TwoFactorSection />;
    case "seo": return <SeoSettingsSection content={content} onChange={onContentChange} />;
    case "site-settings": return <SiteSettingsSection content={content} onChange={onContentChange} emailNotificationsEnabled={inboxSummary.emailNotificationsEnabled} />;
  }
}

export function BosdikDashboard({
  content,
  savedContent,
  inboxSummary,
  busy,
  error,
  message,
  activeSection,
  onSectionChange,
  onSave,
  onDiscard,
  onContentChange,
  onInboxSummaryChange,
  onLogout
}: BosdikDashboardProps) {
  const isDirty = JSON.stringify(content) !== JSON.stringify(savedContent);
  const isEditable = portfolioSections.includes(activeSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);
  const navigate = (section: BosdikSection) => {
    onSectionChange(section);
    closeSidebar();
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className={`admin-dashboard-layout${sidebarOpen ? " sidebar-is-open" : ""}`}>
      <header className="admin-mobile-header">
        <button className="admin-mobile-menu" type="button" aria-label="Open navigation" aria-controls="admin-navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
        <a href="/" className="admin-mobile-brand" aria-label="Back to portfolio home">
          <span className="brand-mark">V.Y</span>
          <span className="brand-name"> <span>STUDIO</span></span>
        </a>
      </header>
      <button className={`mobile-sidebar-overlay${sidebarOpen ? " is-open" : ""}`} type="button" aria-label="Close navigation" onClick={closeSidebar} tabIndex={sidebarOpen ? 0 : -1} />
      <BosdikSidebar activeSection={activeSection} unreadCount={inboxSummary.unreadCount} onNavigate={navigate} onLogout={onLogout} onClose={closeSidebar} />
      <main className="admin-main">
        <div className="admin-page-view" key={activeSection}>
          <SectionPanel
            section={activeSection}
            content={content}
            inboxSummary={inboxSummary}
            onNavigate={navigate}
            onContentChange={onContentChange}
            onInboxSummaryChange={onInboxSummaryChange}
          />
        </div>
        {isEditable && (
          <div className="content-editor-footer admin-save-footer">
            <div className="content-save-status" aria-live="polite">
              {error ? <p className="admin-message admin-error" role="alert">{error}</p> : message ? <p className="admin-message admin-success" role="status">{message}</p> : <span>{isDirty ? "You have unsaved changes." : "All changes are saved."}</span>}
            </div>
            <div className="content-editor-actions">
              <button className="button button-quiet" type="button" onClick={onDiscard} disabled={busy || !isDirty}>Discard</button>
              <button className="button button-primary" type="button" onClick={onSave} disabled={busy || !isDirty}>{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
