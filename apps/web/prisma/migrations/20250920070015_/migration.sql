/*
  Warnings:

  - You are about to drop the column `age` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "age",
ADD COLUMN     "ageVerified" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "public"."AgeVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgeVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgeVerification_userId_sweepstakesId_key" ON "public"."AgeVerification"("userId", "sweepstakesId");

-- AddForeignKey
ALTER TABLE "public"."AgeVerification" ADD CONSTRAINT "AgeVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgeVerification" ADD CONSTRAINT "AgeVerification_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "public"."Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
