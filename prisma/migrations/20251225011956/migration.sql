/*
  Warnings:

  - The values [NOTIFY_PUBLISH_ON_TWITTER] on the enum `AutomatedPostJobType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AutomatedPostJobType_new" AS ENUM ('POST_TO_TWITTER');
ALTER TABLE "AutomatedPostJob" ALTER COLUMN "type" TYPE "AutomatedPostJobType_new" USING ("type"::text::"AutomatedPostJobType_new");
ALTER TYPE "AutomatedPostJobType" RENAME TO "AutomatedPostJobType_old";
ALTER TYPE "AutomatedPostJobType_new" RENAME TO "AutomatedPostJobType";
DROP TYPE "public"."AutomatedPostJobType_old";
COMMIT;
