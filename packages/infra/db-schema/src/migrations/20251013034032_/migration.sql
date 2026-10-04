-- AlterTable
ALTER TABLE "UserEvent" ADD COLUMN     "fingerprint" TEXT;

-- CreateTable
CREATE TABLE "UserQuality" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "riskFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "processedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoIp" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "geo" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoIp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceAgent" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFingerprint" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGeo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "geoId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprintId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeoIp_ip_key" ON "GeoIp"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceAgent_agent_key" ON "DeviceAgent"("agent");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFingerprint_fingerprint_key" ON "DeviceFingerprint"("fingerprint");

-- CreateIndex
CREATE INDEX "UserGeo_geoId_idx" ON "UserGeo"("geoId");

-- CreateIndex
CREATE INDEX "UserGeo_userId_idx" ON "UserGeo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGeo_userId_geoId_key" ON "UserGeo"("userId", "geoId");

-- CreateIndex
CREATE INDEX "UserAgent_agentId_idx" ON "UserAgent"("agentId");

-- CreateIndex
CREATE INDEX "UserAgent_userId_idx" ON "UserAgent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAgent_userId_agentId_key" ON "UserAgent"("userId", "agentId");

-- CreateIndex
CREATE INDEX "UserFingerprint_fingerprintId_idx" ON "UserFingerprint"("fingerprintId");

-- CreateIndex
CREATE INDEX "UserFingerprint_userId_idx" ON "UserFingerprint"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFingerprint_userId_fingerprintId_key" ON "UserFingerprint"("userId", "fingerprintId");

-- AddForeignKey
ALTER TABLE "UserQuality" ADD CONSTRAINT "UserQuality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGeo" ADD CONSTRAINT "UserGeo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGeo" ADD CONSTRAINT "UserGeo_geoId_fkey" FOREIGN KEY ("geoId") REFERENCES "GeoIp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAgent" ADD CONSTRAINT "UserAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAgent" ADD CONSTRAINT "UserAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "DeviceAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFingerprint" ADD CONSTRAINT "UserFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFingerprint" ADD CONSTRAINT "UserFingerprint_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "DeviceFingerprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
