import { describe, it, expect } from 'vitest';
import { getVerificationInstructions } from '../instructions';
import type { TaskSchema, TaskType } from '../../schemas';
import type { ProviderSchema } from '@giveaway/integration-model/providers';
import {
  ALL_TASK_TYPES,
  taskOf
} from '../../testing/fixtures-task-procedures-verification';

type InstructionUser = Parameters<
  typeof getVerificationInstructions
>[0]['user'];

const provider = (
  type: ProviderSchema['type'],
  overrides: Partial<ProviderSchema> = {}
): ProviderSchema => ({
  type,
  scopes: [],
  label: 'alex_handle',
  link: 'https://example.com/alex',
  status: 'ACTIVE',
  ...overrides
});

const user = (
  providers: ProviderSchema[] = [],
  name: string | null = 'Alex'
): InstructionUser => ({ name, providers });

const instructionsFor = (
  type: TaskType,
  providers: ProviderSchema[] = [],
  name: string | null = 'Alex'
) => {
  const result = getVerificationInstructions({
    task: taskOf(type),
    user: user(providers, name)
  });
  if (!result) {
    throw new Error(`Expected instructions for ${type}`);
  }
  return result;
};

const stepOf = (
  type: TaskType,
  step: number,
  providers: ProviderSchema[] = []
) => instructionsFor(type, providers).steps[step - 1];

const TWITTER_IMPORT_DESCRIPTION =
  'This task is automatically verified via Twitter/X import';
const BLUESKY_IMPORT_DESCRIPTION =
  'This task is automatically verified via Bluesky import';
const BLUESKY_API_DESCRIPTION =
  'This task is automatically verified via Bluesky API';
const VELORA_API_DESCRIPTION =
  'This task is automatically verified via Velora API';
const SECRET_CODE_DESCRIPTION =
  'This task is automatically verified when user enters the code';
const BONUS_DESCRIPTION = 'Review the bonus task completed by Alex';
const QUIZ_DESCRIPTION = 'Review the answer submitted by Alex';

const EXPECTED: [TaskType, string, string][] = [
  [
    'INSTAGRAM_VISIT',
    'Verify Instagram Visit',
    'Check if Alex visited your Instagram profile'
  ],
  [
    'INSTAGRAM_LIKE',
    'Verify Instagram Like',
    'Check if Alex liked your Instagram post'
  ],
  [
    'INSTAGRAM_COMMENT',
    'Verify Instagram Comment',
    'Check if Alex commented on your Instagram post'
  ],
  [
    'FACEBOOK_VISIT_PAGE',
    'Verify Facebook Page Visit',
    'Check if Alex visited your Facebook page'
  ],
  [
    'FACEBOOK_VIEW_POST',
    'Verify Facebook Post View',
    'Check if Alex viewed your Facebook post'
  ],
  [
    'TIKTOK_FOLLOW',
    'Verify TikTok Follow',
    'Check if Alex followed your TikTok account'
  ],
  [
    'TIKTOK_LIKE',
    'Verify TikTok Like',
    'Check if Alex liked your TikTok video'
  ],
  [
    'TWITTER_FOLLOW',
    'Verify Twitter/X Follow',
    'Check if Alex followed your Twitter/X account'
  ],
  [
    'TWITTER_RETWEET',
    'Verify Twitter/X Retweet',
    'Check if Alex retweeted your post'
  ],
  ['TWITTER_LIKE', 'Verify Twitter/X Like', 'Check if Alex liked your post'],
  [
    'YOUTUBE_VISIT',
    'Verify YouTube Visit',
    'Check if Alex visited your YouTube channel or video'
  ],
  ['VISIT_URL', 'Verify URL Visit', 'Check if Alex visited the specified URL'],
  ['ASK_QUESTION', 'Review Question Answer', QUIZ_DESCRIPTION],
  ['SINGLE_CHOICE', 'Review Quiz Answer', QUIZ_DESCRIPTION],
  ['MULTIPLE_CHOICE', 'Review Quiz Answer', QUIZ_DESCRIPTION],
  [
    'SUBMIT_MEDIA',
    'Review Submitted Media',
    'Review the media submitted by Alex'
  ],
  [
    'REFERRAL_LINK',
    'Verify Referral',
    'Check if Alex completed the referral task'
  ],
  ['BONUS_TASK', 'Review Bonus Task', BONUS_DESCRIPTION],
  ['BONUS_TIMED', 'Review Bonus Task', BONUS_DESCRIPTION],
  ['BONUS_LIMITED', 'Review Bonus Task', BONUS_DESCRIPTION],
  ['BONUS_LOYALTY', 'Review Bonus Task', BONUS_DESCRIPTION],
  ['BONUS_COMPLETE_PROFILE', 'Review Bonus Task', BONUS_DESCRIPTION],
  [
    'STEAM_FOLLOW',
    'Verify Steam Follow (Self-Reported)',
    'Review the proof submitted by Alex'
  ],
  [
    'TWITTER_CONNECT',
    'Verify Twitter/X Connection',
    'Check if Alex connected their Twitter/X account'
  ],
  [
    'KICK_FOLLOW',
    'Verify Kick Follow',
    'Check if Alex followed your Kick channel'
  ],
  [
    'TWITTER_RETWEET_IMPORT',
    'Verify Twitter/X Retweet (Import)',
    TWITTER_IMPORT_DESCRIPTION
  ],
  [
    'TWITTER_RETWEET_IMPORT_V2',
    'Verify Twitter/X Retweet (Import)',
    TWITTER_IMPORT_DESCRIPTION
  ],
  [
    'TWITTER_LIKE_IMPORT',
    'Verify Twitter/X Like (Import)',
    TWITTER_IMPORT_DESCRIPTION
  ],
  [
    'BLUESKY_LIKE_IMPORT',
    'Verify Bluesky Like (Import)',
    BLUESKY_IMPORT_DESCRIPTION
  ],
  [
    'BLUESKY_REPOST_IMPORT',
    'Verify Bluesky Repost (Import)',
    BLUESKY_IMPORT_DESCRIPTION
  ],
  [
    'STEAM_WISHLIST',
    'Verify Steam Wishlist (Automatic)',
    'This task is automatically verified via Steam API'
  ],
  [
    'DISCORD_JOIN',
    'Verify Discord Join (Automatic)',
    'This task is automatically verified via Discord API'
  ],
  [
    'DISCORD_INTERACTION_IMPORT',
    'Verify Discord Interaction (Automatic)',
    'This task is automatically verified when users interact via Discord'
  ],
  [
    'TWITCH_FOLLOW',
    'Verify Twitch Follow (Automatic)',
    'This task is automatically verified via Twitch API'
  ],
  ['SECRET_CODE', 'Verify Secret Code (Automatic)', SECRET_CODE_DESCRIPTION],
  ['SECRET_CODE_V2', 'Verify Secret Code (Automatic)', SECRET_CODE_DESCRIPTION],
  [
    'BLUESKY_CONNECT',
    'Verify Bluesky Connection (Automatic)',
    BLUESKY_API_DESCRIPTION
  ],
  [
    'BLUESKY_FOLLOW',
    'Verify Bluesky Follow (Automatic)',
    BLUESKY_API_DESCRIPTION
  ],
  ['BLUESKY_LIKE', 'Verify Bluesky Like (Automatic)', BLUESKY_API_DESCRIPTION],
  [
    'BLUESKY_REPOST',
    'Verify Bluesky Repost (Automatic)',
    BLUESKY_API_DESCRIPTION
  ],
  [
    'TWITCH_CHAT_IMPORT',
    'Verify Twitch Chat Command (Automatic)',
    'This task is automatically verified via Twitch Chat'
  ],
  [
    'VELORA_CONNECT',
    'Verify Velora Connection (Automatic)',
    VELORA_API_DESCRIPTION
  ],
  ['VELORA_FOLLOW', 'Verify Velora Follow (Automatic)', VELORA_API_DESCRIPTION],
  [
    'LINKEDIN_CONNECT',
    'Verify LinkedIn Connection (Automatic)',
    'This task is automatically verified via LinkedIn API'
  ],
  [
    'LINKEDIN_FOLLOW',
    'Verify LinkedIn Follow (Manual)',
    'This task requires manual verification'
  ]
];

const STEPS_WITH_NOTES: Record<TaskType, number[]> = {
  INSTAGRAM_VISIT: [1, 2],
  INSTAGRAM_LIKE: [2],
  INSTAGRAM_COMMENT: [2],
  FACEBOOK_VISIT_PAGE: [1, 2],
  FACEBOOK_VIEW_POST: [2],
  TIKTOK_FOLLOW: [2],
  TIKTOK_LIKE: [2],
  TWITTER_FOLLOW: [2],
  TWITTER_RETWEET: [2],
  TWITTER_LIKE: [2],
  YOUTUBE_VISIT: [1, 2],
  VISIT_URL: [1],
  ASK_QUESTION: [],
  SINGLE_CHOICE: [],
  MULTIPLE_CHOICE: [],
  SUBMIT_MEDIA: [2],
  REFERRAL_LINK: [2],
  BONUS_TASK: [],
  BONUS_TIMED: [],
  BONUS_LIMITED: [],
  BONUS_LOYALTY: [],
  BONUS_COMPLETE_PROFILE: [],
  STEAM_FOLLOW: [],
  TWITTER_CONNECT: [2],
  KICK_FOLLOW: [2],
  TWITTER_RETWEET_IMPORT: [1],
  TWITTER_RETWEET_IMPORT_V2: [1],
  TWITTER_LIKE_IMPORT: [1],
  BLUESKY_LIKE_IMPORT: [1],
  BLUESKY_REPOST_IMPORT: [1],
  STEAM_WISHLIST: [1, 2],
  DISCORD_JOIN: [1, 2],
  DISCORD_INTERACTION_IMPORT: [1, 2],
  TWITCH_FOLLOW: [1, 2],
  SECRET_CODE: [1],
  SECRET_CODE_V2: [1],
  BLUESKY_CONNECT: [1],
  BLUESKY_FOLLOW: [1],
  BLUESKY_LIKE: [1],
  BLUESKY_REPOST: [1],
  TWITCH_CHAT_IMPORT: [1],
  VELORA_CONNECT: [1],
  VELORA_FOLLOW: [1],
  LINKEDIN_CONNECT: [1],
  LINKEDIN_FOLLOW: []
};

const BONUS_TYPES: TaskType[] = [
  'BONUS_TASK',
  'BONUS_TIMED',
  'BONUS_LIMITED',
  'BONUS_LOYALTY',
  'BONUS_COMPLETE_PROFILE'
];

describe('getVerificationInstructions', () => {
  describe('titles and descriptions', () => {
    it('defines expectations for every task type', () => {
      expect(EXPECTED.map(([type]) => type).sort()).toEqual(
        ALL_TASK_TYPES.slice().sort()
      );
    });

    it.each(EXPECTED)(
      'describes %s as "%s"',
      (type, expectedTitle, expectedDescription) => {
        const result = instructionsFor(type);

        expect(result.title).toBe(expectedTitle);
        expect(result.description).toBe(expectedDescription);
      }
    );
  });

  describe('steps', () => {
    it.each(BONUS_TYPES)('returns no steps for %s', (type) => {
      expect(instructionsFor(type).steps).toEqual([]);
    });

    it.each(ALL_TASK_TYPES.filter((type) => !BONUS_TYPES.includes(type)))(
      'returns three sequentially numbered steps for %s',
      (type) => {
        const { steps } = instructionsFor(type);

        expect(steps.map((step) => step.step)).toEqual([1, 2, 3]);
        for (const step of steps) {
          expect(step.instruction.length).toBeGreaterThan(0);
        }
      }
    );

    it.each(Object.entries(STEPS_WITH_NOTES) as [TaskType, number[]][])(
      'attaches notes to the expected steps of %s when no provider is connected',
      (type, expectedSteps) => {
        const { steps } = instructionsFor(type);

        expect(
          steps.filter((step) => step.note !== undefined).map((s) => s.step)
        ).toEqual(expectedSteps);
      }
    );

    it('returns the full instruction for a connected instagram visit', () => {
      expect(
        instructionsFor('INSTAGRAM_VISIT', [provider('INSTAGRAM')])
      ).toEqual({
        title: 'Verify Instagram Visit',
        description: 'Check if Alex visited your Instagram profile',
        steps: [
          {
            step: 1,
            instruction:
              'Click the profile link below to open their Instagram profile',
            note: undefined
          },
          {
            step: 2,
            instruction:
              'Check their profile activity or recent interactions with your content',
            note: 'This task is trust-based as Instagram does not provide visit tracking'
          },
          {
            step: 3,
            instruction:
              'If you believe they completed the task, click Approve. Otherwise, click Reject.'
          }
        ]
      });
    });

    it('returns the full instruction for a twitter import task', () => {
      expect(instructionsFor('TWITTER_LIKE_IMPORT').steps).toEqual([
        {
          step: 1,
          instruction: 'This task uses automated import to verify engagement',
          note: 'Import jobs run periodically to check Twitter/X for users who engaged with your post'
        },
        {
          step: 2,
          instruction:
            'Check the proof section to see if import verification has completed'
        },
        {
          step: 3,
          instruction:
            'If import failed or is pending, you can manually verify by checking Twitter/X'
        }
      ]);
    });

    it('returns the full instruction for a bluesky import task', () => {
      expect(instructionsFor('BLUESKY_REPOST_IMPORT').steps).toEqual([
        {
          step: 1,
          instruction: 'This task uses automated import to verify engagement',
          note: 'Import jobs run periodically to check Bluesky for users who engaged with your post'
        },
        {
          step: 2,
          instruction:
            'Check the proof section to see if import verification has completed'
        },
        {
          step: 3,
          instruction:
            'If import failed or is pending, you can manually verify by checking Bluesky'
        }
      ]);
    });

    it('points linkedin follow verification at the configured profile url', () => {
      const result = getVerificationInstructions({
        task: taskOf('LINKEDIN_FOLLOW', 'task-1', {
          profileUrl: 'https://www.linkedin.com/in/someone'
        }),
        user: user()
      });

      expect(result?.steps).toEqual([
        {
          step: 1,
          instruction: 'Ask the user for their LinkedIn profile URL or username'
        },
        {
          step: 2,
          instruction:
            'Check your LinkedIn followers at https://www.linkedin.com/in/someone'
        },
        {
          step: 3,
          instruction: 'Confirm the user appears in your followers list'
        }
      ]);
    });
  });

  describe('user name', () => {
    it.each([
      ['null', null],
      ['empty', '']
    ])('refers to "the user" when the name is %s', (_label, name) => {
      expect(instructionsFor('TWITTER_LIKE', [], name).description).toBe(
        'Check if the user liked your post'
      );
    });

    it('treats missing providers as no connected providers', () => {
      const result = getVerificationInstructions({
        task: taskOf('INSTAGRAM_VISIT'),
        user: { name: 'Alex' } as unknown as InstructionUser
      });

      expect(result?.steps[0]).toEqual({
        step: 1,
        instruction: 'Ask the user for their Instagram username',
        note: 'User has not connected their Instagram profile'
      });
    });
  });

  describe('provider specific steps', () => {
    it('asks for the instagram username when no instagram profile is connected', () => {
      expect(stepOf('INSTAGRAM_VISIT', 1)).toEqual({
        step: 1,
        instruction: 'Ask the user for their Instagram username',
        note: 'User has not connected their Instagram profile'
      });
    });

    it('asks for the instagram username when the connected profile has no link', () => {
      expect(
        stepOf('INSTAGRAM_VISIT', 1, [provider('INSTAGRAM', { link: null })])
      ).toEqual({
        step: 1,
        instruction: 'Ask the user for their Instagram username',
        note: 'User has not connected their Instagram profile'
      });
    });

    it('ignores providers of another platform', () => {
      expect(stepOf('INSTAGRAM_VISIT', 1, [provider('TWITTER')])).toEqual({
        step: 1,
        instruction: 'Ask the user for their Instagram username',
        note: 'User has not connected their Instagram profile'
      });
    });

    it.each([
      [
        'INSTAGRAM_LIKE',
        'INSTAGRAM',
        'Check if alex_handle appears in the likes list',
        'Ask the user for their Instagram username, then check if they appear in the likes list'
      ],
      [
        'INSTAGRAM_COMMENT',
        'INSTAGRAM',
        'Look for comments from @alex_handle',
        'Ask the user for their Instagram username, then look for their comments'
      ],
      [
        'TIKTOK_FOLLOW',
        'TIKTOK',
        'Search for @alex_handle in your followers',
        'Ask the user for their TikTok username, then search for them in your followers'
      ],
      [
        'TIKTOK_LIKE',
        'TIKTOK',
        'Look for alex_handle in the likes list',
        'Ask the user for their TikTok username, then check the likes list'
      ],
      [
        'TWITTER_FOLLOW',
        'TWITTER',
        'Search for @alex_handle in your followers',
        'Check if the user appears in your followers list'
      ],
      [
        'TWITTER_RETWEET',
        'TWITTER',
        'Click on the retweets count and search for @alex_handle',
        'Click on the retweets count to see who retweeted'
      ],
      [
        'TWITTER_LIKE',
        'TWITTER',
        'Click on the likes count and search for @alex_handle',
        'Click on the likes count to see who liked the post'
      ],
      [
        'KICK_FOLLOW',
        'KICK',
        'Search for alex_handle in your followers',
        'Check if the user appears in your followers list'
      ]
    ] as [TaskType, ProviderSchema['type'], string, string][])(
      'personalizes step 2 of %s with the connected %s label',
      (type, providerType, withLabel, withoutLabel) => {
        expect(stepOf(type, 2, [provider(providerType)]).instruction).toBe(
          withLabel
        );
        expect(stepOf(type, 2).instruction).toBe(withoutLabel);
        expect(
          stepOf(type, 2, [provider(providerType, { label: '' })]).instruction
        ).toBe(withoutLabel);
      }
    );

    it('links to the connected facebook profile', () => {
      expect(stepOf('FACEBOOK_VISIT_PAGE', 1, [provider('FACEBOOK')])).toEqual({
        step: 1,
        instruction:
          'Click the profile link below to view their Facebook profile',
        note: undefined
      });
    });

    it('asks for the facebook profile url when none is connected', () => {
      expect(stepOf('FACEBOOK_VISIT_PAGE', 1)).toEqual({
        step: 1,
        instruction: 'Ask the user for their Facebook profile URL',
        note: 'User has not connected their Facebook profile'
      });
    });

    it('asks for the facebook profile url when the connected profile has no link', () => {
      expect(
        stepOf('FACEBOOK_VISIT_PAGE', 1, [provider('FACEBOOK', { link: null })])
      ).toEqual({
        step: 1,
        instruction: 'Ask the user for their Facebook profile URL',
        note: 'User has not connected their Facebook profile'
      });
    });

    it('shows the connected twitter username in the connection note', () => {
      expect(stepOf('TWITTER_CONNECT', 2, [provider('TWITTER')]).note).toBe(
        "User's Twitter/X username: @alex_handle"
      );
    });

    it('notes that twitter is not connected when no twitter provider exists', () => {
      expect(stepOf('TWITTER_CONNECT', 2).note).toBe(
        'User has not connected Twitter/X'
      );
    });

    it('notes that twitter is not connected when the twitter provider has no label', () => {
      expect(
        stepOf('TWITTER_CONNECT', 2, [provider('TWITTER', { label: '' })]).note
      ).toBe('User has not connected Twitter/X');
    });
  });

  describe('when the task type is unknown', () => {
    it('throws an unexpected value error', () => {
      expect(() =>
        getVerificationInstructions({
          task: { type: 'NOT_A_TASK' } as unknown as TaskSchema,
          user: user()
        })
      ).toThrow('Unexpected value: [object Object]');
    });
  });
});
