/*
  Warnings:

  - You are about to drop the column `fingerprint` on the `UserEvent` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `UserEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserEvent" DROP COLUMN "fingerprint",
DROP COLUMN "ip",
ADD COLUMN     "acceptLanguage" TEXT,
ADD COLUMN     "screen" TEXT,
ADD COLUMN     "timeZone" TEXT,
ALTER COLUMN "userAgent" DROP NOT NULL;
