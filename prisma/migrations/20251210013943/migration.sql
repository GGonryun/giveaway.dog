/*
  Warnings:

  - You are about to drop the column `allowedLoginMethods` on the `SweepstakesAudience` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SweepstakesAudience" DROP COLUMN "allowedLoginMethods",
ADD COLUMN     "allowedIdentities" "IdentityProvider"[] DEFAULT ARRAY['TWITTER', 'GOOGLE', 'DISCORD', 'EMAIL', 'TWITCH', 'STEAM', 'TIKTOK']::"IdentityProvider"[];
