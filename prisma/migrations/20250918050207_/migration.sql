/*
  Warnings:

  - You are about to drop the column `domain` on the `UserEvent` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `UserEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserEvent" DROP COLUMN "domain",
DROP COLUMN "region",
ADD COLUMN     "geo" JSONB;
