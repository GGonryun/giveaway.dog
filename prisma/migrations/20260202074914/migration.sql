-- CreateTable
CREATE TABLE "TwitterPickerUser" (
    "id" TEXT NOT NULL,
    "twitterPickerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "description" TEXT,
    "url" TEXT,
    "location" TEXT,
    "profileImageUrl" TEXT,
    "bannerImageUrl" TEXT,
    "createdAt" TIMESTAMP(3),
    "canDm" BOOLEAN,
    "followersCount" INTEGER,
    "followingCount" INTEGER,
    "tweetCount" INTEGER,
    "verified" BOOLEAN,

    CONSTRAINT "TwitterPickerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitterPost" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "favoriteCount" INTEGER,
    "retweetCount" INTEGER,
    "replyCount" INTEGER,
    "viewCount" INTEGER,
    "quoteCount" INTEGER,
    "conversationId" TEXT,
    "inReplyToUserId" TEXT,
    "isQuoteStatus" BOOLEAN,
    "lang" TEXT,
    "media" JSONB,
    "urls" JSONB,
    "hashtags" JSONB,
    "mentions" JSONB,

    CONSTRAINT "TwitterPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitterPickerDraw" (
    "id" TEXT NOT NULL,
    "pickerId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterPickerDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitterPicker" (
    "id" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "tweetId" TEXT,
    "teamId" TEXT NOT NULL,
    "minPostCount" INTEGER,
    "minAccountAgeDays" INTEGER,
    "minFollowersCount" INTEGER,
    "minFollowingCount" INTEGER,
    "requireProfileImage" BOOLEAN,
    "requireBannerImage" BOOLEAN,
    "requireLocation" BOOLEAN,
    "requireBio" BOOLEAN,
    "runAt" TIMESTAMP(3),
    "status" "PickerStatus" NOT NULL DEFAULT 'DRAFT',
    "winners" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterPicker_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TwitterPickerUser" ADD CONSTRAINT "TwitterPickerUser_twitterPickerId_fkey" FOREIGN KEY ("twitterPickerId") REFERENCES "TwitterPicker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwitterPickerDraw" ADD CONSTRAINT "TwitterPickerDraw_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "TwitterPicker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwitterPickerDraw" ADD CONSTRAINT "TwitterPickerDraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TwitterPickerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwitterPicker" ADD CONSTRAINT "TwitterPicker_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "TwitterPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwitterPicker" ADD CONSTRAINT "TwitterPicker_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
