-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "link" TEXT;

-- Populate link field for existing accounts
-- Twitter: https://x.com/{label} (strip @ from label)
UPDATE "Account"
SET "link" = 'https://x.com/' || LTRIM("label", '@')
WHERE "provider" = 'twitter' AND "label" IS NOT NULL;

-- Twitch: https://www.twitch.tv/{label} (lowercase)
UPDATE "Account"
SET "link" = 'https://www.twitch.tv/' || LOWER("label")
WHERE "provider" = 'twitch' AND "label" IS NOT NULL;

-- Steam: https://steamcommunity.com/id/{label}/ (lowercase)
UPDATE "Account"
SET "link" = 'https://steamcommunity.com/id/' || LOWER("label") || '/'
WHERE "provider" = 'steam' AND "label" IS NOT NULL;

-- Kick: https://kick.com/{label} (lowercase)
UPDATE "Account"
SET "link" = 'https://kick.com/' || LOWER("label")
WHERE "provider" = 'kick' AND "label" IS NOT NULL;

-- Discord: https://discord.com/users/{providerAccountId}
UPDATE "Account"
SET "link" = 'https://discord.com/users/' || "providerAccountId"
WHERE "provider" = 'discord' AND "providerAccountId" IS NOT NULL;

-- Google: mailto:{label}
UPDATE "Account"
SET "link" = 'mailto:' || "label"
WHERE "provider" = 'google' AND "label" IS NOT NULL;
