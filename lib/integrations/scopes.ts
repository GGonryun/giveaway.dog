import z from 'zod';

export const REQUIRED_DISCORD_SCOPES = [
  'identify',
  'email',
  'guilds',
  'guilds.members.read'
];
export const REQUIRED_STEAM_SCOPES = [];
export const REQUIRED_GMAIL_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];
export const REQUIRED_TWITTER_SCOPES = [
  'users.read',
  'tweet.read',
  'offline.access'
];

export const twitterFeatureSchema = z.union([
  z.literal('GET_PROFILE'),
  z.literal('IMPORT_TASKS'),
  z.literal('POST_TWEETS')
]);

export type TwitterFeatureSchema = z.infer<typeof twitterFeatureSchema>;

export const TWITTER_SCOPE_GROUPS: Record<TwitterFeatureSchema, string[]> = {
  GET_PROFILE: ['tweet.read', 'users.read', 'offline.access'],
  IMPORT_TASKS: ['follows.read', 'like.read'],
  POST_TWEETS: ['tweet.write', 'media.write']
};

export function getScopesForFeatures(
  features: TwitterFeatureSchema[]
): string[] {
  const scopesSet = new Set<string>();

  // Always include GET_PROFILE as it's mandatory
  const allFeatures = ['GET_PROFILE' as TwitterFeatureSchema, ...features];

  for (const feature of allFeatures) {
    const scopes = TWITTER_SCOPE_GROUPS[feature];
    for (const scope of scopes) {
      scopesSet.add(scope);
    }
  }

  return Array.from(scopesSet);
}

export const REQUIRED_TWITCH_SCOPES = [
  'openid',
  'user:read:email',
  'user:read:follows'
];

export const REQUIRED_KICK_SCOPES = ['user:read'];

export const REQUIRED_FACEBOOK_SCOPES = ['email', 'user_link'];

export const REQUIRED_TIKTOK_SCOPES = ['user.info.basic'];

export const REQUIRED_BLUESKY_SCOPES = ['atproto', 'transition:generic'];
