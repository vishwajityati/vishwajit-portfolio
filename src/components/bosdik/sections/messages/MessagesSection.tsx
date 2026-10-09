"use client";

import { MessageInbox, type InboxSummary } from "@/components/bosdik/MessageInbox/MessageInbox";

export function MessagesSection({ onSummaryChange }: { onSummaryChange: (summary: InboxSummary) => void }) {
  return <MessageInbox onSummaryChange={onSummaryChange} />;
}
