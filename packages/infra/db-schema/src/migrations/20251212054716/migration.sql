/*
  Warnings:

  - The values [TWITTER_HANDLE] on the enum `SweepstakesFormFieldType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SweepstakesFormFieldType_new" AS ENUM ('USERNAME', 'AGE', 'EMAIL', 'TWITTER');
ALTER TABLE "SweepstakesFormField" ALTER COLUMN "type" TYPE "SweepstakesFormFieldType_new" USING ("type"::text::"SweepstakesFormFieldType_new");
ALTER TYPE "SweepstakesFormFieldType" RENAME TO "SweepstakesFormFieldType_old";
ALTER TYPE "SweepstakesFormFieldType_new" RENAME TO "SweepstakesFormFieldType";
DROP TYPE "public"."SweepstakesFormFieldType_old";
COMMIT;
