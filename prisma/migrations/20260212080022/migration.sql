-- CreateTable
CREATE TABLE "EventSubSubscription" (
    "id" TEXT NOT NULL,
    "twitch_id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "broadcaster_user_id" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "callback" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "last_event_received_at" TIMESTAMP(3),

    CONSTRAINT "EventSubSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventSubSubscription_twitch_id_key" ON "EventSubSubscription"("twitch_id");

-- CreateIndex
CREATE INDEX "EventSubSubscription_integrationId_idx" ON "EventSubSubscription"("integrationId");

-- CreateIndex
CREATE INDEX "EventSubSubscription_status_idx" ON "EventSubSubscription"("status");

-- AddForeignKey
ALTER TABLE "EventSubSubscription" ADD CONSTRAINT "EventSubSubscription_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
