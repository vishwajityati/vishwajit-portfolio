import { ArrowUpRight, BriefcaseBusiness, FolderKanban, Inbox, PenLine, UserRound } from "lucide-react";
import type { PortfolioContent } from "@/types";
import type { InboxSummary } from "@/components/admin/MessageInbox/MessageInbox";
import type { AdminSection } from "@/components/admin/AdminDashboard/AdminDashboard";

interface OverviewSectionProps {
  content: PortfolioContent;
  inboxSummary: InboxSummary;
  onNavigate: (section: AdminSection) => void;
}

const shortcuts: Array<{ label: string; description: string; section: AdminSection; icon: typeof PenLine }> = [
  { label: "Edit hero", description: "Update your introduction and headline.", section: "hero", icon: PenLine },
  { label: "Manage projects", description: "Add projects and update their links.", section: "projects", icon: FolderKanban },
  { label: "View messages", description: "Read and reply to visitor messages.", section: "messages", icon: Inbox },
  { label: "Update profile", description: "Keep your public contact details current.", section: "profile", icon: UserRound }
];

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof PenLine }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-icon"><Icon size={17} /></span>
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
    </div>
  );
}

export function OverviewSection({ content, inboxSummary, onNavigate }: OverviewSectionProps) {
  return (
    <section className="admin-overview" aria-labelledby="overview-title">
      <div className="admin-section-heading">
        <div>
          <span className="editor-step">WORKSPACE OVERVIEW</span>
          <h2 id="overview-title">Welcome back, {content.name || "Admin"}.</h2>
          <p>Manage your portfolio, review visitor messages, and keep your site up to date.</p>
        </div>
        <a className="button button-quiet" href="/" target="_blank" rel="noreferrer">View site <ArrowUpRight size={14} /></a>
      </div>
      <div className="admin-stats admin-stats-cards">
        <StatCard label="PROJECTS" value={content.projects.length} icon={FolderKanban} />
        <StatCard label="EXPERIENCE ENTRIES" value={content.experience.length} icon={BriefcaseBusiness} />
        <StatCard label="UNREAD MESSAGES" value={inboxSummary.unreadCount} icon={Inbox} />
      </div>
      <div className="admin-shortcut-grid">
        {shortcuts.map(({ label, description, section, icon: Icon }) => (
          <button className="admin-shortcut-card" key={section} type="button" onClick={() => onNavigate(section)}>
            <span className="admin-shortcut-icon"><Icon size={17} /></span>
            <strong>{label}</strong>
            <span>{description}</span>
            <ArrowUpRight size={14} className="admin-shortcut-arrow" />
          </button>
        ))}
      </div>
    </section>
  );
}
