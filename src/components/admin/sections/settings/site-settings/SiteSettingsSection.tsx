import { Check, Mail } from "lucide-react";
import type { PortfolioContent } from "@/types";
import { AdminField } from "@/components/admin/sections/shared/AdminField";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";

export function SiteSettingsSection({ content, onChange, emailNotificationsEnabled }: { content: PortfolioContent; onChange: (content: PortfolioContent) => void; emailNotificationsEnabled: boolean }) {
  const update = (patch: Partial<PortfolioContent["siteSettings"]>) => onChange({ ...content, siteSettings: { ...content.siteSettings, ...patch } });
  return (
    <>
      <SectionIntro step="SITE CONFIGURATION" title="Your website settings." description="Set the public site name and canonical website URL. Changes are applied to metadata after saving." />
      <div className="content-fields-grid">
        <AdminField label="Site name" value={content.siteSettings.name} onChange={(name) => update({ name })} placeholder={`${content.name} Portfolio`} />
        <AdminField label="Canonical site URL" value={content.siteSettings.url} onChange={(url) => update({ url })} type="url" placeholder="https://yourdomain.com" />
      </div>
      <div className={emailNotificationsEnabled ? "admin-setting-status is-enabled" : "admin-setting-status"}>
        {emailNotificationsEnabled ? <Check size={16} /> : <Mail size={16} />}
        <div>
          <strong>Email notifications {emailNotificationsEnabled ? "are configured" : "are not configured"}</strong>
          <p>{emailNotificationsEnabled ? "SMTP credentials are present on the server." : "Configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in the deployment environment to receive message alerts."}</p>
        </div>
      </div>
    </>
  );
}
