-- DropForeignKey
ALTER TABLE "public"."UserEvent" DROP CONSTRAINT "UserEvent_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
