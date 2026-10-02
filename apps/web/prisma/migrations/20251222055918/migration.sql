-- CreateEnum
CREATE TYPE "SweepstakesJobType" AS ENUM ('NOTIFY_PUBLISH_ON_DISCORD', 'NOTIFY_PUBLISH_ON_TWITTER');

-- CreateEnum
CREATE TYPE "SweepstakesJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SweepstakesJob" (
    "id" TEXT NOT NULL,
    "sweepstakesId" TEXT NOT NULL,
    "data" JSONB,
    "type" "SweepstakesJobType" NOT NULL,
    "status" "SweepstakesJobStatus" NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SweepstakesJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SweepstakesJob" ADD CONSTRAINT "SweepstakesJob_sweepstakesId_fkey" FOREIGN KEY ("sweepstakesId") REFERENCES "Sweepstakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
