-- DropIndex
DROP INDEX "outbox_status_idx";

-- CreateIndex
CREATE INDEX "outbox_status_created_at_idx" ON "outbox"("status", "created_at");
