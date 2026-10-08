"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { apiJson } from "@/lib/api";
import { SectionIntro } from "@/components/admin/sections/shared/SectionIntro";
import type { PostureCheck, PostureStatus, SecurityOverview } from "@/lib/security-types";

const statusIcon: Record<PostureStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle
};

const statusLabel: Record<PostureStatus, string> = {
  pass: "Pass",
  warn: "Review",
  fail: "Action needed"
};

function formatTimestamp(value: string | null): string {
  if (!value) return "No recorded attempts yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recorded attempts yet";
  return `Last recorded attempt ${parsed.toLocaleString()}`;
}

function ScoreDial({ score }: { score: number }) {
  const tone = score >= 90 ? "is-good" : score >= 70 ? "is-fair" : "is-poor";
  return (
    <div className={`admin-security-score ${tone}`}>
      <span className="admin-security-score-value">{score}</span>
      <span className="admin-security-score-caption">SECURITY SCORE</span>
    </div>
  );
}

function LiveFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-security-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CheckRow({ check }: { check: PostureCheck }) {
  const Icon = statusIcon[check.status];
  return (
    <li className={`admin-security-check is-${check.status}`}>
      <span className="admin-security-check-icon"><Icon size={16} /></span>
      <div className="admin-security-check-body">
        <div className="admin-security-check-head">
          <strong>{check.label}</strong>
          <span className={`admin-security-badge is-${check.status}`}>{statusLabel[check.status]}</span>
        </div>
        <p>{check.detail}</p>
        {check.remediation && <p className="admin-security-remediation">Fix: {check.remediation}</p>}
      </div>
    </li>
  );
}

export function SecurityStatusSection() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    try {
      setError("");
      setOverview(await apiJson<SecurityOverview>("/api/admin/security"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Security status could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(false); }, [load]);

  const failures = overview?.checks.filter((check) => check.status === "fail").length ?? 0;
  const warnings = overview?.checks.filter((check) => check.status === "warn").length ?? 0;

  return (
    <section className="admin-settings-section">
      <SectionIntro
        step="ACCOUNT SECURITY"
        title="Security status."
        description="Live posture of this deployment, read directly from your database and server configuration on every load."
      />

      {loading ? (
        <p className="admin-setting-status"><LoaderCircle className="spin" size={16} /> Checking your security posture…</p>
      ) : !overview ? (
        <p className="admin-message admin-error" role="alert">{error || "Security status is unavailable."}</p>
      ) : (
        <>
          <div className="admin-security-header">
            <ScoreDial score={overview.score} />
            <div className="admin-security-summary">
              <p>
                {failures === 0 && warnings === 0
                  ? "Every check passed. This deployment matches the recommended hardening baseline."
                  : `${failures} check${failures === 1 ? "" : "s"} need action and ${warnings} need review.`}
              </p>
              <span className="admin-security-summary-meta">
                <ShieldCheck size={14} /> Checked {new Date(overview.checkedAt).toLocaleString()}
              </span>
              <button className="button button-quiet" type="button" onClick={() => void load(true)} disabled={refreshing}>
                {refreshing ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />} Re-check now
              </button>
            </div>
          </div>

          <div className="admin-security-facts">
            <LiveFact label="DATABASE" value={overview.database.connected
              ? `${overview.database.host ?? "connected"} · ${overview.database.latencyMs ?? 0} ms`
              : "Unreachable"} />
            <LiveFact label="PASSWORD HASH" value={overview.account.passwordRounds
              ? `${overview.account.passwordAlgorithm} cost ${overview.account.passwordRounds}`
              : "Not detected"} />
            <LiveFact label="ADDRESSES TRACKED" value={overview.rateLimits ? String(overview.rateLimits.trackedAddresses) : "—"} />
            <LiveFact label="LOCKED OUT" value={overview.rateLimits ? String(overview.rateLimits.throttledAddresses) : "—"} />
            <LiveFact label="FAILED ATTEMPTS" value={overview.rateLimits ? String(overview.rateLimits.recordedFailures) : "—"} />
            <LiveFact label="STORED MESSAGES" value={overview.database.storedMessages === null ? "—" : String(overview.database.storedMessages)} />
          </div>

          <div className="admin-security-live">
            <Database size={15} />
            <div>
              <strong>Live database read</strong>
              <p>
                {overview.rateLimits
                  ? `${overview.rateLimits.loginMaxAttempts} attempts allowed per ${overview.rateLimits.windowMinutes} minutes per address, with a shared ceiling of ${overview.rateLimits.globalMaxAttempts}. ${formatTimestamp(overview.rateLimits.lastAttemptAt)}.`
                  : "Rate-limit counters could not be read."}
              </p>
              <p>
                Session cookie <code>{overview.session.cookieName}</code> lasts {overview.session.ttlHours} h with
                {" "}httpOnly={overview.session.httpOnly ? "on" : "off"}, sameSite={overview.session.sameSite},
                secure={overview.session.secure ? "on" : "off"}. Portfolio rows: {overview.database.portfolioRecords ?? "—"}.
              </p>
            </div>
          </div>

          <ul className="admin-security-checks">
            {overview.checks.map((check) => <CheckRow key={check.id} check={check} />)}
          </ul>
        </>
      )}

      {error && overview && <p className="admin-message admin-error" role="alert">{error}</p>}
    </section>
  );
}
