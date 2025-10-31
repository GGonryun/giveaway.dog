/*
  Warnings:

  - You are about to drop the `TwitterDraw` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TwitterDrawPrizeClaim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TwitterDrawWinner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TwitterDrawPrizeClaim" DROP CONSTRAINT "TwitterDrawPrizeClaim_drawId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TwitterDrawPrizeClaim" DROP CONSTRAINT "TwitterDrawPrizeClaim_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TwitterDrawWinner" DROP CONSTRAINT "TwitterDrawWinner_drawId_fkey";

-- DropTable
DROP TABLE "public"."TwitterDraw";

-- DropTable
DROP TABLE "public"."TwitterDrawPrizeClaim";

-- DropTable
DROP TABLE "public"."TwitterDrawWinner";

-- DropEnum
DROP TYPE "public"."TwitterEngagementType";
