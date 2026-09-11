/*
  Warnings:

  - Added the required column `aggregate_id` to the `outbox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ocurred_at` to the `outbox` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "outbox" ADD COLUMN     "aggregate_id" TEXT NOT NULL,
ADD COLUMN     "ocurred_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "outbox_aggregate_id_idx" ON "outbox"("aggregate_id");
