-- Update Steam account links to use the correct profile URL format
UPDATE "Account"
SET "link" = 'https://steamcommunity.com/profiles/' || "providerAccountId"
WHERE "provider" = 'steam';