"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Check, Inbox, LoaderCircle, Mail, MailOpen, RefreshCw, Trash2 } from "lucide-react";
import { apiJson, apiRequest } from "@/lib/api";

import "./MessageInbox.css";  

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  notificationSent: boolean;
  createdAt: string;
  readAt: string | null;
}

interface InboxResponse {
  messages: ContactMessage[];
  unreadCount: number;
  emailNotificationsEnabled: boolean;
  emailNotificationMissingSettings: string[];
}

export interface InboxSummary {
  unreadCount: number;
  emailNotificationsEnabled: boolean;
}

function formatMessageDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export function MessageInbox({ onSummaryChange }: { onSummaryChange: (summary: InboxSummary) => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [emailNotificationMissingSettings, setEmailNotificationMissingSettings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiJson<InboxResponse>("/api/messages");
      setMessages(result.messages);
      setUnreadCount(result.unreadCount);
      setEmailNotificationsEnabled(result.emailNotificationsEnabled);
      setEmailNotificationMissingSettings(result.emailNotificationMissingSettings);
      setSelectedId((current) => current !== null && result.messages.some((item) => item.id === current) ? current : result.messages[0]?.id ?? null);
      onSummaryChange({ unreadCount: result.unreadCount, emailNotificationsEnabled: result.emailNotificationsEnabled });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your messages could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [onSummaryChange]);

  useEffect(() => { void load(); }, [load]);

  const updateReadStatus = async (message: ContactMessage, read: boolean) => {
    setBusyId(message.id);
    setError("");
    try {
      await apiJson<{ message: ContactMessage }>(`/api/messages/${message.id}`, {
        method: "PATCH",
        body: JSON.stringify({ read })
      });
      const readAt = read ? new Date().toISOString() : null;
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, readAt } : item));
      const nextUnreadCount = Math.max(0, unreadCount + (read ? -1 : 1));
      setUnreadCount(nextUnreadCount);
      onSummaryChange({ unreadCount: nextUnreadCount, emailNotificationsEnabled });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Message status could not be updated.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteMessage = async (message: ContactMessage) => {
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return;

    setBusyId(message.id);
    setError("");
    try {
      await apiRequest(`/api/messages/${message.id}`, { method: "DELETE" });
      const nextMessages = messages.filter((item) => item.id !== message.id);
      const nextUnreadCount = Math.max(0, unreadCount - (message.readAt ? 0 : 1));
      setMessages(nextMessages);
      setUnreadCount(nextUnreadCount);
      setSelectedId((current) => current === message.id ? nextMessages[0]?.id ?? null : current);
      onSummaryChange({ unreadCount: nextUnreadCount, emailNotificationsEnabled });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Message could not be deleted.");
    } finally {
      setBusyId(null);
    }
  };

  const selectedMessage = messages.find((item) => item.id === selectedId) ?? null;

  return (
    <section className="inbox-panel" aria-labelledby="inbox-title">
      <div className="inbox-heading">
        <div>
          <span className="editor-step">PRIVATE INBOX</span>
          <h2 id="inbox-title">Messages from your visitors.</h2>
          <p>Messages sent through the portfolio contact form appear here. Reply directly to the sender.</p>
        </div>
        <button className="button button-quiet inbox-refresh" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? "spin" : ""} /><span>Refresh</span></button>
      </div>

      <div className={emailNotificationsEnabled ? "inbox-email-status is-enabled" : "inbox-email-status"}>
        <Mail size={15} />
        <span>
          {emailNotificationsEnabled
            ? "Email alerts are configured. Messages are also saved here."
            : `Messages are saved here. Add ${emailNotificationMissingSettings.join(", ")} to the project-root .env file, then restart the app to enable email alerts.`}
        </span>
      </div>

      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {loading ? (
        <div className="inbox-state"><LoaderCircle className="spin" size={19} /><span>Loading your inbox…</span></div>
      ) : messages.length === 0 ? (
        <div className="inbox-state"><Inbox size={25} /><strong>Your inbox is empty.</strong><span>New visitor messages will show up here.</span></div>
      ) : (
        <div className="inbox-layout">
          <div className="inbox-list" aria-label="Visitor messages">
            {messages.map((message) => (
              <button key={message.id} type="button" className={`inbox-message-row${selectedId === message.id ? " is-selected" : ""}${message.readAt ? "" : " is-unread"}`} onClick={() => setSelectedId(message.id)}>
                <span className="inbox-message-row-top"><strong>{message.name}</strong>{!message.readAt && <span className="inbox-unread-dot" aria-label="Unread" />}</span>
                <span className="inbox-message-row-email">{message.email}</span>
                <span className="inbox-message-row-preview">{message.message}</span>
                <time dateTime={message.createdAt}>{formatMessageDate(message.createdAt)}</time>
              </button>
            ))}
          </div>

          {selectedMessage ? (
            <article className="inbox-message-detail">
              <div className="inbox-detail-heading">
                <div><span className="content-entry-index">MESSAGE · {formatMessageDate(selectedMessage.createdAt)}</span><h3>{selectedMessage.name}</h3><a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email} <ArrowUpRight size={13} /></a></div>
                <div className="inbox-detail-actions">
                  <button className="content-icon-button" type="button" aria-label={selectedMessage.readAt ? "Mark as unread" : "Mark as read"} title={selectedMessage.readAt ? "Mark as unread" : "Mark as read"} disabled={busyId === selectedMessage.id} onClick={() => void updateReadStatus(selectedMessage, !selectedMessage.readAt)}>{selectedMessage.readAt ? <Mail size={15} /> : <MailOpen size={15} />}</button>
                  <button className="content-icon-button" type="button" aria-label="Delete message" title="Delete message" disabled={busyId === selectedMessage.id} onClick={() => void deleteMessage(selectedMessage)}><Trash2 size={15} /></button>
                </div>
              </div>
              {selectedMessage.phone && <p className="inbox-phone">Phone: <a href={`tel:${selectedMessage.phone}`}>{selectedMessage.phone}</a></p>}
              <div className="inbox-message-body">{selectedMessage.message}</div>
              <div className="inbox-detail-footer">
                <span>{selectedMessage.notificationSent ? <><Check size={13} /> Email alert sent</> : "Saved in your inbox"}</span>
                <a className="button button-primary" href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent("Re: your portfolio message")}`}>Reply by email <ArrowUpRight size={14} /></a>
              </div>
            </article>
          ) : <div className="inbox-message-detail inbox-detail-placeholder">Select a message to read it.</div>}
        </div>
      )}
      <span className="sr-only" aria-live="polite">{unreadCount ? `${unreadCount} unread messages` : "No unread messages"}</span>
    </section>
  );
}
