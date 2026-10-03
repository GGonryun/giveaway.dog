-- CreateTable
CREATE TABLE "SiteMetric" (
    "key" TEXT NOT NULL,
    "value" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMetric_pkey" PRIMARY KEY ("key")
);
