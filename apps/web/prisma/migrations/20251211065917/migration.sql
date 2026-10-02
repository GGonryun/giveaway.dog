/*
  Warnings:

  - You are about to drop the column `options` on the `SweepstakesFormField` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SweepstakesFormField" DROP COLUMN "options",
ADD COLUMN     "minimum" INTEGER,
ADD COLUMN     "placeholder" TEXT;
