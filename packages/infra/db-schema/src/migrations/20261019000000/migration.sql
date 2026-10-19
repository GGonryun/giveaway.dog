-- CreateTable
CREATE TABLE "QueueDrain" (
    "name" TEXT NOT NULL,
    "runId" TEXT,
    "running" BOOLEAN NOT NULL DEFAULT false,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueDrain_pkey" PRIMARY KEY ("name")
);

INSERT INTO "QueueDrain" ("name") VALUES ('tracking'), ('scoring');
