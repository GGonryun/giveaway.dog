# Twitter Import Auto-Merge Testing Guide

This document explains how to verify the auto-merge behavior for imported Twitter users through log inspection.

## Test Scenario: Imported User Signs In

### Prerequisites
1. Run the seed script to create an imported Twitter user:
   ```bash
   npx tsx scripts/seed-twitter-import.ts <sweepstakesId> <taskId>
   ```

2. Verify the user was created with source=TWITTER_IMPORT:
   ```sql
   SELECT id, name, email, source FROM "User" WHERE name = 'TheGiveawayDog';
   ```

### Expected Log Flow

When the imported user signs in with Twitter for the first time, you should see the following log sequence:

#### 1. **signIn Callback (First)**
```
[Auth] signIn callback triggered {
  provider: 'twitter',
  providerAccountId: '1948567947976605699',
  userId: '<userId>',
  userEmail: null
}

[Auth] Existing account found {
  accountUserId: '<userId>',
  userSource: 'TWITTER_IMPORT',
  userName: 'TheGiveawayDog',
  isImported: true
}

[Auth] 🔄 Updating OAuth tokens for imported user {
  userId: '<userId>',
  provider: 'twitter',
  hasAccessToken: true,
  hasRefreshToken: true,
  hasScope: true
}

[Auth] OAuth tokens updated successfully {
  provider: 'twitter',
  fieldsUpdated: ['scope', 'access_token', 'refresh_token', 'expires_at']
}
```

**✅ What this confirms:**
- System detected existing Twitter account (auto-merge working!)
- Identified user as TWITTER_IMPORT source
- Updated OAuth tokens (user now has full access)

#### 2. **linkAccount Event (If New OAuth Tokens)**
```
[Auth] linkAccount event triggered {
  provider: 'twitter',
  providerAccountId: '1948567947976605699',
  userId: '<userId>',
  profileUsername: 'TheGiveawayDog',
  profileEmail: null
}

[Auth] 🎯 TWITTER IMPORT AUTO-MERGE DETECTED - Imported user signing in {
  userId: '<userId>',
  userName: 'TheGiveawayDog',
  provider: 'twitter',
  providerAccountId: '1948567947976605699',
  previousEmail: null,
  newEmail: null
}

[Auth] Updated account label and link {
  provider: 'twitter',
  label: 'TheGiveawayDog',
  link: 'https://x.com/TheGiveawayDog'
}
```

**✅ What this confirms:**
- Account metadata (label, link) updated
- Special emoji 🎯 indicates auto-merge detected
- User's source remains TWITTER_IMPORT

#### 3. **JWT Callback**
```
[Auth] JWT callback - Adding user ID to token {
  userId: '<userId>',
  userName: 'TheGiveawayDog',
  userEmail: null,
  trigger: 'signIn'
}
```

**✅ What this confirms:**
- JWT token created with imported user's ID
- Session will be for the imported account (not a new one)

#### 4. **Session Callback**
```
[Auth] Session callback - Creating session for user {
  userId: '<userId>',
  sessionUserEmail: null,
  sessionUserName: 'TheGiveawayDog',
  trigger: 'getSession'
}
```

**✅ What this confirms:**
- Session successfully created for imported user
- User is now fully authenticated

---

## Verification Checklist

After the imported user signs in, verify:

### 1. **User Record (No Duplication)**
```sql
SELECT id, name, email, source
FROM "User"
WHERE name = 'TheGiveawayDog';
```
**Expected:** Only ONE user record exists
**Expected source:** `TWITTER_IMPORT` (unchanged)

### 2. **Account Record (Tokens Updated)**
```sql
SELECT provider, "providerAccountId", "userId", scope,
       (access_token IS NOT NULL) as has_token,
       (refresh_token IS NOT NULL) as has_refresh
FROM "Account"
WHERE provider = 'twitter' AND "providerAccountId" = '1948567947976605699';
```
**Expected:**
- `userId` matches the imported user's ID
- `has_token` = true (OAuth tokens now stored)
- `has_refresh` = true
- `scope` is populated

### 3. **Task Completions (Preserved)**
```sql
SELECT tc.id, tc."userId", tc."taskId", tc.proof
FROM "TaskCompletion" tc
WHERE tc."userId" = '<userId>';
```
**Expected:** All imported task completions still exist and are linked to the same userId

### 4. **Session (User Can Access Platform)**
- User should be able to access protected routes (e.g., `/app`)
- User should see their task completions in the sweepstakes
- User dashboard should show their entries

---

## Anti-Patterns (What Should NOT Happen)

### ❌ Duplicate User Created
If you see:
```sql
SELECT COUNT(*) FROM "User" WHERE name = 'TheGiveawayDog';
-- Result: 2 or more
```
**Problem:** Auto-merge failed, new user was created instead

### ❌ Account Conflict Error
If you see in logs:
```
[NextAuth Error] Account already exists for different user
```
**Problem:** Composite key constraint prevented linking, but should not happen

### ❌ Task Completions Lost
If task completions point to a different userId:
```sql
SELECT "userId", COUNT(*)
FROM "TaskCompletion"
WHERE proof->>'twitterUserId' = '1948567947976605699'
GROUP BY "userId";
-- Result: Multiple userIds
```
**Problem:** Entries got split across users

### ❌ No OAuth Tokens
If after sign-in:
```sql
SELECT access_token FROM "Account"
WHERE provider = 'twitter' AND "providerAccountId" = '1948567947976605699';
-- Result: NULL
```
**Problem:** signIn callback didn't update tokens

---

## Edge Case: Second Provider Link (Google/Discord)

If the imported user later tries to link Google/Discord with the same email:

### Expected Behavior (Auto-Link)
Since `allowDangerousEmailAccountLinking: true` is enabled for Twitter/Google/Discord:

```
[Auth] linkAccount event triggered {
  provider: 'google',
  providerAccountId: '<googleId>',
  userId: '<same-userId-as-twitter>',
  profileEmail: 'user@example.com'
}
```

**✅ What this confirms:**
- Google account linked to SAME user (auto-link worked)
- User now has both Twitter and Google providers
- Task completions remain under the same userId

### Verification
```sql
SELECT provider, "providerAccountId", "userId"
FROM "Account"
WHERE "userId" = '<userId>';
```
**Expected:** 2 rows (twitter + google), same userId

---

## Success Criteria Summary

✅ **Auto-Merge Successful** when:
1. Log shows 🎯 emoji with "TWITTER IMPORT AUTO-MERGE DETECTED"
2. Only ONE user record exists with source=TWITTER_IMPORT
3. Account record has OAuth tokens updated
4. Task completions remain linked to the same userId
5. User can successfully access the platform
6. Session contains the imported user's ID

❌ **Auto-Merge Failed** when:
1. Multiple user records exist for the same Twitter account
2. New user created instead of reusing imported user
3. Task completions split across multiple userIds
4. Account linking errors in logs
5. OAuth tokens not stored

---

## Logging Output Examples

### New User Sign-Up (Not Imported)
For comparison, here's what a regular new user looks like:

```
[Auth] signIn callback triggered {
  provider: 'twitter',
  providerAccountId: '<newTwitterId>',
  userId: '<newUserId>',
  userEmail: 'new@example.com'
}

[Auth] Account not found, will be created by linkAccount {
  provider: 'twitter',
  providerAccountId: '<newTwitterId>'
}

[Auth] linkAccount event triggered {
  provider: 'twitter',
  providerAccountId: '<newTwitterId>',
  userId: '<newUserId>',
  profileUsername: 'newuser',
  profileEmail: 'new@example.com'
}
```

**Notice:** No 🎯 emoji, user is not identified as TWITTER_IMPORT

---

## Troubleshooting

### Issue: No logs appearing
**Solution:** Check that your development server is running and logs are not filtered

### Issue: 🎯 emoji not appearing
**Solution:** User might not be TWITTER_IMPORT source, check database:
```sql
SELECT source FROM "User" WHERE id = '<userId>';
```

### Issue: Multiple accounts with same Twitter ID
**Solution:** Database constraint should prevent this. Check schema:
```sql
SELECT * FROM "Account" WHERE provider = 'twitter' AND "providerAccountId" = '<twitterId>';
```

---

## Quick Test Script

Run this after seeding to verify setup:

```bash
# 1. Create imported user
npx tsx scripts/seed-twitter-import.ts <sweepstakesId> <taskId>

# 2. Check user was created
psql $DATABASE_URL -c "SELECT id, name, source FROM \"User\" WHERE name = 'TheGiveawayDog';"

# 3. Check account was linked
psql $DATABASE_URL -c "SELECT provider, \"providerAccountId\", \"userId\" FROM \"Account\" WHERE provider = 'twitter' AND \"providerAccountId\" = '1948567947976605699';"

# 4. Now sign in with Twitter using the @TheGiveawayDog account
# Watch server logs for 🎯 emoji

# 5. After sign-in, verify tokens updated
psql $DATABASE_URL -c "SELECT (access_token IS NOT NULL) as has_token FROM \"Account\" WHERE provider = 'twitter' AND \"providerAccountId\" = '1948567947976605699';"
```

Expected output for step 5: `has_token: true`
