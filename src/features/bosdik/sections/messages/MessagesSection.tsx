"use client";

import { MessageInbox, type InboxSummary } from "@/features/bosdik/MessageInbox/MessageInbox";

export function MessagesSection({ onSummaryChange }: { onSummaryChange: (summary: InboxSummary) => void }) {
  return <MessageInbox onSummaryChange={onSummaryChange} />;
}
