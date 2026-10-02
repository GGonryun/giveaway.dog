/*
  Warnings:

  - You are about to drop the column `code` on the `RegionRestriction` table. All the data in the column will be lost.
  - Added the required column `region` to the `RegionRestriction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."RegionRestriction" DROP COLUMN "code",
ADD COLUMN     "region" TEXT NOT NULL;
