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

export const twitchFeatureSchema = z.union([
  z.literal('USER_PROFILE'),
  z.literal('MODERATION_READ'),
  z.literal('CHAT_COMMANDS'),
  z.literal('CHANNEL_REDEMPTIONS')
]);

export type TwitchFeatureSchema = z.infer<typeof twitchFeatureSchema>;

export const TWITCH_SCOPE_GROUPS: Record<TwitchFeatureSchema, string[]> = {
  USER_PROFILE: ['user:read:email'],
  MODERATION_READ: ['moderation:read'],
  CHAT_COMMANDS: [],
  CHANNEL_REDEMPTIONS: ['channel:read:redemptions']
};

export function getScopesForTwitchFeatures(
  features: TwitchFeatureSchema[]
): string[] {
  const scopesSet = new Set<string>();

  for (const feature of features) {
    const scopes = TWITCH_SCOPE_GROUPS[feature];
    for (const scope of scopes) {
      scopesSet.add(scope);
    }
  }

  return Array.from(scopesSet);
}

export const TWITCH_FEATURE_EVENTSUB: Record<
  TwitchFeatureSchema,
  { type: string; version: string; requiresBot: boolean } | null
> = {
  USER_PROFILE: null,
  MODERATION_READ: null,
  CHAT_COMMANDS: {
    type: 'channel.chat.message',
    version: '1',
    requiresBot: true
  },
  CHANNEL_REDEMPTIONS: {
    type: 'channel.channel_points_custom_reward_redemption.add',
    version: '1',
    requiresBot: false
  }
};

export const TWITCH_FEATURE_LABEL: Record<TwitchFeatureSchema, string> = {
  USER_PROFILE: 'User Profile',
  MODERATION_READ: 'Moderation Access',
  CHAT_COMMANDS: 'Chat Commands',
  CHANNEL_REDEMPTIONS: 'Channel Point Redemptions'
};

export const TWITCH_FEATURE_DESCRIPTION: Record<TwitchFeatureSchema, string> = {
  USER_PROFILE: 'Access your basic profile information and email.',
  MODERATION_READ: 'Read moderation data and bot status.',
  CHAT_COMMANDS:
    'Allow viewers to enter giveaways by typing a command in chat.',
  CHANNEL_REDEMPTIONS:
    'Allow viewers to enter giveaways by redeeming channel points.'
};

export const TWITCH_FEATURE_REQUIREMENTS: Record<TwitchFeatureSchema, boolean> =
  {
    USER_PROFILE: true,
    MODERATION_READ: true,
    CHAT_COMMANDS: true,
    CHANNEL_REDEMPTIONS: false
  };

export const TWITCH_FEATURE_OPTION: Record<TwitchFeatureSchema, boolean> = {
  USER_PROFILE: true,
  MODERATION_READ: true,
  CHAT_COMMANDS: true,
  CHANNEL_REDEMPTIONS: true
};

export const twitchFeatures = (
  currentFeatures: TwitchFeatureSchema[]
): IntegrationFeatureConfig[] =>
  widetype
    .entries(TWITCH_FEATURE_OPTION)
    .filter(([_, value]) => value)
    .map(([key]) => ({
      id: key,
      label: TWITCH_FEATURE_LABEL[key],
      description: TWITCH_FEATURE_DESCRIPTION[key],
      required: TWITCH_FEATURE_REQUIREMENTS[key],
      alreadyGranted: currentFeatures.includes(key)
    }));

export function getEventSubTypesForTwitchFeatures(
  features: TwitchFeatureSchema[]
): Array<{ type: string; version: string; requiresBot: boolean }> {
  const allFeatures: TwitchFeatureSchema[] = ['CHAT_COMMANDS', ...features];
  const uniqueFeatures = Array.from(new Set(allFeatures));

  return uniqueFeatures
    .map((feature) => TWITCH_FEATURE_EVENTSUB[feature])
    .filter(
      (
        eventsub
      ): eventsub is { type: string; version: string; requiresBot: boolean } =>
        eventsub !== null
    );
}

export const REQUIRED_KICK_SCOPES = ['user:read'];

export const REQUIRED_VELORA_SCOPES = ['user:read'];

export const REQUIRED_FACEBOOK_SCOPES = ['email', 'user_link'];

export const REQUIRED_LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'r_profile_basicinfo'];

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
  linkedin: true,
  anonymous: false
};
