-- Update all existing team logos to the default logo
UPDATE "Team" SET "logo" = 'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/taki.png';

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "logo" SET DEFAULT 'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/taki.png';
