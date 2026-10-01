import { describe, it, expect, vi, afterEach } from 'vitest';
import { z } from 'zod';
import {
  allocatePrizeRequestSchema,
  baseGiveawayFormSchema,
  getStateDisplayLabel,
  giveawayDesignBackgroundSchema,
  giveawayDesignSchema,
  giveawayFormSchema,
  giveawayFormTaskSchema,
  giveawayFormTermsSchema,
  giveawayHostSchema,
  giveawayParticipationSchema,
  giveawaySchema,
  gradientBackgroundSchema,
  minimumAgeRestrictionSchema,
  participantSweepstakeSchema,
  PREVIEW_GIVEAWAY_STATES,
  prizeSchema,
  regionalRestrictionFilterSchema,
  regionalRestrictionSchema,
  solidColorBackgroundSchema,
  sweepstakesAllocationSchema,
  sweepstakesPrizeSchema,
  sweepstakesWinnerCriteriaSchema,
  termsTemplateSchema,
  timeSeriesDataSchema,
  toRegionalRestrictionDescription,
  toRegionName,
  userParticipationSchema,
  userTaskSubmissionSchema,
  type GiveawayState,
  type RegionalRestrictionSchema
} from '../schemas';

const NOW = new Date('2026-10-01T12:00:00.000Z');

const messagesOf = (result: z.SafeParseReturnType<unknown, unknown>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.message);

const pathsOf = (result: z.SafeParseReturnType<unknown, unknown>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.path);

const bonusTask = (overrides: Record<string, unknown> = {}) => ({
  id: 'task-1',
  type: 'BONUS_TASK',
  title: 'Bonus',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  ...overrides
});

const referralTask = (id: string) => ({
  id,
  type: 'REFERRAL_LINK',
  title: 'Refer',
  value: 1,
  mandatory: false,
  tasksRequired: 0
});

const templateTerms = (overrides: Record<string, unknown> = {}) => ({
  sponsorName: 'Acme',
  winnerSelectionMethod: 'Random Drawing',
  notificationTimeframeDays: 7,
  claimDeadlineDays: 7,
  governingLawCountry: 'USA',
  ...overrides
});

const userProfile = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  name: 'Jane',
  email: 'jane@example.com',
  emailVerified: true,
  image: 'https://example.com/a.png',
  countryCode: 'US',
  userAgent: 'agent',
  birthday: null,
  qualityScore: 80,
  providers: [],
  source: 'SIGNUP',
  preferredContactMethod: null,
  ...overrides
});

const validForm = (overrides: Record<string, unknown> = {}) => ({
  setup: { name: 'My Giveaway', description: 'Win stuff', banner: '' },
  terms: { type: 'CUSTOM', text: 'Custom terms' },
  timing: {
    startDate: '2026-10-02T00:00:00.000Z',
    endDate: '2026-10-09T00:00:00.000Z',
    timeZone: 'UTC'
  },
  audience: { allowedIdentities: ['EMAIL'], regionalRestriction: null },
  tasks: [bonusTask()],
  prizes: [{ id: 'prize-1', name: 'Prize', quota: 1 }],
  design: {
    displayName: true,
    displayDescription: true,
    background: { type: 'color', color: '#fff' }
  },
  visibility: { visibility: 'PUBLIC', slug: 'my-giveaway' },
  criteria: {},
  ...overrides
});

const baseShape = baseGiveawayFormSchema({ validate: false }).shape;

describe('prizeSchema', () => {
  it('accepts a prize with a name between 3 and 100 characters and a quota between 1 and 10', () => {
    const prize = { id: 'p1', name: 'abc', quota: 10 };

    expect(prizeSchema.parse(prize)).toEqual(prize);
  });

  it('accepts a name of exactly 100 characters', () => {
    expect(
      prizeSchema.safeParse({ id: 'p1', name: 'a'.repeat(100), quota: 1 })
        .success
    ).toBe(true);
  });

  it('rejects a name shorter than 3 characters', () => {
    const result = prizeSchema.safeParse({ id: 'p1', name: 'ab', quota: 1 });

    expect(pathsOf(result)).toEqual([['name']]);
  });

  it('rejects a name longer than 100 characters', () => {
    const result = prizeSchema.safeParse({
      id: 'p1',
      name: 'a'.repeat(101),
      quota: 1
    });

    expect(pathsOf(result)).toEqual([['name']]);
  });

  it('rejects a quota below 1 with the minimum message', () => {
    const result = prizeSchema.safeParse({ id: 'p1', name: 'abc', quota: 0 });

    expect(messagesOf(result)).toEqual(['Minimum value is 1']);
  });

  it('rejects a quota above 10 with the maximum message', () => {
    const result = prizeSchema.safeParse({ id: 'p1', name: 'abc', quota: 11 });

    expect(messagesOf(result)).toEqual(['Maximum value is 10']);
  });

  it('accepts a fractional quota because no integer rule is applied', () => {
    expect(
      prizeSchema.safeParse({ id: 'p1', name: 'abc', quota: 1.5 }).success
    ).toBe(true);
  });
});

describe('regionalRestrictionFilterSchema', () => {
  it.each(['INCLUDE', 'EXCLUDE'])('accepts %s', (filter) => {
    expect(regionalRestrictionFilterSchema.parse(filter)).toBe(filter);
  });

  it('rejects an unknown filter', () => {
    expect(regionalRestrictionFilterSchema.safeParse('ALL').success).toBe(
      false
    );
  });
});

describe('termsTemplateSchema', () => {
  it('accepts the minimal required fields', () => {
    expect(termsTemplateSchema.parse(templateTerms())).toEqual(templateTerms());
  });

  it('accepts null for every nullish field', () => {
    const terms = templateTerms({
      sponsorAddress: null,
      maxEntriesPerUser: null,
      privacyPolicyUrl: null,
      additionalTerms: null
    });

    expect(termsTemplateSchema.parse(terms)).toEqual(terms);
  });

  it('accepts an empty privacy policy url', () => {
    expect(
      termsTemplateSchema.parse(templateTerms({ privacyPolicyUrl: '' }))
        .privacyPolicyUrl
    ).toBe('');
  });

  it('accepts a valid privacy policy url', () => {
    expect(
      termsTemplateSchema.parse(
        templateTerms({ privacyPolicyUrl: 'https://example.com/privacy' })
      ).privacyPolicyUrl
    ).toBe('https://example.com/privacy');
  });

  it('rejects a privacy policy that is neither a url nor empty with the url message', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ privacyPolicyUrl: 'not a url' })
    );

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        code: 'invalid_string',
        message: 'Privacy policy must be a valid URL',
        path: ['privacyPolicyUrl']
      })
    ]);
  });

  it('rejects an empty sponsor name', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ sponsorName: '' })
    );

    expect(messagesOf(result)).toEqual(['Sponsor name is required']);
  });

  it('rejects an empty winner selection method', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ winnerSelectionMethod: '' })
    );

    expect(messagesOf(result)).toEqual(['Winner selection method is required']);
  });

  it('rejects a non-positive notification timeframe', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ notificationTimeframeDays: 0 })
    );

    expect(messagesOf(result)).toEqual([
      'Notification timeframe must be a positive integer'
    ]);
  });

  it('rejects a fractional notification timeframe', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ notificationTimeframeDays: 1.5 })
    );

    expect(pathsOf(result)).toEqual([['notificationTimeframeDays']]);
  });

  it('rejects a non-positive claim deadline', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ claimDeadlineDays: -1 })
    );

    expect(messagesOf(result)).toEqual([
      'Claim deadline must be a positive integer'
    ]);
  });

  it('rejects a non-positive max entries per user', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ maxEntriesPerUser: 0 })
    );

    expect(pathsOf(result)).toEqual([['maxEntriesPerUser']]);
  });

  it('rejects an empty governing law country', () => {
    const result = termsTemplateSchema.safeParse(
      templateTerms({ governingLawCountry: '' })
    );

    expect(messagesOf(result)).toEqual(['Governing law country is required']);
  });
});

describe('giveawayFormTermsSchema', () => {
  it('accepts template terms tagged with TEMPLATE', () => {
    const terms = { type: 'TEMPLATE', ...templateTerms() };

    expect(giveawayFormTermsSchema.parse(terms)).toEqual(terms);
  });

  it('accepts custom terms tagged with CUSTOM', () => {
    expect(giveawayFormTermsSchema.parse({ type: 'CUSTOM', text: '' })).toEqual(
      { type: 'CUSTOM', text: '' }
    );
  });

  it('requires the template fields when the type is TEMPLATE', () => {
    const result = giveawayFormTermsSchema.safeParse({
      type: 'TEMPLATE',
      text: 'ignored'
    });

    expect(pathsOf(result)).toEqual([
      ['sponsorName'],
      ['winnerSelectionMethod'],
      ['notificationTimeframeDays'],
      ['claimDeadlineDays'],
      ['governingLawCountry']
    ]);
  });

  it('requires text when the type is CUSTOM', () => {
    const result = giveawayFormTermsSchema.safeParse({ type: 'CUSTOM' });

    expect(pathsOf(result)).toEqual([['text']]);
  });

  it('rejects an unknown discriminator', () => {
    const result = giveawayFormTermsSchema.safeParse({ type: 'OTHER' });

    expect(result.error?.issues[0].code).toBe('invalid_union_discriminator');
  });
});

describe('regionalRestrictionSchema', () => {
  it.each([null, undefined])('accepts %s', (value) => {
    expect(regionalRestrictionSchema.parse(value)).toBe(value);
  });

  it('accepts at least one region with a filter', () => {
    const restriction = { regions: ['country:US'], filter: 'INCLUDE' };

    expect(regionalRestrictionSchema.parse(restriction)).toEqual(restriction);
  });

  it('rejects an empty regions list', () => {
    const result = regionalRestrictionSchema.safeParse({
      regions: [],
      filter: 'EXCLUDE'
    });

    expect(pathsOf(result)).toEqual([['regions']]);
  });

  it('rejects a missing filter', () => {
    const result = regionalRestrictionSchema.safeParse({
      regions: ['country:US']
    });

    expect(pathsOf(result)).toEqual([['filter']]);
  });
});

describe('toRegionName', () => {
  it('resolves a country code to its country name', () => {
    expect(toRegionName('country:US')).toBe('United States of America');
  });

  it('resolves a continent code to its continent name', () => {
    expect(toRegionName('continent:EU')).toBe('Europe');
  });

  it('falls back to the raw code for an unknown country', () => {
    expect(toRegionName('country:ZZ')).toBe('ZZ');
  });

  it('falls back to the raw code for an unknown continent', () => {
    expect(toRegionName('continent:XX')).toBe('XX');
  });

  it('returns the input untouched for an unknown region type', () => {
    expect(toRegionName('state:CA')).toBe('state:CA');
  });

  it('returns the input untouched when there is no type prefix', () => {
    expect(toRegionName('US')).toBe('US');
  });

  it('returns an empty string for a country prefix without a code', () => {
    expect(toRegionName('country:')).toBe('');
  });
});

describe('toRegionalRestrictionDescription', () => {
  it('returns null for a null restriction', () => {
    expect(toRegionalRestrictionDescription(null)).toBeNull();
  });

  it('returns null for an undefined restriction', () => {
    expect(toRegionalRestrictionDescription(undefined)).toBeNull();
  });

  it('returns null when the regions are missing', () => {
    expect(
      toRegionalRestrictionDescription({
        filter: 'INCLUDE'
      } as unknown as RegionalRestrictionSchema)
    ).toBeNull();
  });

  it('returns null when the regions are empty', () => {
    expect(
      toRegionalRestrictionDescription({ regions: [], filter: 'INCLUDE' })
    ).toBeNull();
  });

  it('lists the included region names', () => {
    expect(
      toRegionalRestrictionDescription({
        regions: ['country:US', 'continent:EU', 'country:ZZ'],
        filter: 'INCLUDE'
      })
    ).toBe('Only available in: United States of America, Europe, ZZ');
  });

  it('lists the excluded region names', () => {
    expect(
      toRegionalRestrictionDescription({
        regions: ['country:CA'],
        filter: 'EXCLUDE'
      })
    ).toBe('Not available in: Canada');
  });

  it('describes a restriction without a filter as an exclusion', () => {
    expect(
      toRegionalRestrictionDescription({
        regions: ['country:CA']
      } as unknown as RegionalRestrictionSchema)
    ).toBe('Not available in: Canada');
  });
});

describe('minimumAgeRestrictionSchema', () => {
  const restriction = {
    format: 'CHECKBOX',
    value: 16,
    label: 'I am 16',
    required: true
  };

  it('accepts a checkbox restriction at the default minimum age', () => {
    expect(minimumAgeRestrictionSchema.parse(restriction)).toEqual(restriction);
  });

  it.each([null, undefined])('accepts %s', (value) => {
    expect(minimumAgeRestrictionSchema.parse(value)).toBe(value);
  });

  it('rejects an age below the default minimum', () => {
    const result = minimumAgeRestrictionSchema.safeParse({
      ...restriction,
      value: 15
    });

    expect(messagesOf(result)).toEqual(['Minimum age is 16']);
  });

  it('rejects an empty label', () => {
    const result = minimumAgeRestrictionSchema.safeParse({
      ...restriction,
      label: ''
    });

    expect(messagesOf(result)).toEqual(['Label is required']);
  });

  it('rejects a format other than CHECKBOX', () => {
    const result = minimumAgeRestrictionSchema.safeParse({
      ...restriction,
      format: 'INPUT'
    });

    expect(pathsOf(result)).toEqual([['format']]);
  });
});

describe('visibility shape of the giveaway form', () => {
  const visibility = baseShape.visibility;

  it('accepts a slug made of letters, numbers, and hyphens', () => {
    expect(
      visibility.parse({ visibility: 'PUBLIC', slug: 'My-Slug-1' })
    ).toEqual({ visibility: 'PUBLIC', slug: 'My-Slug-1' });
  });

  it.each([null, undefined])('accepts a %s slug', (slug) => {
    expect(visibility.parse({ visibility: 'UNLISTED', slug }).slug).toBe(slug);
  });

  it.each([3, 50])('accepts a slug of exactly %s characters', (length) => {
    const slug = 'a'.repeat(length);

    expect(visibility.parse({ visibility: 'PUBLIC', slug }).slug).toBe(slug);
  });

  it('rejects a slug shorter than 3 characters', () => {
    const result = visibility.safeParse({ visibility: 'PUBLIC', slug: 'ab' });

    expect(messagesOf(result)).toEqual([
      'URL slug must be at least 3 characters'
    ]);
  });

  it('rejects a slug longer than 50 characters', () => {
    const result = visibility.safeParse({
      visibility: 'PUBLIC',
      slug: 'a'.repeat(51)
    });

    expect(messagesOf(result)).toEqual([
      'URL slug must be at most 50 characters'
    ]);
  });

  it('rejects a slug with characters other than letters, numbers, and hyphens', () => {
    const result = visibility.safeParse({
      visibility: 'PUBLIC',
      slug: 'my_slug'
    });

    expect(messagesOf(result)).toEqual([
      'URL slug can only contain letters, numbers, and hyphens'
    ]);
  });

  it('rejects an unknown visibility type', () => {
    const result = visibility.safeParse({ visibility: 'HIDDEN', slug: null });

    expect(pathsOf(result)).toEqual([['visibility']]);
  });
});

describe('sweepstakesWinnerCriteriaSchema', () => {
  it('fills in the defaults for an empty object', () => {
    expect(sweepstakesWinnerCriteriaSchema.parse({})).toEqual({
      minTasksCompleted: 1,
      minQualityScore: 70,
      allowMultipleWins: false,
      allowUserSelection: false
    });
  });

  it('keeps explicit values', () => {
    const criteria = {
      minTasksCompleted: 3,
      minQualityScore: 0,
      allowMultipleWins: true,
      allowUserSelection: true,
      externalPlatforms: ['TWITTER_IMPORT', 'DISCORD_IMPORT']
    };

    expect(sweepstakesWinnerCriteriaSchema.parse(criteria)).toEqual(criteria);
  });

  it('accepts null external platforms', () => {
    expect(
      sweepstakesWinnerCriteriaSchema.parse({ externalPlatforms: null })
        .externalPlatforms
    ).toBeNull();
  });

  it('rejects fewer than one task completed', () => {
    const result = sweepstakesWinnerCriteriaSchema.safeParse({
      minTasksCompleted: 0
    });

    expect(messagesOf(result)).toEqual(['Minimum tasks must be at least 1']);
  });

  it('rejects a fractional task count', () => {
    const result = sweepstakesWinnerCriteriaSchema.safeParse({
      minTasksCompleted: 1.5
    });

    expect(pathsOf(result)).toEqual([['minTasksCompleted']]);
  });

  it('rejects a quality score below 0', () => {
    const result = sweepstakesWinnerCriteriaSchema.safeParse({
      minQualityScore: -1
    });

    expect(messagesOf(result)).toEqual(['Quality score must be between 0-100']);
  });

  it('accepts a quality score of exactly 100', () => {
    expect(
      sweepstakesWinnerCriteriaSchema.parse({ minQualityScore: 100 })
        .minQualityScore
    ).toBe(100);
  });

  it('rejects a quality score above 100', () => {
    const result = sweepstakesWinnerCriteriaSchema.safeParse({
      minQualityScore: 101
    });

    expect(messagesOf(result)).toEqual(['Quality score must be between 0-100']);
  });

  it('rejects an empty external platforms list', () => {
    const result = sweepstakesWinnerCriteriaSchema.safeParse({
      externalPlatforms: []
    });

    expect(messagesOf(result)).toEqual([
      'At least one external source must be selected'
    ]);
  });

  it('rejects more than five external platforms', () => {
    const result = sweepstakesWinnerCriteriaSchema.safeParse({
      externalPlatforms: [
        'SIGNUP',
        'ANONYMOUS',
        'TWITTER_IMPORT',
        'BLUESKY_IMPORT',
        'MANUAL_IMPORT',
        'DISCORD_IMPORT'
      ]
    });

    expect(messagesOf(result)).toEqual([
      'A maximum of 5 external sources are allowed'
    ]);
  });

  it('rejects an unknown external platform', () => {
    const result = sweepstakesWinnerCriteriaSchema.safeParse({
      externalPlatforms: ['MYSPACE_IMPORT']
    });

    expect(pathsOf(result)).toEqual([['externalPlatforms', 0]]);
  });
});

describe('audience shape of the giveaway form', () => {
  const audience = baseShape.audience;

  it('defaults requirePreEntryLogin to false and formFields to an empty list', () => {
    expect(
      audience.parse({
        allowedIdentities: ['EMAIL'],
        regionalRestriction: null
      })
    ).toEqual({
      allowedIdentities: ['EMAIL'],
      regionalRestriction: null,
      requirePreEntryLogin: false,
      formFields: []
    });
  });

  it('keeps a null requirePreEntryLogin instead of applying the default', () => {
    expect(
      audience.parse({
        allowedIdentities: ['EMAIL'],
        requirePreEntryLogin: null
      }).requirePreEntryLogin
    ).toBeNull();
  });

  it('parses form fields with their own defaults', () => {
    expect(
      audience.parse({
        allowedIdentities: ['GOOGLE'],
        formFields: [{ id: 'f1', label: 'Username', type: 'USERNAME' }]
      }).formFields
    ).toEqual([
      { id: 'f1', label: 'Username', type: 'USERNAME', required: false }
    ]);
  });

  it('validates the regional restriction', () => {
    const result = audience.safeParse({
      allowedIdentities: ['EMAIL'],
      regionalRestriction: { regions: [], filter: 'INCLUDE' }
    });

    expect(pathsOf(result)).toEqual([['regionalRestriction', 'regions']]);
  });

  it('requires at least one allowed identity', () => {
    const result = audience.safeParse({ allowedIdentities: [] });

    expect(messagesOf(result)).toEqual([
      'At least one allowed identity is required'
    ]);
  });

  it('rejects an unknown identity provider', () => {
    const result = audience.safeParse({ allowedIdentities: ['MYSPACE'] });

    expect(pathsOf(result)).toEqual([['allowedIdentities', 0]]);
  });
});

describe('giveawayFormTaskSchema', () => {
  it('accepts between 1 and 25 tasks', () => {
    const tasks = Array.from({ length: 25 }, (_, i) =>
      bonusTask({ id: `task-${i}` })
    );

    expect(giveawayFormTaskSchema.parse(tasks)).toHaveLength(25);
  });

  it('requires at least one task', () => {
    const result = giveawayFormTaskSchema.safeParse([]);

    expect(messagesOf(result)).toEqual([
      'At least one entry method is required'
    ]);
  });

  it('allows at most 25 tasks', () => {
    const tasks = Array.from({ length: 26 }, (_, i) =>
      bonusTask({ id: `task-${i}` })
    );

    const result = giveawayFormTaskSchema.safeParse(tasks);

    expect(messagesOf(result)).toEqual([
      'Maximum of 25 entry methods are allowed'
    ]);
  });

  it('rejects an invalid task inside the list', () => {
    const result = giveawayFormTaskSchema.safeParse([bonusTask({ title: '' })]);

    expect(messagesOf(result)).toEqual(['Title is required']);
  });
});

describe('prizes shape of the giveaway form', () => {
  const prizes = baseShape.prizes;
  const prize = (i: number) => ({ id: `p${i}`, name: 'Prize', quota: 1 });

  it('accepts 200 prizes', () => {
    const list = Array.from({ length: 200 }, (_, i) => prize(i));

    expect(prizes.parse(list)).toHaveLength(200);
  });

  it('requires at least one prize', () => {
    expect(messagesOf(prizes.safeParse([]))).toEqual([
      'At least one prize is required'
    ]);
  });

  it('allows at most 200 prizes', () => {
    const list = Array.from({ length: 201 }, (_, i) => prize(i));

    expect(messagesOf(prizes.safeParse(list))).toEqual([
      'Maximum of 200 prizes are allowed'
    ]);
  });
});

describe('solidColorBackgroundSchema', () => {
  it.each(['#fff', '#A1b2C3'])('accepts the hex color %s', (color) => {
    expect(solidColorBackgroundSchema.parse({ type: 'color', color })).toEqual({
      type: 'color',
      color
    });
  });

  it.each(['#ffff', 'red', 'fff', '#ggg'])(
    'rejects the invalid color %s',
    (color) => {
      const result = solidColorBackgroundSchema.safeParse({
        type: 'color',
        color
      });

      expect(messagesOf(result)).toEqual(['Must be a valid hex color']);
    }
  );
});

describe('gradientBackgroundSchema', () => {
  const gradient = (overrides: Record<string, unknown> = {}) => ({
    type: 'gradient',
    format: 'linear',
    angle: 0,
    stops: [
      { color: '#000', position: 0 },
      { color: '#ffffff', position: 100 }
    ],
    ...overrides
  });

  it('accepts a linear gradient', () => {
    expect(gradientBackgroundSchema.parse(gradient())).toEqual(gradient());
  });

  it('accepts a radial gradient with an angle of 360 and no stops', () => {
    const value = gradient({ format: 'radial', angle: 360, stops: [] });

    expect(gradientBackgroundSchema.parse(value)).toEqual(value);
  });

  it('rejects an unknown format', () => {
    const result = gradientBackgroundSchema.safeParse(
      gradient({ format: 'conic' })
    );

    expect(pathsOf(result)).toEqual([['format']]);
  });

  it.each([-1, 361])('rejects the angle %s', (angle) => {
    const result = gradientBackgroundSchema.safeParse(gradient({ angle }));

    expect(pathsOf(result)).toEqual([['angle']]);
  });

  it.each([-1, 101])('rejects the stop position %s', (position) => {
    const result = gradientBackgroundSchema.safeParse(
      gradient({ stops: [{ color: '#000', position }] })
    );

    expect(pathsOf(result)).toEqual([['stops', 0, 'position']]);
  });

  it('rejects an invalid stop color', () => {
    const result = gradientBackgroundSchema.safeParse(
      gradient({ stops: [{ color: 'blue', position: 0 }] })
    );

    expect(messagesOf(result)).toEqual(['Must be a valid hex color']);
  });
});

describe('giveawayDesignBackgroundSchema', () => {
  it('parses a color background', () => {
    expect(
      giveawayDesignBackgroundSchema.parse({ type: 'color', color: '#123' })
    ).toEqual({ type: 'color', color: '#123' });
  });

  it('parses a gradient background', () => {
    const value = {
      type: 'gradient',
      format: 'radial',
      angle: 45,
      stops: []
    };

    expect(giveawayDesignBackgroundSchema.parse(value)).toEqual(value);
  });

  it('rejects an unknown background type', () => {
    const result = giveawayDesignBackgroundSchema.safeParse({
      type: 'image',
      url: 'https://example.com'
    });

    expect(result.error?.issues[0].code).toBe('invalid_union_discriminator');
  });
});

describe('giveawayDesignSchema', () => {
  const design = {
    displayName: false,
    displayDescription: true,
    background: { type: 'color', color: '#fff' }
  };

  it('defaults the aspect ratio to VIDEO', () => {
    expect(giveawayDesignSchema.parse(design).aspectRatio).toBe('VIDEO');
  });

  it('keeps the NONE aspect ratio', () => {
    expect(
      giveawayDesignSchema.parse({ ...design, aspectRatio: 'NONE' }).aspectRatio
    ).toBe('NONE');
  });

  it('rejects an unknown aspect ratio', () => {
    const result = giveawayDesignSchema.safeParse({
      ...design,
      aspectRatio: 'SQUARE'
    });

    expect(pathsOf(result)).toEqual([['aspectRatio']]);
  });

  it('requires the display flags and background', () => {
    const result = giveawayDesignSchema.safeParse({});

    expect(pathsOf(result)).toEqual([
      ['displayName'],
      ['displayDescription'],
      ['background']
    ]);
  });
});

describe('baseGiveawayFormSchema', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses a complete form and applies the nested defaults', () => {
    const parsed = baseGiveawayFormSchema({ validate: false }).parse(
      validForm()
    );

    expect(parsed).toEqual({
      setup: { name: 'My Giveaway', description: 'Win stuff', banner: '' },
      terms: { type: 'CUSTOM', text: 'Custom terms' },
      timing: {
        startDate: new Date('2026-10-02T00:00:00.000Z'),
        endDate: new Date('2026-10-09T00:00:00.000Z'),
        timeZone: 'UTC'
      },
      audience: {
        allowedIdentities: ['EMAIL'],
        regionalRestriction: null,
        requirePreEntryLogin: false,
        formFields: []
      },
      tasks: [bonusTask()],
      prizes: [{ id: 'prize-1', name: 'Prize', quota: 1 }],
      design: {
        displayName: true,
        displayDescription: true,
        aspectRatio: 'VIDEO',
        background: { type: 'color', color: '#fff' }
      },
      visibility: { visibility: 'PUBLIC', slug: 'my-giveaway' },
      criteria: {
        minTasksCompleted: 1,
        minQualityScore: 70,
        allowMultipleWins: false,
        allowUserSelection: false
      }
    });
  });

  it('requires setup name and description of at least 3 characters', () => {
    const result = baseGiveawayFormSchema({ validate: false }).safeParse(
      validForm({ setup: { name: 'ab', description: 'cd', banner: '' } })
    );

    expect(pathsOf(result)).toEqual([
      ['setup', 'name'],
      ['setup', 'description']
    ]);
  });

  it('accepts a setup name and description of exactly 3 characters', () => {
    const result = baseGiveawayFormSchema({ validate: false }).safeParse(
      validForm({ setup: { name: 'abc', description: 'def', banner: '' } })
    );

    expect(result.success).toBe(true);
  });

  it('accepts an end date in the past when validation is off', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const result = baseGiveawayFormSchema({ validate: false }).safeParse(
      validForm({
        timing: {
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: '2020-01-02T00:00:00.000Z',
          timeZone: 'UTC'
        }
      })
    );

    expect(result.success).toBe(true);
  });

  it('rejects an end date in the past when validation is on', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const result = baseGiveawayFormSchema({ validate: true }).safeParse(
      validForm({
        timing: {
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: '2020-01-02T00:00:00.000Z',
          timeZone: 'UTC'
        }
      })
    );

    expect(messagesOf(result)).toEqual(['End date must be in the future']);
  });

  it('limits the duration to the maximum sweepstakes duration when validation is on', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const result = baseGiveawayFormSchema({ validate: true }).safeParse(
      validForm({
        timing: {
          startDate: '2026-10-02T00:00:00.000Z',
          endDate: '2027-01-02T00:00:00.000Z',
          timeZone: 'UTC'
        }
      })
    );

    expect(messagesOf(result)).toEqual(['Duration cannot exceed 90 days']);
  });
});

describe('giveawayFormSchema', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the plain object schema without task refinement when validation is off', () => {
    const schema = giveawayFormSchema({ validate: false, maxLoyalty: 0 });

    expect(schema).toBeInstanceOf(z.ZodObject);
  });

  it('does not reject duplicate referral tasks when validation is off', () => {
    const result = giveawayFormSchema({
      validate: false,
      maxLoyalty: 0
    }).safeParse(
      validForm({ tasks: [referralTask('r1'), referralTask('r2')] })
    );

    expect(result.success).toBe(true);
  });

  it('wraps the schema in a refinement when validation is on', () => {
    const schema = giveawayFormSchema({ validate: true, maxLoyalty: 0 });

    expect(schema).toBeInstanceOf(z.ZodEffects);
  });

  it('accepts a valid form when validation is on', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const result = giveawayFormSchema({
      validate: true,
      maxLoyalty: 0
    }).safeParse(validForm());

    expect(result.success).toBe(true);
  });

  it('rejects duplicate referral tasks when validation is on', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const result = giveawayFormSchema({
      validate: true,
      maxLoyalty: 0
    }).safeParse(
      validForm({ tasks: [referralTask('r1'), referralTask('r2')] })
    );

    expect(pathsOf(result)).toEqual([
      ['tasks'],
      ['tasks', 0, 'title'],
      ['tasks', 1, 'title']
    ]);
    expect(messagesOf(result)).toEqual([
      'Only one referral link task is allowed per giveaway',
      'Only one referral link task is allowed per giveaway',
      'Only one referral link task is allowed per giveaway'
    ]);
  });

  it('passes maxLoyalty through to the task refinement', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const loyaltyTask = bonusTask({
      type: 'BONUS_LOYALTY',
      loyaltyRequired: 3
    });

    const rejected = giveawayFormSchema({
      validate: true,
      maxLoyalty: 2
    }).safeParse(validForm({ tasks: [loyaltyTask] }));
    const accepted = giveawayFormSchema({
      validate: true,
      maxLoyalty: 3
    }).safeParse(validForm({ tasks: [loyaltyTask] }));

    expect(messagesOf(rejected)).toEqual([
      'Loyalty required cannot exceed your total number of published sweepstakes (2)'
    ]);
    expect(accepted.success).toBe(true);
  });
});

describe('giveawaySchema', () => {
  it('extends the form with a derived status and id', () => {
    const parsed = giveawaySchema.parse({
      ...validForm(),
      status: 'RUNNING',
      id: 'sweep-1'
    });

    expect(parsed.status).toBe('RUNNING');
    expect(parsed.id).toBe('sweep-1');
  });

  it('accepts the ERROR status', () => {
    expect(
      giveawaySchema.parse({ ...validForm(), status: 'ERROR', id: 's' }).status
    ).toBe('ERROR');
  });

  it('rejects a stored status that is not a derived status', () => {
    const result = giveawaySchema.safeParse({
      ...validForm(),
      status: 'ACTIVE',
      id: 'sweep-1'
    });

    expect(pathsOf(result)).toEqual([['status']]);
  });

  it('does not validate that the end date is in the future', () => {
    const result = giveawaySchema.safeParse({
      ...validForm({
        timing: {
          startDate: '2000-01-01T00:00:00.000Z',
          endDate: '2000-01-02T00:00:00.000Z',
          timeZone: 'UTC'
        }
      }),
      status: 'EXPIRED',
      id: 'sweep-1'
    });

    expect(result.success).toBe(true);
  });
});

describe('userTaskSubmissionSchema', () => {
  it('accepts any proof value', () => {
    const submission = {
      taskId: 't1',
      status: 'PENDING',
      proof: { url: 'x' }
    };

    expect(userTaskSubmissionSchema.parse(submission)).toEqual(submission);
  });

  it('rejects an unknown completion status', () => {
    const result = userTaskSubmissionSchema.safeParse({
      taskId: 't1',
      status: 'DONE'
    });

    expect(pathsOf(result)).toEqual([['status']]);
  });
});

describe('userParticipationSchema', () => {
  it('accepts zero entries with no submissions', () => {
    expect(
      userParticipationSchema.parse({ entries: 0, submissions: [] })
    ).toEqual({ entries: 0, submissions: [] });
  });

  it('rejects negative entries', () => {
    const result = userParticipationSchema.safeParse({
      entries: -1,
      submissions: []
    });

    expect(pathsOf(result)).toEqual([['entries']]);
  });

  it('rejects fractional entries', () => {
    const result = userParticipationSchema.safeParse({
      entries: 0.5,
      submissions: []
    });

    expect(pathsOf(result)).toEqual([['entries']]);
  });
});

describe('giveawayHostSchema', () => {
  it('accepts a host with only a slug and name', () => {
    expect(giveawayHostSchema.parse({ slug: 'acme', name: 'Acme' })).toEqual({
      slug: 'acme',
      name: 'Acme'
    });
  });

  it('accepts arbitrary links data', () => {
    const host = {
      id: null,
      slug: 'acme',
      name: 'Acme',
      logo: null,
      links: { anything: [1, 2] }
    };

    expect(giveawayHostSchema.parse(host)).toEqual(host);
  });

  it('requires a slug and name', () => {
    expect(pathsOf(giveawayHostSchema.safeParse({}))).toEqual([
      ['slug'],
      ['name']
    ]);
  });
});

describe('giveawayParticipationSchema', () => {
  it('accepts non-negative integer counts', () => {
    const participation = {
      totalEntries: 4,
      usersByTask: { t1: 2, t2: 0 },
      totalUsers: 2
    };

    expect(giveawayParticipationSchema.parse(participation)).toEqual(
      participation
    );
  });

  it('rejects a negative per-task count', () => {
    const result = giveawayParticipationSchema.safeParse({
      totalEntries: 0,
      usersByTask: { t1: -1 },
      totalUsers: 0
    });

    expect(pathsOf(result)).toEqual([['usersByTask', 't1']]);
  });
});

describe('PREVIEW_GIVEAWAY_STATES', () => {
  it('lists the states available in the preview picker in order', () => {
    expect(PREVIEW_GIVEAWAY_STATES).toEqual([
      'active',
      'not-logged-in',
      'profile-incomplete',
      'not-eligible',
      'winners-announced',
      'no-prize-allocation'
    ]);
  });
});

describe('getStateDisplayLabel', () => {
  it.each<[GiveawayState, string]>([
    ['active', 'Active State'],
    ['pending', 'Pending'],
    ['not-logged-in', 'Not Logged In'],
    ['profile-incomplete', 'Profile Incomplete'],
    ['not-eligible', 'Not Eligible'],
    ['winners-announced', 'Winners Announced'],
    ['winners-pending', 'Winners Pending'],
    ['no-prize-allocation', 'No Prize Selected'],
    ['closed', 'Closed'],
    ['canceled', 'Canceled'],
    ['error', 'Error']
  ])('labels %s as %s', (state, label) => {
    expect(getStateDisplayLabel(state)).toBe(label);
  });

  it('throws for an unknown state', () => {
    expect(() =>
      getStateDisplayLabel('archived' as unknown as GiveawayState)
    ).toThrow('Unexpected value: archived');
  });
});

describe('participantSweepstakeSchema', () => {
  const draw = (overrides: Record<string, unknown> = {}) => ({
    id: 'draw-1',
    result: 'WINNER',
    disqualificationReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    task: { id: 'task-1', type: 'BONUS_TASK', title: 'Bonus', value: 5 },
    user: userProfile(),
    ...overrides
  });

  const participantSweepstake = (
    drawOverrides: Record<string, unknown> = {}
  ) => ({
    sweepstakes: { ...validForm(), status: 'RUNNING', id: 'sweep-1' },
    host: { id: 'team-1', slug: 'acme', name: 'Acme' },
    prizes: [
      {
        prizeId: 'prize-1',
        prizeName: 'Prize',
        quota: 1,
        draws: [draw(drawOverrides)]
      }
    ],
    participation: { totalEntries: 1, usersByTask: {}, totalUsers: 1 }
  });

  it('coerces draw timestamps into dates', () => {
    const parsed = participantSweepstakeSchema.parse(participantSweepstake());

    expect(parsed.prizes[0].draws[0].createdAt).toEqual(
      new Date('2026-01-01T00:00:00.000Z')
    );
    expect(parsed.prizes[0].draws[0].updatedAt).toEqual(
      new Date('2026-01-02T00:00:00.000Z')
    );
  });

  it('keeps only the id, type, and title of a draw task', () => {
    const parsed = participantSweepstakeSchema.parse(participantSweepstake());

    expect(parsed.prizes[0].draws[0].task).toEqual({
      id: 'task-1',
      type: 'BONUS_TASK',
      title: 'Bonus'
    });
  });

  it('nulls out a draw user image that is not a url', () => {
    const parsed = participantSweepstakeSchema.parse(
      participantSweepstake({ user: userProfile({ image: 'not-a-url' }) })
    );

    expect(parsed.prizes[0].draws[0].user.image).toBeNull();
  });

  it('rejects an unknown draw result', () => {
    const result = participantSweepstakeSchema.safeParse(
      participantSweepstake({ result: 'PENDING' })
    );

    expect(pathsOf(result)).toEqual([['prizes', 0, 'draws', 0, 'result']]);
  });
});

describe('timeSeriesDataSchema', () => {
  it('accepts a date string and an entry count', () => {
    expect(
      timeSeriesDataSchema.parse({ date: '2026-10-01', entries: 3 })
    ).toEqual({ date: '2026-10-01', entries: 3 });
  });

  it('does not coerce a Date into the date string', () => {
    expect(
      timeSeriesDataSchema.safeParse({ date: new Date(), entries: 3 }).success
    ).toBe(false);
  });
});

describe('sweepstakesPrizeSchema', () => {
  const completion = {
    id: 'completion-1',
    completedAt: '2026-01-01T00:00:00.000Z',
    status: 'COMPLETED',
    proof: null,
    task: bonusTask(),
    sweepstake: { id: 'sweep-1', name: 'Sweep' }
  };

  const prize = (result: string) => ({
    id: 'prize-1',
    name: 'Prize',
    position: 0,
    quota: 1,
    draws: [
      {
        id: 'draw-1',
        updatedAt: '2026-01-02T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        result,
        disqualificationReason: null,
        participant: userProfile(),
        taskCompletion: completion
      }
    ]
  });

  it.each(['WINNER', 'DISQUALIFIED'])(
    'accepts a %s draw and coerces its dates',
    (result) => {
      const parsed = sweepstakesPrizeSchema.parse(prize(result));

      expect(parsed.draws[0].result).toBe(result);
      expect(parsed.draws[0].createdAt).toEqual(
        new Date('2026-01-01T00:00:00.000Z')
      );
      expect(parsed.draws[0].taskCompletion.completedAt).toEqual(
        new Date('2026-01-01T00:00:00.000Z')
      );
    }
  );

  it('rejects any other draw result', () => {
    const result = sweepstakesPrizeSchema.safeParse(prize('PENDING'));

    expect(pathsOf(result)).toEqual([['draws', 0, 'result']]);
  });
});

describe('sweepstakesAllocationSchema', () => {
  it('keeps only the prize id and name', () => {
    expect(
      sweepstakesAllocationSchema.parse({
        prize: { id: 'p1', name: 'Prize', quota: 3 }
      })
    ).toEqual({ prize: { id: 'p1', name: 'Prize' } });
  });
});

describe('allocatePrizeRequestSchema', () => {
  it('accepts a participant and prize id', () => {
    expect(
      allocatePrizeRequestSchema.parse({ participantId: 'u1', prizeId: 'p1' })
    ).toEqual({ participantId: 'u1', prizeId: 'p1' });
  });

  it('requires both ids', () => {
    expect(pathsOf(allocatePrizeRequestSchema.safeParse({}))).toEqual([
      ['participantId'],
      ['prizeId']
    ]);
  });
});
