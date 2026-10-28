-- Point each draw of a duplicate picker user at the first row of that user
WITH "ranked" AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (PARTITION BY "pickerId", "userId" ORDER BY "id") AS "keepId"
  FROM "TwitterPickerUser"
)
UPDATE "TwitterPickerDraw" AS "draw"
SET "userId" = "ranked"."keepId"
FROM "ranked"
WHERE "draw"."userId" = "ranked"."id"
  AND "ranked"."id" <> "ranked"."keepId";

-- Delete the duplicate picker users
DELETE FROM "TwitterPickerUser" AS "user"
USING "TwitterPickerUser" AS "kept"
WHERE "user"."pickerId" = "kept"."pickerId"
  AND "user"."userId" = "kept"."userId"
  AND "user"."id" > "kept"."id";

-- Delete the duplicate posts
DELETE FROM "TwitterPost" AS "post"
USING "TwitterPost" AS "kept"
WHERE "post"."pickerId" = "kept"."pickerId"
  AND "post"."tweetId" = "kept"."tweetId"
  AND "post"."id" > "kept"."id";

-- CreateIndex
CREATE UNIQUE INDEX "TwitterPickerUser_pickerId_userId_key" ON "TwitterPickerUser"("pickerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TwitterPost_pickerId_tweetId_key" ON "TwitterPost"("pickerId", "tweetId");
