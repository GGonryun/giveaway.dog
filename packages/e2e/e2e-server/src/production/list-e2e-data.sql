WITH e2e_user AS (
  SELECT id, email, "createdAt"
  FROM "User"
  WHERE email ~ '^e2e-[a-z0-9]+(-[a-z0-9]{4,10})?@example\.com$'
),
e2e_team AS (
  SELECT t.id, t.slug, t."createdAt"
  FROM "Team" t
  WHERE (
      t.slug LIKE 'e2e-%'
      OR EXISTS (SELECT 1 FROM "Membership" m WHERE m."teamId" = t.id)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "Membership" m
      WHERE m."teamId" = t.id
        AND m."userId" NOT IN (SELECT id FROM e2e_user)
    )
)
SELECT
  'team' AS kind,
  t.slug AS name,
  t."createdAt" AS created_at,
  (SELECT count(*) FROM "Sweepstakes" s WHERE s."teamId" = t.id) AS giveaways,
  NULL::bigint AS entries,
  'delete' AS action
FROM e2e_team t
UNION ALL
SELECT
  'user',
  u.email,
  u."createdAt",
  NULL,
  (SELECT count(*) FROM "Participant" p WHERE p."userId" = u.id),
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM "Membership" m
      WHERE m."userId" = u.id
        AND m."teamId" NOT IN (SELECT id FROM e2e_team)
    ) THEN 'keep: member of a team that is not e2e'
    ELSE 'delete'
  END
FROM e2e_user u
UNION ALL
SELECT
  'team kept',
  t.slug,
  t."createdAt",
  (SELECT count(*) FROM "Sweepstakes" s WHERE s."teamId" = t.id),
  NULL,
  'keep: has a member who is not e2e'
FROM "Team" t
WHERE t.slug LIKE 'e2e-%'
  AND t.id NOT IN (SELECT id FROM e2e_team)
ORDER BY kind, created_at;
