import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_ALLOW_USER_SELECTION,
  DEFAULT_ALLOWED_USER_SOURCES,
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_DESIGN_DATA,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_GRADIENT_DESIGN_BACKGROUND,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND,
  DEFAULT_SPONSOR_NAME,
  DEFAULT_SWEEPSTAKES_AUDIENCE,
  DEFAULT_SWEEPSTAKES_DESCRIPTION,
  DEFAULT_SWEEPSTAKES_DESIGN,
  DEFAULT_SWEEPSTAKES_DETAILS,
  DEFAULT_SWEEPSTAKES_PRIZE_NAME,
  DEFAULT_SWEEPSTAKES_PRIZE_QUOTA,
  DEFAULT_SWEEPSTAKES_PRIZES,
  DEFAULT_SWEEPSTAKES_TASKS,
  DEFAULT_SWEEPSTAKES_TERMS,
  DEFAULT_SWEEPSTAKES_VISIBILITY,
  DEFAULT_SWEEPSTAKES_WINNER_CRITERIA,
  DEFAULT_WINNER_SELECTION_METHOD
} from '../defaults';
import {
  giveawayDesignSchema,
  gradientBackgroundSchema,
  prizeSchema,
  solidColorBackgroundSchema,
  sweepstakesWinnerCriteriaSchema,
  termsTemplateSchema
} from '../schemas';
import { allowedUserSourcesSchema } from '@giveaway/user-source-model/schemas';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import { DEFAULT_MINIMUM_AGE_FIELD } from '@giveaway/custom-fields-model/defaults';

describe('scalar defaults', () => {
  it('exposes the default sweepstakes copy', () => {
    expect({
      description: DEFAULT_SWEEPSTAKES_DESCRIPTION,
      prizeName: DEFAULT_SWEEPSTAKES_PRIZE_NAME,
      sponsorName: DEFAULT_SPONSOR_NAME,
      winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD
    }).toEqual({
      description: 'Enter to win a prize!',
      prizeName: 'My Custom Prize',
      sponsorName: 'Giveaway Sponsor',
      winnerSelectionMethod: 'Random Drawing'
    });
  });

  it('exposes the default numeric and boolean settings', () => {
    expect({
      prizeQuota: DEFAULT_SWEEPSTAKES_PRIZE_QUOTA,
      notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
      claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
      governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
      minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
      minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
      allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
      allowUserSelection: DEFAULT_ALLOW_USER_SELECTION
    }).toEqual({
      prizeQuota: 1,
      notificationTimeframeDays: 7,
      claimDeadlineDays: 7,
      governingLawCountry: 'USA',
      minQualityScore: 50,
      minTasksCompleted: 1,
      allowMultipleWins: false,
      allowUserSelection: false
    });
  });

  it('uses a prize name and quota that satisfy the prize schema', () => {
    expect(
      prizeSchema.safeParse({
        id: 'prize-1',
        name: DEFAULT_SWEEPSTAKES_PRIZE_NAME,
        quota: DEFAULT_SWEEPSTAKES_PRIZE_QUOTA
      }).success
    ).toBe(true);
  });

  it('uses a different minimum quality score than the winner criteria schema default', () => {
    expect(sweepstakesWinnerCriteriaSchema.parse({}).minQualityScore).toBe(70);
    expect(DEFAULT_MIN_QUALITY_SCORE).toBe(50);
  });
});

describe('DEFAULT_ALLOWED_USER_SOURCES', () => {
  it('allows only twitter imports', () => {
    expect(DEFAULT_ALLOWED_USER_SOURCES).toEqual(['TWITTER_IMPORT']);
  });

  it('satisfies the allowed user sources schema', () => {
    expect(
      allowedUserSourcesSchema.safeParse(DEFAULT_ALLOWED_USER_SOURCES).success
    ).toBe(true);
  });
});

describe('DEFAULT_SWEEPSTAKES_DETAILS', () => {
  it('uses the default name and description', () => {
    expect(DEFAULT_SWEEPSTAKES_DETAILS).toEqual({
      name: 'Untitled Sweepstakes',
      description: 'Enter to win a prize!'
    });
  });
});

describe('DEFAULT_SWEEPSTAKES_TIMING', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const loadAt = async (now: Date) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    vi.resetModules();
    const defaults = await import('../defaults');
    return defaults.DEFAULT_SWEEPSTAKES_TIMING;
  };

  it('starts at the beginning of the next local day', async () => {
    const timing = await loadAt(new Date(2026, 9, 1, 15, 30));

    expect(timing.startDate).toEqual(new Date(2026, 9, 2));
  });

  it('ends at the beginning of the local day one week after the start', async () => {
    const timing = await loadAt(new Date(2026, 9, 1, 15, 30));

    expect(timing.endDate).toEqual(new Date(2026, 9, 9));
  });

  it('rolls over month boundaries', async () => {
    const timing = await loadAt(new Date(2026, 0, 31, 23, 59));

    expect([timing.startDate, timing.endDate]).toEqual([
      new Date(2026, 1, 1),
      new Date(2026, 1, 8)
    ]);
  });

  it('uses the runtime time zone', async () => {
    vi.stubEnv('TZ', 'America/New_York');

    const timing = await loadAt(new Date('2026-10-01T15:30:00.000Z'));

    expect(timing).toEqual({
      startDate: new Date('2026-10-02T04:00:00.000Z'),
      endDate: new Date('2026-10-09T04:00:00.000Z'),
      timeZone: 'America/New_York'
    });
  });
});

describe('DEFAULT_SWEEPSTAKES_TERMS', () => {
  it('uses the template terms with the default values', () => {
    expect(DEFAULT_SWEEPSTAKES_TERMS).toEqual({
      type: 'TEMPLATE',
      sponsorAddress: '',
      sponsorName: 'Giveaway Sponsor',
      winnerSelectionMethod: 'Random Drawing',
      notificationTimeframeDays: 7,
      claimDeadlineDays: 7,
      governingLawCountry: 'USA',
      privacyPolicyUrl: ''
    });
  });

  it('satisfies the terms template schema', () => {
    expect(
      termsTemplateSchema.safeParse(DEFAULT_SWEEPSTAKES_TERMS).success
    ).toBe(true);
  });
});

describe('DEFAULT_SWEEPSTAKES_AUDIENCE', () => {
  it('allows the default identities without requiring pre-entry login', () => {
    expect(DEFAULT_SWEEPSTAKES_AUDIENCE.requirePreEntryLogin).toBe(false);
    expect(DEFAULT_SWEEPSTAKES_AUDIENCE.allowedIdentities).toBe(
      DEFAULT_ALLOWED_IDENTITIES
    );
  });

  it('creates username, email, and minimum age form fields', () => {
    expect(DEFAULT_SWEEPSTAKES_AUDIENCE.formFields).toEqual({
      createMany: {
        data: [
          { type: 'USERNAME', label: 'Username', required: true },
          { label: 'Email', type: 'EMAIL' },
          DEFAULT_MINIMUM_AGE_FIELD
        ]
      }
    });
  });

  it('uses a minimum age field for 16 year olds', () => {
    expect(DEFAULT_MINIMUM_AGE_FIELD).toEqual({
      minimum: 16,
      maximum: null,
      type: 'AGE',
      label: 'I am at least 16 years of age (required)',
      required: true
    });
  });
});

describe('prize and task defaults', () => {
  it('starts with no prizes', () => {
    expect(DEFAULT_SWEEPSTAKES_PRIZES).toEqual([]);
  });

  it('starts with no tasks', () => {
    expect(DEFAULT_SWEEPSTAKES_TASKS).toEqual([]);
  });
});

describe('design defaults', () => {
  it('uses the secondary color as the solid background', () => {
    expect(DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND).toEqual({
      type: 'color',
      color: '#edf0f4'
    });
  });

  it('uses a valid solid background', () => {
    expect(
      solidColorBackgroundSchema.safeParse(
        DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
      ).success
    ).toBe(true);
  });

  it('uses a linear purple gradient', () => {
    expect(DEFAULT_GRADIENT_DESIGN_BACKGROUND).toEqual({
      type: 'gradient',
      format: 'linear',
      angle: 135,
      stops: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 }
      ]
    });
  });

  it('uses a valid gradient background', () => {
    expect(
      gradientBackgroundSchema.safeParse(DEFAULT_GRADIENT_DESIGN_BACKGROUND)
        .success
    ).toBe(true);
  });

  it('shows the name and description on a video aspect ratio with the solid background', () => {
    expect(DEFAULT_DESIGN_DATA).toEqual({
      displayName: true,
      displayDescription: true,
      aspectRatio: 'VIDEO',
      background: DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
    });
    expect(DEFAULT_DESIGN_DATA.background).toBe(
      DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
    );
  });

  it('uses design data that satisfies the design schema', () => {
    expect(giveawayDesignSchema.safeParse(DEFAULT_DESIGN_DATA).success).toBe(
      true
    );
  });

  it('stores the default design data on the design record', () => {
    expect(DEFAULT_SWEEPSTAKES_DESIGN).toEqual({ data: DEFAULT_DESIGN_DATA });
    expect(DEFAULT_SWEEPSTAKES_DESIGN.data).toBe(DEFAULT_DESIGN_DATA);
  });
});

describe('DEFAULT_SWEEPSTAKES_VISIBILITY', () => {
  it('is unlisted without a slug', () => {
    expect(DEFAULT_SWEEPSTAKES_VISIBILITY).toEqual({
      slug: null,
      visibility: 'UNLISTED'
    });
  });
});

describe('DEFAULT_SWEEPSTAKES_WINNER_CRITERIA', () => {
  it('uses the default criteria without the user selection flag', () => {
    expect(DEFAULT_SWEEPSTAKES_WINNER_CRITERIA).toEqual({
      minQualityScore: 50,
      minTasksCompleted: 1,
      allowMultipleWins: false
    });
  });
});
