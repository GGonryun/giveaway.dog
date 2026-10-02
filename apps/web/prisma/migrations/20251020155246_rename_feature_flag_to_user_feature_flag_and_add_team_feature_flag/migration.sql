-- AlterTable (rename FeatureFlag to UserFeatureFlag)
ALTER TABLE "public"."FeatureFlag" RENAME TO "UserFeatureFlag";

-- CreateTable
CREATE TABLE "TeamFeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamFeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamFeatureFlag_key_teamId_key" ON "TeamFeatureFlag"("key", "teamId");

-- AddForeignKey
ALTER TABLE "TeamFeatureFlag" ADD CONSTRAINT "TeamFeatureFlag_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
