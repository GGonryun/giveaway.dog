-- CreateTable
CREATE TABLE "public"."ImageMetadata" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,

    CONSTRAINT "ImageMetadata_pkey" PRIMARY KEY ("id")
);
