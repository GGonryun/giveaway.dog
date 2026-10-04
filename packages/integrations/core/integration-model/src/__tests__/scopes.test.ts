import { describe, it, expect, afterEach } from 'vitest';
import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_STEAM_SCOPES,
  REQUIRED_GMAIL_SCOPES,
  REQUIRED_TWITTER_SCOPES,
  REQUIRED_TWITCH_SCOPES,
  REQUIRED_KICK_SCOPES,
  REQUIRED_VELORA_SCOPES,
  REQUIRED_LINKEDIN_SCOPES,
  REQUIRED_TIKTOK_SCOPES,
  REQUIRED_BLUESKY_SCOPES,
  twitterFeatureSchema,
  TWITTER_SCOPE_GROUPS,
  getScopesForTwitterFeatures,
  TWITTER_FEATURE_LABEL,
  TWITTER_FEATURE_DESCRIPTION,
  TWITTER_FEATURE_REQUIREMENTS,
  TWITTER_FEATURE_OPTION,
  twitterFeatures,
  twitchFeatureSchema,
  TWITCH_SCOPE_GROUPS,
  getScopesForTwitchFeatures,
  TWITCH_FEATURE_EVENTSUB,
  TWITCH_FEATURE_LABEL,
  TWITCH_FEATURE_DESCRIPTION,
  TWITCH_FEATURE_REQUIREMENTS,
  TWITCH_FEATURE_OPTION,
  twitchFeatures,
  getEventSubTypesForTwitchFeatures,
  blueskyFeatureSchema,
  BLUESKY_SCOPE_GROUPS,
  getScopesForBlueskyFeatures,
  toBlueskyScope,
  BLUESKY_FEATURE_LABEL,
  BLUESKY_FEATURE_DESCRIPTION,
  BLUESKY_FEATURE_REQUIREMENTS,
  BLUESKY_FEATURE_OPTION,
  blueskyFeatures,
  VERIFIED_EMAIL_PROVIDERS,
  type TwitterFeatureSchema,
  type TwitchFeatureSchema,
  type BlueskyFeatureSchema
} from '../scopes';
import { authProviderSchema } from '../providers';

const CHAT_COMMANDS_EVENTSUB = {
  type: 'channel.chat.message',
  version: '1',
  requiresBot: true
};

const CHANNEL_REDEMPTIONS_EVENTSUB = {
  type: 'channel.channel_points_custom_reward_redemption.add',
  version: '1',
  requiresBot: false
};

describe('required provider scopes', () => {
  it.each([
    [
      'discord',
      REQUIRED_DISCORD_SCOPES,
      ['identify', 'email', 'guilds', 'guilds.members.read']
    ],
    ['steam', REQUIRED_STEAM_SCOPES, []],
    [
      'gmail',
      REQUIRED_GMAIL_SCOPES,
      [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    ],
    [
      'twitter',
      REQUIRED_TWITTER_SCOPES,
      ['users.read', 'tweet.read', 'offline.access']
    ],
    [
      'twitch',
      REQUIRED_TWITCH_SCOPES,
      ['openid', 'user:read:email', 'user:read:follows']
    ],
    ['kick', REQUIRED_KICK_SCOPES, ['user:read']],
    ['velora', REQUIRED_VELORA_SCOPES, ['user:read']],
    [
      'linkedin',
      REQUIRED_LINKEDIN_SCOPES,
      ['openid', 'profile', 'email', 'r_profile_basicinfo']
    ],
    ['tiktok', REQUIRED_TIKTOK_SCOPES, ['user.info.basic']],
    ['bluesky', REQUIRED_BLUESKY_SCOPES, ['atproto', 'transition:generic']]
  ])('requires the expected %s scopes', (_name, actual, expected) => {
    expect(actual).toEqual(expected);
  });
});

describe('twitter features', () => {
  afterEach(() => {
    TWITTER_FEATURE_OPTION.GET_PROFILE = true;
    TWITTER_FEATURE_OPTION.IMPORT_TASKS = true;
    TWITTER_FEATURE_OPTION.POST_TWEETS = true;
  });

  describe('twitterFeatureSchema', () => {
    it.each(['GET_PROFILE', 'IMPORT_TASKS', 'POST_TWEETS'])(
      'accepts the %s feature',
      (feature) => {
        expect(twitterFeatureSchema.parse(feature)).toBe(feature);
      }
    );

    it.each(['get_profile', 'FULL_ACCESS', '', null, 1])(
      'rejects %j',
      (value) => {
        expect(twitterFeatureSchema.safeParse(value).success).toBe(false);
      }
    );
  });

  describe('TWITTER_SCOPE_GROUPS', () => {
    it('maps each feature to its oauth scopes', () => {
      expect(TWITTER_SCOPE_GROUPS).toEqual({
        GET_PROFILE: ['tweet.read', 'users.read', 'offline.access'],
        IMPORT_TASKS: ['follows.read', 'like.read'],
        POST_TWEETS: ['tweet.write', 'media.write']
      });
    });

    it('covers the same scopes for GET_PROFILE as the required twitter scopes', () => {
      expect([...TWITTER_SCOPE_GROUPS.GET_PROFILE].sort()).toEqual(
        [...REQUIRED_TWITTER_SCOPES].sort()
      );
    });
  });

  describe('getScopesForTwitterFeatures', () => {
    it('always includes the profile scopes when no features are requested', () => {
      expect(getScopesForTwitterFeatures([])).toEqual([
        'tweet.read',
        'users.read',
        'offline.access'
      ]);
    });

    it('appends the scopes of each requested feature after the profile scopes', () => {
      expect(
        getScopesForTwitterFeatures(['IMPORT_TASKS', 'POST_TWEETS'])
      ).toEqual([
        'tweet.read',
        'users.read',
        'offline.access',
        'follows.read',
        'like.read',
        'tweet.write',
        'media.write'
      ]);
    });

    it('de-duplicates scopes when GET_PROFILE is requested explicitly', () => {
      expect(getScopesForTwitterFeatures(['GET_PROFILE'])).toEqual([
        'tweet.read',
        'users.read',
        'offline.access'
      ]);
    });

    it('de-duplicates scopes when a feature is requested twice', () => {
      expect(
        getScopesForTwitterFeatures(['POST_TWEETS', 'POST_TWEETS'])
      ).toEqual([
        'tweet.read',
        'users.read',
        'offline.access',
        'tweet.write',
        'media.write'
      ]);
    });

    it('throws a TypeError for an unknown feature', () => {
      expect(() =>
        getScopesForTwitterFeatures([
          'UNKNOWN' as unknown as TwitterFeatureSchema
        ])
      ).toThrow(TypeError);
    });
  });

  describe('feature metadata', () => {
    it('labels each feature', () => {
      expect(TWITTER_FEATURE_LABEL).toEqual({
        GET_PROFILE: 'Basic profile access',
        IMPORT_TASKS: 'Import tasks from Twitter',
        POST_TWEETS: 'Post to Twitter on my behalf'
      });
    });

    it('describes each feature', () => {
      expect(TWITTER_FEATURE_DESCRIPTION).toEqual({
        GET_PROFILE: 'Allows the app to access your basic profile information.',
        IMPORT_TASKS: 'Allows the app to import your tasks from Twitter.',
        POST_TWEETS: 'Allows the app to post tweets on your behalf.'
      });
    });

    it('only requires the profile feature', () => {
      expect(TWITTER_FEATURE_REQUIREMENTS).toEqual({
        GET_PROFILE: true,
        IMPORT_TASKS: false,
        POST_TWEETS: false
      });
    });

    it('offers every feature as an option', () => {
      expect(TWITTER_FEATURE_OPTION).toEqual({
        GET_PROFILE: true,
        IMPORT_TASKS: true,
        POST_TWEETS: true
      });
    });
  });

  describe('twitterFeatures', () => {
    it('lists every offered feature with nothing granted', () => {
      expect(twitterFeatures([])).toEqual([
        {
          id: 'GET_PROFILE',
          label: 'Basic profile access',
          description:
            'Allows the app to access your basic profile information.',
          required: true,
          alreadyGranted: false
        },
        {
          id: 'IMPORT_TASKS',
          label: 'Import tasks from Twitter',
          description: 'Allows the app to import your tasks from Twitter.',
          required: false,
          alreadyGranted: false
        },
        {
          id: 'POST_TWEETS',
          label: 'Post to Twitter on my behalf',
          description: 'Allows the app to post tweets on your behalf.',
          required: false,
          alreadyGranted: false
        }
      ]);
    });

    it('marks the currently granted features as already granted', () => {
      const result = twitterFeatures(['GET_PROFILE', 'POST_TWEETS']);

      expect(
        result.map(({ id, alreadyGranted }) => [id, alreadyGranted])
      ).toEqual([
        ['GET_PROFILE', true],
        ['IMPORT_TASKS', false],
        ['POST_TWEETS', true]
      ]);
    });

    it('omits features whose option flag is disabled', () => {
      TWITTER_FEATURE_OPTION.IMPORT_TASKS = false;

      expect(twitterFeatures([]).map(({ id }) => id)).toEqual([
        'GET_PROFILE',
        'POST_TWEETS'
      ]);
    });
  });
});

describe('twitch features', () => {
  afterEach(() => {
    TWITCH_FEATURE_OPTION.USER_PROFILE = true;
    TWITCH_FEATURE_OPTION.MODERATION_READ = true;
    TWITCH_FEATURE_OPTION.CHAT_COMMANDS = true;
    TWITCH_FEATURE_OPTION.CHANNEL_REDEMPTIONS = true;
  });

  describe('twitchFeatureSchema', () => {
    it.each([
      'USER_PROFILE',
      'MODERATION_READ',
      'CHAT_COMMANDS',
      'CHANNEL_REDEMPTIONS'
    ])('accepts the %s feature', (feature) => {
      expect(twitchFeatureSchema.parse(feature)).toBe(feature);
    });

    it.each(['user_profile', 'GET_PROFILE', undefined])(
      'rejects %j',
      (value) => {
        expect(twitchFeatureSchema.safeParse(value).success).toBe(false);
      }
    );
  });

  describe('TWITCH_SCOPE_GROUPS', () => {
    it('maps each feature to its oauth scopes', () => {
      expect(TWITCH_SCOPE_GROUPS).toEqual({
        USER_PROFILE: ['user:read:email'],
        MODERATION_READ: ['moderation:read'],
        CHAT_COMMANDS: [],
        CHANNEL_REDEMPTIONS: ['channel:read:redemptions']
      });
    });
  });

  describe('getScopesForTwitchFeatures', () => {
    it('returns no scopes when no features are requested', () => {
      expect(getScopesForTwitchFeatures([])).toEqual([]);
    });

    it('returns no scopes for the chat commands feature', () => {
      expect(getScopesForTwitchFeatures(['CHAT_COMMANDS'])).toEqual([]);
    });

    it('collects the scopes of every requested feature in order', () => {
      expect(
        getScopesForTwitchFeatures([
          'CHANNEL_REDEMPTIONS',
          'USER_PROFILE',
          'MODERATION_READ'
        ])
      ).toEqual([
        'channel:read:redemptions',
        'user:read:email',
        'moderation:read'
      ]);
    });

    it('de-duplicates repeated features', () => {
      expect(
        getScopesForTwitchFeatures(['USER_PROFILE', 'USER_PROFILE'])
      ).toEqual(['user:read:email']);
    });

    it('throws a TypeError for an unknown feature', () => {
      expect(() =>
        getScopesForTwitchFeatures([
          'UNKNOWN' as unknown as TwitchFeatureSchema
        ])
      ).toThrow(TypeError);
    });
  });

  describe('TWITCH_FEATURE_EVENTSUB', () => {
    it('only subscribes to eventsub topics for chat commands and redemptions', () => {
      expect(TWITCH_FEATURE_EVENTSUB).toEqual({
        USER_PROFILE: null,
        MODERATION_READ: null,
        CHAT_COMMANDS: CHAT_COMMANDS_EVENTSUB,
        CHANNEL_REDEMPTIONS: CHANNEL_REDEMPTIONS_EVENTSUB
      });
    });
  });

  describe('feature metadata', () => {
    it('labels each feature', () => {
      expect(TWITCH_FEATURE_LABEL).toEqual({
        USER_PROFILE: 'User Profile',
        MODERATION_READ: 'Moderation Access',
        CHAT_COMMANDS: 'Chat Commands',
        CHANNEL_REDEMPTIONS: 'Channel Point Redemptions'
      });
    });

    it('describes each feature', () => {
      expect(TWITCH_FEATURE_DESCRIPTION).toEqual({
        USER_PROFILE: 'Access your basic profile information and email.',
        MODERATION_READ: 'Read moderation data and bot status.',
        CHAT_COMMANDS:
          'Allow viewers to enter giveaways by typing a command in chat.',
        CHANNEL_REDEMPTIONS:
          'Allow viewers to enter giveaways by redeeming channel points.'
      });
    });

    it('requires every feature except channel redemptions', () => {
      expect(TWITCH_FEATURE_REQUIREMENTS).toEqual({
        USER_PROFILE: true,
        MODERATION_READ: true,
        CHAT_COMMANDS: true,
        CHANNEL_REDEMPTIONS: false
      });
    });

    it('offers every feature as an option', () => {
      expect(TWITCH_FEATURE_OPTION).toEqual({
        USER_PROFILE: true,
        MODERATION_READ: true,
        CHAT_COMMANDS: true,
        CHANNEL_REDEMPTIONS: true
      });
    });
  });

  describe('twitchFeatures', () => {
    it('lists every offered feature with its metadata', () => {
      expect(twitchFeatures(['CHAT_COMMANDS'])).toEqual([
        {
          id: 'USER_PROFILE',
          label: 'User Profile',
          description: 'Access your basic profile information and email.',
          required: true,
          alreadyGranted: false
        },
        {
          id: 'MODERATION_READ',
          label: 'Moderation Access',
          description: 'Read moderation data and bot status.',
          required: true,
          alreadyGranted: false
        },
        {
          id: 'CHAT_COMMANDS',
          label: 'Chat Commands',
          description:
            'Allow viewers to enter giveaways by typing a command in chat.',
          required: true,
          alreadyGranted: true
        },
        {
          id: 'CHANNEL_REDEMPTIONS',
          label: 'Channel Point Redemptions',
          description:
            'Allow viewers to enter giveaways by redeeming channel points.',
          required: false,
          alreadyGranted: false
        }
      ]);
    });

    it('omits features whose option flag is disabled', () => {
      TWITCH_FEATURE_OPTION.MODERATION_READ = false;
      TWITCH_FEATURE_OPTION.CHANNEL_REDEMPTIONS = false;

      expect(twitchFeatures([]).map(({ id }) => id)).toEqual([
        'USER_PROFILE',
        'CHAT_COMMANDS'
      ]);
    });
  });

  describe('getEventSubTypesForTwitchFeatures', () => {
    it('always subscribes to chat messages even when no features are requested', () => {
      expect(getEventSubTypesForTwitchFeatures([])).toEqual([
        CHAT_COMMANDS_EVENTSUB
      ]);
    });

    it('skips features that have no eventsub topic', () => {
      expect(
        getEventSubTypesForTwitchFeatures(['USER_PROFILE', 'MODERATION_READ'])
      ).toEqual([CHAT_COMMANDS_EVENTSUB]);
    });

    it('adds the redemption topic after the chat topic', () => {
      expect(
        getEventSubTypesForTwitchFeatures(['CHANNEL_REDEMPTIONS'])
      ).toEqual([CHAT_COMMANDS_EVENTSUB, CHANNEL_REDEMPTIONS_EVENTSUB]);
    });

    it('does not duplicate the chat topic when chat commands are requested', () => {
      expect(
        getEventSubTypesForTwitchFeatures([
          'CHANNEL_REDEMPTIONS',
          'CHAT_COMMANDS',
          'CHANNEL_REDEMPTIONS'
        ])
      ).toEqual([CHAT_COMMANDS_EVENTSUB, CHANNEL_REDEMPTIONS_EVENTSUB]);
    });

    it('keeps an undefined entry for unknown features because only null topics are filtered', () => {
      expect(
        getEventSubTypesForTwitchFeatures([
          'UNKNOWN' as unknown as TwitchFeatureSchema
        ])
      ).toEqual([CHAT_COMMANDS_EVENTSUB, undefined]);
    });
  });
});

describe('bluesky features', () => {
  afterEach(() => {
    BLUESKY_FEATURE_OPTION.FULL_ACCESS = true;
  });

  describe('blueskyFeatureSchema', () => {
    it('accepts FULL_ACCESS', () => {
      expect(blueskyFeatureSchema.parse('FULL_ACCESS')).toBe('FULL_ACCESS');
    });

    it('rejects any other feature', () => {
      expect(blueskyFeatureSchema.safeParse('GET_PROFILE').success).toBe(false);
    });
  });

  describe('BLUESKY_SCOPE_GROUPS', () => {
    it('maps full access to the atproto scopes', () => {
      expect(BLUESKY_SCOPE_GROUPS).toEqual({
        FULL_ACCESS: ['atproto', 'transition:generic']
      });
    });
  });

  describe('getScopesForBlueskyFeatures', () => {
    it('always includes the full access scopes', () => {
      expect(getScopesForBlueskyFeatures([])).toEqual([
        'atproto',
        'transition:generic'
      ]);
    });

    it('de-duplicates scopes when full access is requested explicitly', () => {
      expect(getScopesForBlueskyFeatures(['FULL_ACCESS'])).toEqual([
        'atproto',
        'transition:generic'
      ]);
    });

    it('throws a TypeError for an unknown feature', () => {
      expect(() =>
        getScopesForBlueskyFeatures([
          'UNKNOWN' as unknown as BlueskyFeatureSchema
        ])
      ).toThrow(TypeError);
    });
  });

  describe('toBlueskyScope', () => {
    it('joins the scopes with spaces', () => {
      expect(toBlueskyScope([])).toBe('atproto transition:generic');
    });

    it('returns the same scope string when full access is requested', () => {
      expect(toBlueskyScope(['FULL_ACCESS'])).toBe(
        'atproto transition:generic'
      );
    });
  });

  describe('feature metadata', () => {
    it('labels, describes, requires and offers full access', () => {
      expect({
        label: BLUESKY_FEATURE_LABEL,
        description: BLUESKY_FEATURE_DESCRIPTION,
        required: BLUESKY_FEATURE_REQUIREMENTS,
        option: BLUESKY_FEATURE_OPTION
      }).toEqual({
        label: { FULL_ACCESS: 'Full access to Bluesky' },
        description: {
          FULL_ACCESS:
            'Allows the app to access your profile, import tasks, and post on your behalf.'
        },
        required: { FULL_ACCESS: true },
        option: { FULL_ACCESS: true }
      });
    });
  });

  describe('blueskyFeatures', () => {
    it('lists full access as not granted when nothing is granted', () => {
      expect(blueskyFeatures([])).toEqual([
        {
          id: 'FULL_ACCESS',
          label: 'Full access to Bluesky',
          description:
            'Allows the app to access your profile, import tasks, and post on your behalf.',
          required: true,
          alreadyGranted: false
        }
      ]);
    });

    it('marks full access as granted when it is current', () => {
      expect(blueskyFeatures(['FULL_ACCESS'])[0].alreadyGranted).toBe(true);
    });

    it('returns an empty list when full access is not offered', () => {
      BLUESKY_FEATURE_OPTION.FULL_ACCESS = false;

      expect(blueskyFeatures([])).toEqual([]);
    });
  });
});

describe('VERIFIED_EMAIL_PROVIDERS', () => {
  it('has an entry for every auth provider', () => {
    expect(Object.keys(VERIFIED_EMAIL_PROVIDERS).sort()).toEqual(
      authProviderSchema.options.map((option) => option.value).sort()
    );
  });

  it('only trusts emails from google, discord, email and linkedin', () => {
    const verified = Object.entries(VERIFIED_EMAIL_PROVIDERS)
      .filter(([, isVerified]) => isVerified)
      .map(([provider]) => provider);

    expect(verified).toEqual(['google', 'discord', 'email', 'linkedin']);
  });
});
