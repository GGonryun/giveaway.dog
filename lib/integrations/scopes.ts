import z from 'zod';
import { AuthProvider } from './schemas/providers';
import { widetype } from '../widetype';

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

export function getScopesForTwitterFeatures(
  features: TwitterFeatureSchema[]
): string[] {
  const scopesSet = new Set<string>();

  const allFeatures: TwitterFeatureSchema[] = ['GET_PROFILE', ...features];

  for (const feature of allFeatures) {
    const scopes = TWITTER_SCOPE_GROUPS[feature];
    for (const scope of scopes) {
      scopesSet.add(scope);
    }
  }

  return Array.from(scopesSet);
}

export const TWITTER_FEATURE_LABEL: Record<TwitterFeatureSchema, string> = {
  GET_PROFILE: 'Basic profile access',
  IMPORT_TASKS: 'Import tasks from Twitter',
  POST_TWEETS: 'Post to Twitter on my behalf'
};

export const TWITTER_FEATURE_DESCRIPTION: Record<TwitterFeatureSchema, string> =
  {
    GET_PROFILE: 'Allows the app to access your basic profile information.',
    IMPORT_TASKS: 'Allows the app to import your tasks from Twitter.',
    POST_TWEETS: 'Allows the app to post tweets on your behalf.'
  };

export const TWITTER_FEATURE_REQUIREMENTS: Record<
  TwitterFeatureSchema,
  boolean
> = {
  GET_PROFILE: true,
  IMPORT_TASKS: false,
  POST_TWEETS: false
};

export const TWITTER_FEATURE_OPTION: Record<TwitterFeatureSchema, boolean> = {
  GET_PROFILE: true,
  IMPORT_TASKS: true,
  POST_TWEETS: true
};

export const twitterFeatures = (currentFeatures: TwitterFeatureSchema[]) =>
  widetype
    .entries(TWITTER_FEATURE_OPTION)
    .filter(([_, value]) => value)
    .map(([key]) => ({
      id: key,
      label: TWITTER_FEATURE_LABEL[key],
      description: TWITTER_FEATURE_DESCRIPTION[key],
      required: TWITTER_FEATURE_REQUIREMENTS[key],
      alreadyGranted: currentFeatures.includes(key)
    }));

export const REQUIRED_TWITCH_SCOPES = [
  'openid',
  'user:read:email',
  'user:read:follows'
];

export const REQUIRED_KICK_SCOPES = ['user:read'];

export const REQUIRED_VELORA_SCOPES = ['user:read'];

export const REQUIRED_FACEBOOK_SCOPES = ['email', 'user_link'];

export const REQUIRED_TIKTOK_SCOPES = ['user.info.basic'];

export const REQUIRED_BLUESKY_SCOPES = ['atproto', 'transition:generic'];

export const blueskyFeatureSchema = z.literal('FULL_ACCESS');

export type BlueskyFeatureSchema = z.infer<typeof blueskyFeatureSchema>;

export const BLUESKY_SCOPE_GROUPS: Record<BlueskyFeatureSchema, string[]> = {
  FULL_ACCESS: ['atproto', 'transition:generic']
};

export function getScopesForBlueskyFeatures(
  features: BlueskyFeatureSchema[]
): string[] {
  const scopesSet = new Set<string>();

  const allFeatures: BlueskyFeatureSchema[] = ['FULL_ACCESS', ...features];

  for (const feature of allFeatures) {
    const scopes = BLUESKY_SCOPE_GROUPS[feature];
    for (const scope of scopes) {
      scopesSet.add(scope);
    }
  }

  return Array.from(scopesSet);
}

export const toBlueskyScope = (features: BlueskyFeatureSchema[]): string => {
  return getScopesForBlueskyFeatures(features).join(' ');
};

export const BLUESKY_FEATURE_LABEL: Record<BlueskyFeatureSchema, string> = {
  FULL_ACCESS: 'Full access to Bluesky'
};

export const BLUESKY_FEATURE_DESCRIPTION: Record<BlueskyFeatureSchema, string> =
  {
    FULL_ACCESS:
      'Allows the app to access your profile, import tasks, and post on your behalf.'
  };

export const BLUESKY_FEATURE_REQUIREMENTS: Record<
  BlueskyFeatureSchema,
  boolean
> = {
  FULL_ACCESS: true
};

export const BLUESKY_FEATURE_OPTION: Record<BlueskyFeatureSchema, boolean> = {
  FULL_ACCESS: true
};

export const blueskyFeatures: (
  currentFeatures: BlueskyFeatureSchema[]
) => IntegrationFeatureConfig[] = (currentFeatures) =>
  widetype
    .entries(BLUESKY_FEATURE_OPTION)
    .filter(([_, value]) => value)
    .map(([key]) => ({
      id: key,
      label: BLUESKY_FEATURE_LABEL[key],
      description: BLUESKY_FEATURE_DESCRIPTION[key],
      required: BLUESKY_FEATURE_REQUIREMENTS[key],
      alreadyGranted: currentFeatures.includes(key)
    }));

export type IntegrationFeatureConfig = {
  id: string;
  label: string;
  description: string;
  required?: boolean;
  alreadyGranted?: boolean;
};

export const VERIFIED_EMAIL_PROVIDERS: Record<AuthProvider, boolean> = {
  google: true,
  discord: true,
  twitter: false,
  facebook: false,
  twitch: false,
  instagram: false,
  email: true,
  bluesky: false,
  steam: false,
  kick: false,
  tiktok: false,
  youtube: false,
  velora: false,
  anonymous: false
};
