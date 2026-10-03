/*
  Warnings:

  - Made the column `teamId` on table `Picker` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Picker" ALTER COLUMN "teamId" SET NOT NULL;
