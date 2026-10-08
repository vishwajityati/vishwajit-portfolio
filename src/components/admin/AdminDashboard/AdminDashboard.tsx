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
import type { InboxSummary } from "@/components/admin/MessageInbox/MessageInbox";
import { ExperienceSection } from "@/components/admin/sections/portfolio/experience/ExperienceSection";
import { EducationSection } from "@/components/admin/sections/portfolio/education/EducationSection";
import { HeroSection } from "@/components/admin/sections/portfolio/hero/HeroSection";
import { AboutSection } from "@/components/admin/sections/portfolio/about/AboutSection";
import { SkillsSection } from "@/components/admin/sections/portfolio/skills/SkillsSection";
import { ProjectsSection } from "@/components/admin/sections/portfolio/projects/ProjectsSection";
import { ResumeSection } from "@/components/admin/sections/portfolio/resume/ResumeSection";
import { MessagesSection } from "@/components/admin/sections/messages/MessagesSection";
import { OverviewSection } from "@/components/admin/sections/overview/OverviewSection";
import { ProfileSection } from "@/components/admin/sections/profile/ProfileSection";
import { SocialLinksSection } from "@/components/admin/sections/social-links/SocialLinksSection";
import { AdminAccountSection } from "@/components/admin/sections/settings/admin-account/AdminAccountSection";
import { PasswordSection } from "@/components/admin/sections/settings/password/PasswordSection";
import { TwoFactorSection } from "@/components/admin/sections/settings/security/TwoFactorSection";
import { SecurityStatusSection } from "@/components/admin/sections/settings/security/SecurityStatusSection";
import { SeoSettingsSection } from "@/components/admin/sections/settings/seo/SeoSettingsSection";
import { SiteSettingsSection } from "@/components/admin/sections/settings/site-settings/SiteSettingsSection";

import "./AdminDashboard.css";

export type AdminSection =
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
  | "admin-account"
  | "password"
  | "security-status"
  | "security"
  | "seo"
  | "site-settings";

interface AdminDashboardProps {
  content: PortfolioContent;
  savedContent: PortfolioContent | null;
  inboxSummary: InboxSummary;
  busy: boolean;
  error: string;
  message: string;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onSave: () => void;
  onDiscard: () => void;
  onContentChange: (content: PortfolioContent) => void;
  onInboxSummaryChange: (summary: InboxSummary) => void;
  onLogout: () => void;
}

interface NavLink {
  id: AdminSection;
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
    { id: "hero", label: "Hero", icon: Sparkles },
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
    { id: "admin-account", label: "Admin Account", icon: UsersRound },
    { id: "password", label: "Access Code", icon: KeyRound },
    { id: "security-status", label: "Security Status", icon: ShieldCheck },
    { id: "security", label: "Two-Factor Auth", icon: Smartphone },
    { id: "seo", label: "SEO", icon: Search },
    { id: "site-settings", label: "Site Settings", icon: Globe2 }
  ]
};

const sectionLabels: Record<AdminSection, string> = {
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
  "admin-account": "Admin Account",
  password: "Access Code",
  "security-status": "Security Status",
  security: "Two-Factor Auth",
  seo: "SEO",
  "site-settings": "Site Settings"
};

const portfolioSections: AdminSection[] = ["hero", "about", "skills", "projects", "experience", "education", "resume", "profile", "social-links", "seo", "site-settings"];

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

function SidebarGroup({ group, activeSection, onNavigate, badge }: { group: NavGroup; activeSection: AdminSection; onNavigate: (section: AdminSection) => void; badge?: number }) {
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

function AdminSidebar({ activeSection, unreadCount, onNavigate, onLogout }: { activeSection: AdminSection; unreadCount: number; onNavigate: (section: AdminSection) => void; onLogout: () => void }) {
  return (
    <aside className="admin-sidebar">
      <a href="/" className="brand admin-sidebar-brand" aria-label="Back to portfolio home">
        <span className="brand-mark">V</span>
        <span className="brand-name">PORTFOLIO <span>STUDIO</span></span>
      </a>
      <div className="admin-sidebar-caption">ADMIN DASHBOARD</div>
      <nav className="admin-sidebar-nav" aria-label="Admin dashboard">
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
  section: AdminSection;
  content: PortfolioContent;
  inboxSummary: InboxSummary;
  onNavigate: (section: AdminSection) => void;
  onContentChange: (content: PortfolioContent) => void;
  onInboxSummaryChange: (summary: InboxSummary) => void;
}) {
  switch (section) {
    case "overview": return <OverviewSection content={content} inboxSummary={inboxSummary} onNavigate={onNavigate} />;
    case "hero": return <HeroSection content={content} onChange={onContentChange} />;
    case "about": return <AboutSection content={content} onChange={onContentChange} />;
    case "skills": return <SkillsSection content={content} onChange={onContentChange} />;
    case "projects": return <ProjectsSection content={content} onChange={onContentChange} />;
    case "experience": return <ExperienceSection content={content} onChange={onContentChange} />;
    case "education": return <EducationSection content={content} onChange={onContentChange} />;
    case "resume": return <ResumeSection content={content} onChange={onContentChange} />;
    case "messages": return <MessagesSection onSummaryChange={onInboxSummaryChange} />;
    case "profile": return <ProfileSection content={content} onChange={onContentChange} />;
    case "social-links": return <SocialLinksSection content={content} onChange={onContentChange} />;
    case "admin-account": return <AdminAccountSection />;
    case "password": return <PasswordSection />;
    case "security-status": return <SecurityStatusSection />;
    case "security": return <TwoFactorSection />;
    case "seo": return <SeoSettingsSection content={content} onChange={onContentChange} />;
    case "site-settings": return <SiteSettingsSection content={content} onChange={onContentChange} emailNotificationsEnabled={inboxSummary.emailNotificationsEnabled} />;
  }
}

export function AdminDashboard({
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
}: AdminDashboardProps) {
  const isDirty = JSON.stringify(content) !== JSON.stringify(savedContent);
  const isEditable = portfolioSections.includes(activeSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = (section: AdminSection) => {
    onSectionChange(section);
    setSidebarOpen(false);
  };

  return (
    <div className={`admin-dashboard-layout${sidebarOpen ? " sidebar-is-open" : ""}`}>
      {sidebarOpen && <button className="admin-sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <AdminSidebar activeSection={activeSection} unreadCount={inboxSummary.unreadCount} onNavigate={navigate} onLogout={onLogout} />
      <main className="admin-main">
        <button className="admin-mobile-menu" type="button" aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((value) => !value)}>
          {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
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
