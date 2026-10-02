/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `AutomatedPostJobStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AutomatedPostJobStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
ALTER TABLE "AutomatedPostJob" ALTER COLUMN "status" TYPE "AutomatedPostJobStatus_new" USING ("status"::text::"AutomatedPostJobStatus_new");
ALTER TYPE "AutomatedPostJobStatus" RENAME TO "AutomatedPostJobStatus_old";
ALTER TYPE "AutomatedPostJobStatus_new" RENAME TO "AutomatedPostJobStatus";
DROP TYPE "public"."AutomatedPostJobStatus_old";
COMMIT;
