"use client";

import { useState } from "react";
import { Check, CheckCircle2, KeyRound, LoaderCircle, XCircle } from "lucide-react";
import { apiJson } from "@/lib/api";
import { SectionIntro } from "@/features/bosdik/sections/shared/SectionIntro";
import { MAX_ACCESS_CODE_LENGTH, MIN_ACCESS_CODE_LENGTH, evaluateAccessCode } from "@/lib/access-code";

export function PasswordSection() {
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newCode !== confirmation) {
      setError("New access codes do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await apiJson<{ accessCodeUpdated: boolean; reauthenticate: boolean }>("/api/auth/account", {
        method: "PATCH",
        body: JSON.stringify({ action: "accessCode", currentCode, newCode })
      });
      setCurrentCode("");
      setNewCode("");
      setConfirmation("");
      if (result.reauthenticate) {
        setMessage("Access code updated and every session was signed out. Returning you to the sign-in screen…");
        window.setTimeout(() => window.location.assign("/bosdik"), 1500);
        return;
      }
      setMessage("Access code updated. Other sessions were signed out.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Access code could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-settings-section">
      <SectionIntro step="ACCOUNT SECURITY" title="Change your access code." description="Confirm your current access code before setting a new one. Changing it signs out every other device." />
      <form className="admin-settings-form" onSubmit={(event) => void save(event)}>
        <label className="content-field"><span>Current access code</span><input type="password" value={currentCode} autoComplete="current-password" onChange={(event) => setCurrentCode(event.target.value)} required /></label>
        <label className="content-field"><span>New access code</span><input type="password" value={newCode} autoComplete="new-password" minLength={MIN_ACCESS_CODE_LENGTH} maxLength={MAX_ACCESS_CODE_LENGTH} onChange={(event) => setNewCode(event.target.value)} required /><small>At least {MIN_ACCESS_CODE_LENGTH} characters.</small></label>
        {newCode.length > 0 && (
          <ul className="admin-password-rules">
            {evaluateAccessCode(newCode).map((rule) => (
              <li key={rule.id} className={rule.passed ? "is-pass" : "is-pending"}>
                {rule.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {rule.label}
              </li>
            ))}
          </ul>
        )}
        <label className="content-field"><span>Confirm new access code</span><input type="password" value={confirmation} autoComplete="new-password" minLength={MIN_ACCESS_CODE_LENGTH} maxLength={MAX_ACCESS_CODE_LENGTH} onChange={(event) => setConfirmation(event.target.value)} required /></label>
        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        {message && <p className="admin-message admin-success" role="status"><Check size={16} />{message}</p>}
        <button className="button button-primary" type="submit" disabled={busy || newCode.length < MIN_ACCESS_CODE_LENGTH}>
          {busy ? <LoaderCircle className="spin" size={15} /> : <KeyRound size={15} />} Update access code
        </button>
      </form>
    </section>
  );
}
