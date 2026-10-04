/*
  Warnings:

  - The values [PROCESS_PUBLISH] on the enum `SweepstakesJobType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SweepstakesJobType_new" AS ENUM ('PROCESS_ACTIVATION', 'PROCESS_EXPIRATION', 'PROCESS_COMPLETION', 'RANDOMLY_ASSIGN_PRIZES');
ALTER TABLE "SweepstakesJob" ALTER COLUMN "type" TYPE "SweepstakesJobType_new" USING ("type"::text::"SweepstakesJobType_new");
ALTER TYPE "SweepstakesJobType" RENAME TO "SweepstakesJobType_old";
ALTER TYPE "SweepstakesJobType_new" RENAME TO "SweepstakesJobType";
DROP TYPE "public"."SweepstakesJobType_old";
COMMIT;
