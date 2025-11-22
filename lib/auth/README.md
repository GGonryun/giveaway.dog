### Auto-Merge Behavior for Imported Twitter Users:

When a Twitter user who was previously imported (via Twitter likes sync)
signs in for the first time:

1. The Account table's composite key [provider, providerAccountId] ensures
   the imported Twitter account is unique and cannot be duplicated.
2. NextAuth's PrismaAdapter automatically signs the user into their
   existing account (the imported one) rather than creating a new user.
3. The imported user's source field remains "TWITTER_IMPORT", but they
   now have full account access (tokens, sessions, etc.).
4. All their previously imported TaskCompletions remain linked to their
   userId, so their sweepstakes entries are preserved.
5. If they try to sign in with a different provider (Google/Discord)
   that has the same email, NextAuth will link that provider to the
   existing user account (auto-linking enabled for Twitter/Google/Discord).
   Note: To prevent account conflicts, we do NOT create email addresses
   for imported Twitter users (email is set to null). This prevents
   accidental merges with users who sign up via email providers.
