/*
  Warnings:

  - You are about to drop the column `accountId` on the `Integration` table. All the data in the column will be lost.
  - Added the required column `account_id` to the `Integration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Integration" DROP COLUMN "accountId",
ADD COLUMN     "account_id" TEXT NOT NULL;
