/*
  Warnings:

  - The values [PAUSED,CANCELED] on the enum `SweepstakesStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SweepstakesStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');
ALTER TABLE "public"."Sweepstakes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Sweepstakes" ALTER COLUMN "status" TYPE "SweepstakesStatus_new" USING ("status"::text::"SweepstakesStatus_new");
ALTER TYPE "SweepstakesStatus" RENAME TO "SweepstakesStatus_old";
ALTER TYPE "SweepstakesStatus_new" RENAME TO "SweepstakesStatus";
DROP TYPE "public"."SweepstakesStatus_old";
ALTER TABLE "Sweepstakes" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
