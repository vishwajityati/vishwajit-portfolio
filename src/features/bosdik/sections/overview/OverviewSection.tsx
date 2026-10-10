import { Activity, ArrowUpRight, BriefcaseBusiness, CheckCircle2, FolderKanban, Inbox, PenLine, ShieldCheck, UserRound } from "lucide-react";
import type { PortfolioContent } from "@/types";
import type { InboxSummary } from "@/features/bosdik/MessageInbox/MessageInbox";
import type { BosdikSection } from "@/features/bosdik/BosdikDashboard/BosdikDashboard";

interface OverviewSectionProps {
  content: PortfolioContent;
  inboxSummary: InboxSummary;
  onNavigate: (section: BosdikSection) => void;
}

const shortcuts: Array<{ label: string; description: string; section: BosdikSection; icon: typeof PenLine }> = [
  { label: "Edit hero", description: "Update your introduction and headline.", section: "hero", icon: PenLine },
  { label: "Manage projects", description: "Add projects and update their links.", section: "projects", icon: FolderKanban },
  { label: "View messages", description: "Read and reply to visitor messages.", section: "messages", icon: Inbox },
  { label: "Update profile", description: "Keep your public contact details current.", section: "profile", icon: UserRound }
];

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof PenLine; tone: string }) {
  return (
      <div className={`analytics-kpi analytics-kpi-${tone}`}>
      <div className="analytics-kpi-label"><Icon size={13} /><span>{label}</span></div>
      <strong>{String(value).padStart(2, "0")}</strong>
      <span className="analytics-kpi-trend">Live count <ArrowUpRight size={12} /></span>
    </div>
  );
}

function TrendLine({ tone = "cyan" }: { tone?: string }) {
  return (
    <svg className={`analytics-trend analytics-trend-${tone}`} viewBox="0 0 180 48" role="img" aria-label="Decorative activity trend">
      <path className="analytics-trend-fill" d="M0 41 C18 39 20 30 35 34 S56 38 70 25 S92 30 106 19 S128 27 142 14 S164 20 180 4 V48 H0Z" />
      <path className="analytics-trend-line" d="M0 41 C18 39 20 30 35 34 S56 38 70 25 S92 30 106 19 S128 27 142 14 S164 20 180 4" />
    </svg>
  );
}

export function OverviewSection({ content, inboxSummary, onNavigate }: OverviewSectionProps) {
  return (
    <section className="admin-overview" aria-labelledby="overview-title">
      <div className="analytics-heading admin-section-heading">
        <div>
          <span className="editor-step">ANALYTICS / WORKSPACE</span>
          <h2 id="overview-title">Good to see you, {content.name || "Admin"}.</h2>
          <p>Track your portfolio content and keep your public site moving forward.</p>
        </div>
      </div>
      <div className="analytics-kpi-grid">
        <StatCard label="PROJECTS" value={content.projects.length} icon={FolderKanban} tone="cyan" />
        <StatCard label="EXPERIENCE" value={content.experience.length} icon={BriefcaseBusiness} tone="purple" />
        <StatCard label="UNREAD MESSAGES" value={inboxSummary.unreadCount} icon={Inbox} tone="pink" />
        <StatCard label="SKILL GROUPS" value={content.education[0]?.skillGroups.length ?? 0} icon={Activity} tone="blue" />
      </div>
      <div className="analytics-main-grid">
        <section className="analytics-panel analytics-activity-panel">
          <div className="analytics-panel-heading"><div><span className="analytics-panel-kicker">CONTENT ACTIVITY</span><h3>Portfolio overview</h3></div><span className="analytics-panel-filter">Current record</span></div>
          <div className="analytics-chart-legend"><span><i className="legend-dot cyan" />Published content</span><span><i className="legend-dot purple" />Visitor inbox</span></div>
          <div className="analytics-chart"><div className="analytics-chart-y"><span>04</span><span>03</span><span>02</span><span>01</span><span>00</span></div><div className="analytics-chart-area"><div className="analytics-grid-lines"><i /><i /><i /><i /></div><TrendLine /><div className="analytics-chart-x"><span>Projects</span><span>Experience</span><span>Skills</span><span>Messages</span></div></div></div>
        </section>
        <section className="analytics-panel analytics-status-panel">
          <div className="analytics-panel-heading"><div><span className="analytics-panel-kicker">SYSTEM STATUS</span><h3>Publishing health</h3></div><ShieldCheck size={16} /></div>
          <div className="analytics-score"><strong>100%</strong><span>READY TO PUBLISH</span></div>
          <div className="analytics-status-list"><div><CheckCircle2 size={14} /><span>Public portfolio</span><b>Live</b></div><div><CheckCircle2 size={14} /><span>Resume page</span><b>Live</b></div><div><CheckCircle2 size={14} /><span>Message inbox</span><b>{inboxSummary.unreadCount ? "New" : "Clear"}</b></div></div>
        </section>
      </div>
      <div className="analytics-bottom-grid">
        <section className="analytics-panel analytics-quick-panel"><div className="analytics-panel-heading"><div><span className="analytics-panel-kicker">QUICK ACTIONS</span><h3>Keep building</h3></div><Activity size={16} /></div><div className="analytics-action-grid">{shortcuts.map(({ label, description, section, icon: Icon }) => <button className="analytics-action" key={section} type="button" onClick={() => onNavigate(section)}><span className="analytics-action-icon"><Icon size={15} /></span><span><strong>{label}</strong><small>{description}</small></span><ArrowUpRight size={13} /></button>)}</div></section>
        <section className="analytics-panel analytics-note-panel"><span className="analytics-panel-kicker">WORKSPACE NOTE</span><h3>Your data stays yours.</h3><p>Changes are saved to your portfolio record only when you choose <strong>Save changes</strong>.</p><a href="/" target="_blank" rel="noreferrer">Preview public site <ArrowUpRight size={13} /></a></section>
      </div>
    </section>
  );
}
