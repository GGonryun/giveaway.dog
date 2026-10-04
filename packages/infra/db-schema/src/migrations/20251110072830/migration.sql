-- CreateTable
CREATE TABLE "TeamInviteLink" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInviteEmail" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInviteEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInviteLink_teamId_key" ON "TeamInviteLink"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInviteEmail_teamId_email_key" ON "TeamInviteEmail"("teamId", "email");

-- AddForeignKey
ALTER TABLE "TeamInviteLink" ADD CONSTRAINT "TeamInviteLink_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInviteEmail" ADD CONSTRAINT "TeamInviteEmail_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
