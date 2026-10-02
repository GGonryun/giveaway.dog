/*
  Warnings:

  - The values [TWITTER_LIKE] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('BONUS_TASK', 'VISIT_URL', 'TWITTER_CONNECT', 'TWITTER_FOLLOW', 'TWITTER_RETWEET');
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "public"."TaskType_old";
COMMIT;
