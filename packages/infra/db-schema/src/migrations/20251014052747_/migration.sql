/*
  Warnings:

  - You are about to drop the column `lat` on the `Geo` table. All the data in the column will be lost.
  - You are about to drop the column `lon` on the `Geo` table. All the data in the column will be lost.
  - You are about to drop the column `org` on the `Geo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Geo" DROP COLUMN "lat",
DROP COLUMN "lon",
DROP COLUMN "org",
ADD COLUMN     "callingCode" TEXT,
ADD COLUMN     "continent" TEXT,
ADD COLUMN     "continentCode" TEXT,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "postal" TEXT,
ADD COLUMN     "regionCode" TEXT;

-- AlterTable
ALTER TABLE "IpAddress" ADD COLUMN     "asn" INTEGER,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "isp" TEXT,
ADD COLUMN     "org" TEXT;
