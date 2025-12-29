-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('SWEEPSTAKES', 'PICKER');

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "tags" TEXT[],
    "type" "TemplateType" NOT NULL DEFAULT 'SWEEPSTAKES',
    "content" JSONB NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_teamId_idx" ON "Template"("teamId");

-- CreateIndex
CREATE INDEX "Template_createdById_idx" ON "Template"("createdById");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
