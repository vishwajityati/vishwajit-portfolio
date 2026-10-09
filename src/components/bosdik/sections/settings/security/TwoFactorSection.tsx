"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, LoaderCircle, ShieldCheck, ShieldOff } from "lucide-react";
import { apiJson } from "@/lib/api";
import { SectionIntro } from "@/components/bosdik/sections/shared/SectionIntro";

interface TotpSetup {
  secret: string;
  uri: string;
}

export function TwoFactorSection() {
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    apiJson<{ enabled: boolean }>("/api/auth/totp")
      .then((result) => { if (active) setEnabled(result.enabled); })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Security settings could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const beginSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiJson<TotpSetup>("/api/auth/totp", {
        method: "POST",
        body: JSON.stringify({ action: "begin", currentCode: accessCode })
      });
      setSetup(result);
      setCode("");
      setAccessCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authenticator setup could not be started.");
    } finally {
      setBusy(false);
    }
  };

  const enableTotp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!setup) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiJson<{ enabled: boolean }>("/api/auth/totp", {
        method: "POST",
        body: JSON.stringify({ action: "enable", currentCode: accessCode, secret: setup.secret, code })
      });
      setEnabled(true);
      setSetup(null);
      setCode("");
      setAccessCode("");
      setMessage("Two-factor sign-in is enabled.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authenticator could not be enabled.");
    } finally {
      setBusy(false);
    }
  };

  const disableTotp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiJson<{ enabled: boolean }>("/api/auth/totp", {
        method: "POST",
        body: JSON.stringify({ action: "disable", currentCode: accessCode, code })
      });
      setEnabled(false);
      setCode("");
      setAccessCode("");
      setMessage("Two-factor sign-in is disabled.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authenticator could not be disabled.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-settings-section">
      <SectionIntro step="ACCOUNT SECURITY" title="Two-factor authentication." description="Protect admin sign-in with a time-based code from an authenticator app." />
      {loading ? <p className="admin-setting-status"><LoaderCircle className="spin" size={16} /> Loading security settings…</p> : enabled ? (
        <>
          <p className="admin-setting-status is-enabled"><ShieldCheck size={16} /> Authenticator app verification is enabled.</p>
          <form className="admin-settings-form" onSubmit={(event) => void disableTotp(event)}>
            <label className="content-field"><span>Current access code</span><input type="password" value={accessCode} autoComplete="current-password" onChange={(event) => setAccessCode(event.target.value)} required /></label>
            <label className="content-field"><span>Authenticator code</span><input type="text" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label>
            <button className="button button-quiet" type="submit" disabled={busy || code.length !== 6}>{busy ? <LoaderCircle className="spin" size={15} /> : <ShieldOff size={15} />} Disable two-factor authentication</button>
          </form>
        </>
      ) : setup ? (
        <>
          <div className="admin-setting-status">
            <KeyRound size={16} />
            <div>
              <strong>Add this key to your authenticator app</strong>
              <p>Choose manual entry, use the key below, and select time-based (TOTP) with a 6-digit code.</p>
              <code className="totp-secret">{setup.secret}</code>
            </div>
          </div>
          <form className="admin-settings-form" onSubmit={(event) => void enableTotp(event)}>
            <label className="content-field"><span>Current access code</span><input type="password" value={accessCode} autoComplete="current-password" onChange={(event) => setAccessCode(event.target.value)} required /></label>
            <label className="content-field"><span>6-digit code from the app</span><input type="text" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label>
            <div className="content-editor-actions">
              <button className="button button-quiet" type="button" disabled={busy} onClick={() => { setSetup(null); setAccessCode(""); setCode(""); }}>Cancel</button>
              <button className="button button-primary" type="submit" disabled={busy || code.length !== 6}>{busy ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />} Verify and enable</button>
            </div>
          </form>
        </>
      ) : (
        <form className="admin-settings-form" onSubmit={(event) => void beginSetup(event)}>
          <p className="admin-setting-status"><ShieldCheck size={16} /> Two-factor authentication is currently disabled.</p>
          <label className="content-field"><span>Confirm with current access code</span><input type="password" value={accessCode} autoComplete="current-password" onChange={(event) => setAccessCode(event.target.value)} required /></label>
          <button className="button button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />} Set up authenticator app</button>
        </form>
      )}
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {message && <p className="admin-message admin-success" role="status"><Check size={16} />{message}</p>}
    </section>
  );
}
