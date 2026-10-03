-- AlterTable
ALTER TABLE "SweepstakesAudience" ADD COLUMN     "allowedLoginMethods" "IdentityProvider"[] DEFAULT ARRAY['TWITTER', 'GOOGLE', 'DISCORD', 'EMAIL', 'TIKTOK']::"IdentityProvider"[];
