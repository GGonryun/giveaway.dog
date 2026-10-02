/*
  Warnings:

  - The values [SCHEDULED,ENDED] on the enum `SweepstakesStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."SweepstakesStatus_new" AS ENUM ('DRAFT', 'PAUSED', 'CANCELED', 'ACTIVE', 'COMPLETED');
ALTER TABLE "public"."Sweepstakes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Sweepstakes" ALTER COLUMN "status" TYPE "public"."SweepstakesStatus_new" USING ("status"::text::"public"."SweepstakesStatus_new");
ALTER TYPE "public"."SweepstakesStatus" RENAME TO "SweepstakesStatus_old";
ALTER TYPE "public"."SweepstakesStatus_new" RENAME TO "SweepstakesStatus";
DROP TYPE "public"."SweepstakesStatus_old";
ALTER TABLE "public"."Sweepstakes" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
