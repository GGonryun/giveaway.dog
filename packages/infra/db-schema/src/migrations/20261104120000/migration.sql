UPDATE "Account"
SET "access_token" = NULL,
    "refresh_token" = NULL,
    "expires_at" = NULL,
    "id_token" = NULL
WHERE "provider" = 'tiktok';
