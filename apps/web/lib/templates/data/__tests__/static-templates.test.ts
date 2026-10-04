import { describe, it, expect } from 'vitest';
import { IdentityProvider } from '@prisma/client';
import { getTemplateById, STATIC_TEMPLATES } from '../static-templates';
import {
  templateDetailsSchema,
  templateSettingsSchema
} from '../../schemas/template';
import { taskSchema } from '@giveaway/task-model/schemas';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  TWITTER_POST_URL,
  TWITTER_PROFILE_URL
} from '@giveaway/app-config/settings';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_ALLOW_USER_SELECTION,
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_SPONSOR_NAME,
  DEFAULT_WINNER_SELECTION_METHOD
} from '@giveaway/sweepstakes-model/defaults';

const byId = (id: string) => {
  const template = STATIC_TEMPLATES.find((t) => t.id === id);
  if (!template) {
    throw new Error(`Missing static template ${id}`);
  }
  return template;
};

describe('STATIC_TEMPLATES', () => {
  it('lists the basic, X and anonymous templates in order', () => {
    expect(STATIC_TEMPLATES.map((t) => t.id)).toEqual([
      'basic-giveaway',
      'x-giveaway',
      'anonymous-sweepstakes'
    ]);
  });

  it('gives every template a unique id', () => {
    const ids = STATIC_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names each template', () => {
    expect(STATIC_TEMPLATES.map((t) => t.template.name)).toEqual([
      'Basic Giveaway',
      'X Engagement',
      'Anonymous Sweepstakes'
    ]);
  });

  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s has valid template settings',
    (_id, template) => {
      expect(templateSettingsSchema.safeParse(template.template).success).toBe(
        true
      );
    }
  );

  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s uses its template image as the sweepstakes banner',
    (_id, template) => {
      expect(template.setup.banner).toBe(template.template.image);
    }
  );

  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s only fails full form validation because it has no prizes',
    (_id, template) => {
      const result = templateDetailsSchema.safeParse(template);

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.map((issue) => ({
          path: issue.path,
          message: issue.message
        }))
      ).toEqual([
        { path: ['prizes'], message: 'At least one prize is required' }
      ]);
    }
  );

  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s contains only valid tasks with unique generated ids',
    (_id, template) => {
      const ids = template.tasks.map((task) => task.id);

      expect(
        template.tasks.every((task) => taskSchema.safeParse(task).success)
      ).toBe(true);
      expect(
        ids.every((id) => typeof id === 'string' && id.length === 21)
      ).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  );

  it('generates task ids that are unique across all templates', () => {
    const ids = STATIC_TEMPLATES.flatMap((t) => t.tasks.map((task) => task.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s starts unlisted with no slug, prizes or form fields',
    (_id, template) => {
      expect(template.visibility).toEqual({
        visibility: 'UNLISTED',
        slug: null
      });
      expect(template.prizes).toEqual([]);
      expect(template.audience.formFields).toEqual([]);
    }
  );

  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s uses the default templated terms',
    (_id, template) => {
      expect(template.terms).toEqual({
        type: 'TEMPLATE',
        sponsorAddress: '',
        sponsorName: DEFAULT_SPONSOR_NAME,
        winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
        notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
        claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
        governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
        privacyPolicyUrl: ''
      });
    }
  );

  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s uses the same winner criteria',
    (_id, template) => {
      expect(template.criteria).toEqual({
        minTasksCompleted: 1,
        minQualityScore: 50,
        allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
        allowUserSelection: DEFAULT_ALLOW_USER_SELECTION
      });
    }
  );

  describe('basic-giveaway', () => {
    const template = byId('basic-giveaway');

    it('has a single visit-url task pointing at giveaway.dog', () => {
      expect(template.tasks).toEqual([
        {
          id: expect.any(String),
          type: 'VISIT_URL',
          title: 'Visit our website',
          label: 'Click Here!',
          href: 'https://giveaway.dog',
          value: 1,
          mandatory: false,
          tasksRequired: 0
        }
      ]);
    });

    it('allows the default identities without pre-entry login', () => {
      expect(template.audience.requirePreEntryLogin).toBe(false);
      expect(template.audience.allowedIdentities).toBe(
        DEFAULT_ALLOWED_IDENTITIES
      );
    });

    it('uses the light background color', () => {
      expect(template.design).toEqual({
        displayName: true,
        displayDescription: true,
        aspectRatio: 'VIDEO',
        background: { type: 'color', color: '#edf0f4' }
      });
    });
  });

  describe('x-giveaway', () => {
    const template = byId('x-giveaway');

    it('has connect, follow, repost and bonus tasks', () => {
      expect(template.tasks.map((task) => task.type)).toEqual([
        'TWITTER_CONNECT',
        'TWITTER_FOLLOW',
        'TWITTER_RETWEET',
        'BONUS_TASK'
      ]);
    });

    it('makes connecting an X account mandatory', () => {
      expect(template.tasks[0]).toMatchObject({
        type: 'TWITTER_CONNECT',
        mandatory: true
      });
    });

    it('follows the giveaway.dog profile and reposts its pinned post', () => {
      expect(template.tasks[1]).toMatchObject({
        username: TWITTER_PROFILE_URL
      });
      expect(template.tasks[2]).toMatchObject({ tweetId: TWITTER_POST_URL });
    });

    it('requires three completed tasks for the bonus entry', () => {
      expect(template.tasks[3]).toMatchObject({
        type: 'BONUS_TASK',
        tasksRequired: 3
      });
    });

    it('uses a black background', () => {
      expect(template.design.background).toEqual({
        type: 'color',
        color: '#000000'
      });
    });
  });

  describe('anonymous-sweepstakes', () => {
    const template = byId('anonymous-sweepstakes');

    it('has three media submission tasks', () => {
      expect(
        template.tasks.map((task) => ({
          type: task.type,
          title: task.title,
          value: task.value
        }))
      ).toEqual([
        { type: 'SUBMIT_MEDIA', title: 'Follow us on X', value: 1 },
        { type: 'SUBMIT_MEDIA', title: 'Share our post', value: 1 },
        { type: 'SUBMIT_MEDIA', title: 'Like our post', value: 1 }
      ]);
    });

    it('links each task description to the giveaway.dog X account', () => {
      for (const task of template.tasks) {
        expect(task).toMatchObject({
          description: expect.stringContaining('https://x.com/TheGiveawayDog')
        });
      }
    });

    it('requires pre-entry login with anonymous identities only', () => {
      expect(template.audience).toEqual({
        formFields: [],
        requirePreEntryLogin: true,
        allowedIdentities: [IdentityProvider.ANONYMOUS]
      });
    });

    it('uses a grey background', () => {
      expect(template.design.background).toEqual({
        type: 'color',
        color: '#dddddd'
      });
    });
  });
});

describe('getTemplateById', () => {
  it.each(STATIC_TEMPLATES.map((t) => [t.id, t] as const))(
    'returns the %s template object',
    (id, template) => {
      expect(getTemplateById(id)).toBe(template);
    }
  );

  it('returns null for an unknown id', () => {
    expect(getTemplateById('does-not-exist')).toBeNull();
  });

  it('returns null for an empty id', () => {
    expect(getTemplateById('')).toBeNull();
  });

  it('returns null for null and undefined', () => {
    expect(getTemplateById(null)).toBeNull();
    expect(getTemplateById(undefined)).toBeNull();
  });

  it('matches ids case-sensitively', () => {
    expect(getTemplateById('BASIC-GIVEAWAY')).toBeNull();
  });
});
