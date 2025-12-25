-- CreateEnum
CREATE TYPE "AutomatedPostJobType" AS ENUM ('NOTIFY_PUBLISH_ON_TWITTER');

-- CreateEnum
CREATE TYPE "AutomatedPostJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "AutomatedPostJob" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "data" JSONB,
    "error" JSONB,
    "type" "AutomatedPostJobType" NOT NULL,
    "status" "AutomatedPostJobStatus" NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomatedPostJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutomatedPostJob_sweepstakesId_type_key" ON "AutomatedPostJob"("sweepstakesId", "type");

-- AddForeignKey
ALTER TABLE "AutomatedPostJob" ADD CONSTRAINT "AutomatedPostJob_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
