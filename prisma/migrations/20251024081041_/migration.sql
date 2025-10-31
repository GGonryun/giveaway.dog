-- CreateEnum
CREATE TYPE "TwitterEngagementType" AS ENUM ('LIKE', 'RETWEET', 'QUOTE', 'REPLY');

-- CreateTable
CREATE TABLE "TwitterDraw" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tweetUrl" TEXT NOT NULL,
    "engagementType" "TwitterEngagementType" NOT NULL,
    "numberOfWinners" INTEGER NOT NULL DEFAULT 1,
    "mustFollowUser" TEXT,
    "requireProfileImage" BOOLEAN NOT NULL DEFAULT false,
    "requireBanner" BOOLEAN NOT NULL DEFAULT false,
    "requireLocation" BOOLEAN NOT NULL DEFAULT false,
    "requireDescription" BOOLEAN NOT NULL DEFAULT false,
    "followerFollowingRatio" DOUBLE PRECISION,
    "minFollowers" INTEGER,
    "minTweetCount" INTEGER,
    "minAccountAgeDays" INTEGER,
    "maxDaysSinceLastTweet" INTEGER,
    "hasPrizeCode" BOOLEAN NOT NULL DEFAULT false,
    "prizeCode" TEXT,

    CONSTRAINT "TwitterDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitterDrawWinner" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "twitterUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwitterDrawWinner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitterDrawPrizeClaim" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "twitterUserId" TEXT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterDrawPrizeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TwitterDrawWinner_drawId_idx" ON "TwitterDrawWinner"("drawId");

-- CreateIndex
CREATE INDEX "TwitterDrawPrizeClaim_drawId_idx" ON "TwitterDrawPrizeClaim"("drawId");

-- CreateIndex
CREATE INDEX "TwitterDrawPrizeClaim_twitterUserId_idx" ON "TwitterDrawPrizeClaim"("twitterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TwitterDrawPrizeClaim_drawId_userId_key" ON "TwitterDrawPrizeClaim"("drawId", "userId");

-- AddForeignKey
ALTER TABLE "TwitterDrawWinner" ADD CONSTRAINT "TwitterDrawWinner_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "TwitterDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwitterDrawPrizeClaim" ADD CONSTRAINT "TwitterDrawPrizeClaim_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "TwitterDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwitterDrawPrizeClaim" ADD CONSTRAINT "TwitterDrawPrizeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
