/*
  Warnings:

  - You are about to drop the column `mandatory` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sweepstakesId,index]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "mandatory",
DROP COLUMN "value",
ADD COLUMN     "index" INTEGER,
ALTER COLUMN "type" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Task_sweepstakesId_index_key" ON "public"."Task"("sweepstakesId", "index");
