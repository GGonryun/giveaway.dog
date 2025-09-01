/*
  Warnings:

  - You are about to drop the column `title` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "title",
DROP COLUMN "type";
