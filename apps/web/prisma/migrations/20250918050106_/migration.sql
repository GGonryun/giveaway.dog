/*
  Warnings:

  - The values [TASK_COMPLETE] on the enum `UserEventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `system` on the `UserEvent` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserEventType_new" AS ENUM ('LOGIN');
ALTER TABLE "public"."UserEvent" ALTER COLUMN "type" TYPE "public"."UserEventType_new" USING ("type"::text::"public"."UserEventType_new");
ALTER TYPE "public"."UserEventType" RENAME TO "UserEventType_old";
ALTER TYPE "public"."UserEventType_new" RENAME TO "UserEventType";
DROP TYPE "public"."UserEventType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."UserEvent" DROP COLUMN "system";
