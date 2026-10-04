/*
  Warnings:

  - You are about to drop the `GeoIp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserGeo" DROP CONSTRAINT "UserGeo_geoId_fkey";

-- DropTable
DROP TABLE "public"."GeoIp";

-- CreateTable
CREATE TABLE "IpAddress" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Geo" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "timezone" TEXT,
    "org" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIpAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIpAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IpAddress_ip_key" ON "IpAddress"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "Geo_ip_key" ON "Geo"("ip");

-- CreateIndex
CREATE INDEX "UserIpAddress_ipId_idx" ON "UserIpAddress"("ipId");

-- CreateIndex
CREATE INDEX "UserIpAddress_userId_idx" ON "UserIpAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIpAddress_userId_ipId_key" ON "UserIpAddress"("userId", "ipId");

-- AddForeignKey
ALTER TABLE "UserIpAddress" ADD CONSTRAINT "UserIpAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIpAddress" ADD CONSTRAINT "UserIpAddress_ipId_fkey" FOREIGN KEY ("ipId") REFERENCES "IpAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGeo" ADD CONSTRAINT "UserGeo_geoId_fkey" FOREIGN KEY ("geoId") REFERENCES "Geo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
