/*
  Warnings:

  - You are about to drop the `Geo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserGeo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserGeo" DROP CONSTRAINT "UserGeo_geoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserGeo" DROP CONSTRAINT "UserGeo_userId_fkey";

-- AlterTable
ALTER TABLE "IpAddress" ADD COLUMN     "callingCode" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "continent" TEXT,
ADD COLUMN     "continentCode" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "postal" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "regionCode" TEXT,
ADD COLUMN     "timezone" TEXT;

-- DropTable
DROP TABLE "public"."Geo";

-- DropTable
DROP TABLE "public"."UserGeo";
