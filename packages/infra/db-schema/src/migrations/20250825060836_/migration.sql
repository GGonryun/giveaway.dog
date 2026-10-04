/*
  Warnings:

  - The values [LEARN] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserType_new" AS ENUM ('HOST', 'PARTICIPATE');
ALTER TABLE "public"."User" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "type" TYPE "public"."UserType_new"[] USING ("type"::text::"public"."UserType_new"[]);
ALTER TYPE "public"."UserType" RENAME TO "UserType_old";
ALTER TYPE "public"."UserType_new" RENAME TO "UserType";
DROP TYPE "public"."UserType_old";
ALTER TABLE "public"."User" ALTER COLUMN "type" SET DEFAULT ARRAY['PARTICIPATE']::"public"."UserType"[];
COMMIT;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "type" SET DEFAULT ARRAY['PARTICIPATE']::"public"."UserType"[];
