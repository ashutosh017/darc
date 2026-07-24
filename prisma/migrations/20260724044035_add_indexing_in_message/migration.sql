-- CreateIndex
CREATE INDEX "chat_user_id_idx" ON "chat"("user_id");

-- CreateIndex
CREATE INDEX "message_chat_id_idx" ON "message"("chat_id");

-- CreateIndex
CREATE INDEX "message_chat_id_createdAt_idx" ON "message"("chat_id", "createdAt");
