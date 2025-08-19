-- DropForeignKey
ALTER TABLE "public"."MinimumAgeRestriction" DROP CONSTRAINT "MinimumAgeRestriction_giveawayId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Prize" DROP CONSTRAINT "Prize_giveawayId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RegionRestriction" DROP CONSTRAINT "RegionRestriction_giveawayId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_giveawayId_fkey";

-- AddForeignKey
ALTER TABLE "public"."RegionRestriction" ADD CONSTRAINT "RegionRestriction_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MinimumAgeRestriction" ADD CONSTRAINT "MinimumAgeRestriction_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prize" ADD CONSTRAINT "Prize_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
