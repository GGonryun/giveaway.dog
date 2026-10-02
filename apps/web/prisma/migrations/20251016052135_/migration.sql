/*
  Warnings:

  - You are about to drop the column `url` on the `SweepstakesVisibility` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `SweepstakesVisibility` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."SweepstakesVisibility_url_key";

-- AlterTable
ALTER TABLE "SweepstakesVisibility" DROP COLUMN "url",
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SweepstakesVisibility_slug_key" ON "SweepstakesVisibility"("slug");
