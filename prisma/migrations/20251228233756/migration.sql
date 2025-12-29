/*
  Warnings:

  - A unique constraint covering the columns `[provider,account_id]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Integration_provider_account_id_key" ON "Integration"("provider", "account_id");
