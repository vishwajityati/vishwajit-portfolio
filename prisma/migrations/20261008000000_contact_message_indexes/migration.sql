-- Add indexes used by the admin inbox ordering and unread count.
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX "ContactMessage_readAt_idx" ON "ContactMessage"("readAt");
