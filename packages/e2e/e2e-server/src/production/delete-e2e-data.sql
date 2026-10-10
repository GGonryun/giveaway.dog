BEGIN;

CREATE TEMPORARY TABLE e2e_user ON COMMIT DROP AS
SELECT id
FROM "User"
WHERE email ~ '^e2e-[a-z0-9]+(-[a-z0-9]{4,10})?@example\.com$';

CREATE TEMPORARY TABLE e2e_team ON COMMIT DROP AS
SELECT t.id
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
  );

DELETE FROM "TwitterPickerDraw" d
USING "TwitterPicker" p
WHERE d."pickerId" = p.id
  AND p."teamId" IN (SELECT id FROM e2e_team);

DELETE FROM "Team"
WHERE id IN (SELECT id FROM e2e_team);

DELETE FROM "User" u
WHERE u.id IN (SELECT id FROM e2e_user)
  AND NOT EXISTS (SELECT 1 FROM "Membership" m WHERE m."userId" = u.id);

COMMIT;
