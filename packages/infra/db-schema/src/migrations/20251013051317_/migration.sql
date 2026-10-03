-- CreateTable
CREATE TABLE "UserScoringRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserScoringRequest_pkey" PRIMARY KEY ("id")
);
