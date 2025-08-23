-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('HOST', 'PARTICIPATE', 'LEARN');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "type" "public"."UserType"[] DEFAULT ARRAY['LEARN']::"public"."UserType"[];
