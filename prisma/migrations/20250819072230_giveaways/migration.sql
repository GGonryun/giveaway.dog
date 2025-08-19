/*
  Warnings:

  - You are about to drop the `SlackInstallation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SlackInstallationState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SlackTeam` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."GiveawayStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PAUSED', 'CANCELED', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."RegionRestrictionFilter" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('BONUS_TASK', 'VISIT_URL');

-- DropForeignKey
ALTER TABLE "public"."SlackInstallation" DROP CONSTRAINT "SlackInstallation_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SlackInstallation" DROP CONSTRAINT "SlackInstallation_userId_fkey";

-- DropTable
DROP TABLE "public"."SlackInstallation";

-- DropTable
DROP TABLE "public"."SlackInstallationState";

-- DropTable
DROP TABLE "public"."SlackTeam";

-- DropEnum
DROP TYPE "public"."BotType";

-- CreateTable
CREATE TABLE "public"."Giveaway" (
    "id" TEXT NOT NULL,
    "status" "public"."GiveawayStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT,
    "description" TEXT,
    "terms" TEXT,
    "banner" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeZone" TEXT,
    "requireEmail" BOOLEAN,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Prize" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "name" TEXT,
    "winners" INTEGER,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegionRestriction" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "filter" "public"."RegionRestrictionFilter" NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "RegionRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MinimumAgeRestriction" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'checkbox',

    CONSTRAINT "MinimumAgeRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "type" "public"."TaskType" NOT NULL,
    "title" TEXT,
    "value" INTEGER,
    "mandatory" BOOLEAN,
    "config" JSONB,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MinimumAgeRestriction_giveawayId_key" ON "public"."MinimumAgeRestriction"("giveawayId");

-- AddForeignKey
ALTER TABLE "public"."Prize" ADD CONSTRAINT "Prize_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionRestriction" ADD CONSTRAINT "RegionRestriction_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MinimumAgeRestriction" ADD CONSTRAINT "MinimumAgeRestriction_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
