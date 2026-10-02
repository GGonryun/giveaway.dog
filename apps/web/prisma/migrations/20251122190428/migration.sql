/*
  Warnings:

  - The values [OAUTH_UPGRADED] on the enum `UserSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserSource_new" AS ENUM ('SIGNUP', 'TWITTER_IMPORT', 'MANUAL_IMPORT', 'DISCORD_IMPORT');
ALTER TABLE "public"."User" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "source" TYPE "UserSource_new" USING ("source"::text::"UserSource_new");
ALTER TYPE "UserSource" RENAME TO "UserSource_old";
ALTER TYPE "UserSource_new" RENAME TO "UserSource";
DROP TYPE "public"."UserSource_old";
ALTER TABLE "User" ALTER COLUMN "source" SET DEFAULT 'SIGNUP';
COMMIT;
