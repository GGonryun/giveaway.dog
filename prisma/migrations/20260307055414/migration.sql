-- Set all existing users to onboarded = true
UPDATE "User" SET "onboarded" = true;

-- Set accountType to HOST for all users with the "host-dashboard" feature flag
UPDATE "User"
SET "accountType" = 'HOST'
WHERE "id" IN (
  SELECT "userId"
  FROM "UserFeatureFlag"
  WHERE "key" = 'host-dashboard'
);
