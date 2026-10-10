"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, UserRound } from "lucide-react";
import { apiJson } from "@/lib/api";
import { BosdikField } from "@/features/bosdik/sections/shared/BosdikField";
import { SectionIntro } from "@/features/bosdik/sections/shared/SectionIntro";

export function BosdikAccountSection() {
  const [email, setEmail] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    apiJson<{ email: string | null }>("/api/auth/account")
      .then((account) => { if (active) setEmail(account.email ?? ""); })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Admin account could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiJson<{ email: string | null }>("/api/auth/account", {
        method: "PATCH",
        body: JSON.stringify({ action: "email", email, currentCode })
      });
      setEmail(result.email ?? "");
      setCurrentCode("");
      setMessage("Admin email updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin email could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-settings-section">
      <SectionIntro step="ADMIN ACCOUNT" title="Your admin email." description="Optional. Sign-in uses your access code; this address is only used for the authenticator-app label and message notifications." />
      {loading ? <p className="admin-setting-status"><LoaderCircle className="spin" size={16} /> Loading account…</p> : (
        <form className="admin-settings-form" onSubmit={(event) => void save(event)}>
          <BosdikField label="Admin email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
          <label className="content-field">
            <span>Confirm with current access code</span>
            <input type="password" value={currentCode} autoComplete="current-password" onChange={(event) => setCurrentCode(event.target.value)} required />
          </label>
          {error && <p className="admin-message admin-error" role="alert">{error}</p>}
          {message && <p className="admin-message admin-success" role="status"><Check size={16} />{message}</p>}
          <button className="button button-primary" type="submit" disabled={busy || !email}>
            {busy ? <LoaderCircle className="spin" size={15} /> : <UserRound size={15} />} Update admin email
          </button>
        </form>
      )}
    </section>
  );
}
