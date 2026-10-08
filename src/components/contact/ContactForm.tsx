"use client";
import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { apiJson } from "@/lib/api";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setSent(false);
    setError("");
    setNotificationStatus("");

    try {
      const form = new FormData(formElement);
      const result = await apiJson<{ received: boolean }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          message: form.get("message"),
          website: form.get("website")
        })
      });
      setSent(result.received);
      setNotificationStatus("Your message was sent. Thanks for visiting here!");
      formElement.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your message could not be sent. Please try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={(event) => void submit(event)}>
      <label className="contact-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="form-row">
        <label>Your name<input required name="name" placeholder="Jane Smith" autoComplete="name" /></label>
        <label>Email address<input required type="email" name="email" placeholder="jane@email.com" autoComplete="email" /></label>
      </div>
      <label>Phone <span className="optional-label">(optional)</span><input type="tel" name="phone" inputMode="numeric" pattern="[0-9]{0,10}" maxLength={10} placeholder="9876543210" autoComplete="tel" /></label>
      <label>What can I help with?<textarea required name="message" rows={3} placeholder="Tell me a little about your idea..." /></label>
      {error && <p className="form-notice error-notice" role="alert">{error}</p>}
      {sent && <p className="form-notice" role="status">{notificationStatus}</p>}
      <button className="button button-primary submit-button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />}{busy ? "Sending message…" : "Send message"}</button>
    </form>
  );
}
