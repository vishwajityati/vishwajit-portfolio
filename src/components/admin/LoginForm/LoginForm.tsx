"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { MAX_ACCESS_CODE_LENGTH, MIN_ACCESS_CODE_LENGTH, evaluateAccessCode } from "@/lib/access-code";
import "./LoginForm.css";

interface LoginFormProps {
  setupRequired: boolean;
  requiresTotp: boolean;
  accessCode: string;
  totpCode: string;
  busy: boolean;
  error: string;
  onAccessCodeChange: (value: string) => void;
  onTotpCodeChange: (value: string) => void;
  onCancelTotp: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function LoginForm({
  setupRequired,
  requiresTotp,
  accessCode,
  totpCode,
  busy,
  error,
  onAccessCodeChange,
  onTotpCodeChange,
  onCancelTotp,
  onSubmit
}: LoginFormProps) {
  const [accessCodeVisible, setAccessCodeVisible] = useState(false);

  return (
    <main className="auth-card">
      <div className="auth-emblem"><LockKeyhole size={22} /></div>
      <p className="eyebrow">ADMIN WORKSPACE</p>
      <h4 className="gradient-text">Secure access to your portfolio management workspace.</h4>
      {/* <p className="auth-description">
        {setupRequired
          ? "Choose the single access code that will unlock this dashboard. Store it somewhere safe — it is the only credential."
          : "Enter your access code to manage your portfolio content."}
      </p> */}
      <form className="auth-form" onSubmit={onSubmit}>
        {requiresTotp ? (
          <>
            <p className="auth-description">Enter the 6-digit code from your authenticator app.</p>
            <label>Authenticator code<input type="text" value={totpCode} onChange={(event) => onTotpCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} autoFocus required /></label>
          </>
        ) : (
          <>
            <label>Access code
              <span className="auth-password-field">
                <input
                  type={accessCodeVisible ? "text" : "password"}
                  value={accessCode}
                  onChange={(event) => onAccessCodeChange(event.target.value)}
                  autoComplete={setupRequired ? "new-password" : "current-password"}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  minLength={setupRequired ? MIN_ACCESS_CODE_LENGTH : undefined}
                  maxLength={setupRequired ? MAX_ACCESS_CODE_LENGTH : undefined}
                  autoFocus
                  required
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  aria-label={accessCodeVisible ? "Hide access code" : "Show access code"}
                  aria-pressed={accessCodeVisible}
                  onClick={() => setAccessCodeVisible((visible) => !visible)}
                >
                  {accessCodeVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            {setupRequired && (
              <>
                <small>At least {MIN_ACCESS_CODE_LENGTH} characters. Letters and numbers are treated as the same regardless of case.</small>
                {accessCode.length > 0 && (
                  <ul className="admin-password-rules">
                    {evaluateAccessCode(accessCode).map((rule) => (
                      <li key={rule.id} className={rule.passed ? "is-pass" : "is-pending"}>{rule.label}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        <button
          className="button button-primary auth-submit"
          type="submit"
          disabled={busy || (requiresTotp ? totpCode.length !== 6 : setupRequired && accessCode.length < MIN_ACCESS_CODE_LENGTH)}
        >
          {busy ? <LoaderCircle className="spin" size={15} /> : null}
          {requiresTotp ? "Verify code" : setupRequired ? "Create access code" : "Sign in"} 
        </button>
        {requiresTotp && <button className="auth-cancel-totp" type="button" onClick={onCancelTotp} disabled={busy}>Back to sign in</button>}
      </form>
    </main>
  );
}
