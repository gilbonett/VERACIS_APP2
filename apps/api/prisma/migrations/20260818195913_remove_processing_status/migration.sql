/*
  Warnings:

  - The values [PROCESSING] on the enum `OutboxStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OutboxStatus_new" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
ALTER TABLE "public"."outbox" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "outbox" ALTER COLUMN "status" TYPE "OutboxStatus_new" USING ("status"::text::"OutboxStatus_new");
ALTER TYPE "OutboxStatus" RENAME TO "OutboxStatus_old";
ALTER TYPE "OutboxStatus_new" RENAME TO "OutboxStatus";
DROP TYPE "public"."OutboxStatus_old";
ALTER TABLE "outbox" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
