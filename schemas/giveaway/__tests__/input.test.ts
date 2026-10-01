import { describe, it, expect, vi, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { toDesignInput, toSweepstakesInput, toTaskInput } from '../input';
import type { FormSweepstakesGetPayload } from '../db';
import { DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND } from '../defaults';
import { DEFAULT_ALLOWED_IDENTITIES } from '@/lib/settings';
import { ApplicationError } from '@/lib/errors';

type Payload = FormSweepstakesGetPayload;
type Task = Payload['tasks'][number];
type Design = NonNullable<Payload['design']>;
type FormField = NonNullable<Payload['audience']>['formFields'][number];

const NOW = new Date(2026, 9, 1, 15, 30);

const task = (id: string, config: Prisma.JsonValue): Task => ({
  id,
  sweepstakesId: 'sweep-1',
  index: 0,
  config
});

const design = (data: Prisma.JsonValue): Design => ({
  id: 'design-1',
  sweepstakesId: 'sweep-1',
  data
});

const formField = (overrides: Partial<FormField> = {}): FormField => ({
  id: 'field-1',
  audienceId: 'audience-1',
  label: 'Username',
  type: 'USERNAME',
  required: true,
  placeholder: '@you',
  minimum: null,
  maximum: null,
  index: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides
});

const emptyPayload = (overrides: Partial<Payload> = {}): Payload => ({
  id: 'sweep-1',
  status: 'DRAFT',
  teamId: 'team-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  tasks: [],
  prizes: [],
  audience: null,
  terms: null,
  timing: null,
  details: null,
  design: null,
  visibility: null,
  criteria: null,
  ...overrides
});

const fullPayload = (): Payload =>
  emptyPayload({
    details: {
      id: 'details-1',
      sweepstakesId: 'sweep-1',
      name: 'My Giveaway',
      description: 'Win stuff',
      banner: 'https://example.com/banner.png'
    },
    terms: {
      id: 'terms-1',
      sweepstakesId: 'sweep-1',
      type: 'TEMPLATE',
      sponsorName: 'Acme',
      sponsorAddress: '1 Main St',
      winnerSelectionMethod: 'Random Drawing',
      notificationTimeframeDays: 3,
      claimDeadlineDays: 5,
      maxEntriesPerUser: 10,
      governingLawCountry: 'USA',
      privacyPolicyUrl: 'https://example.com/privacy',
      additionalTerms: 'More terms',
      text: 'Custom text'
    },
    audience: {
      id: 'audience-1',
      sweepstakesId: 'sweep-1',
      allowedIdentities: ['EMAIL', 'GOOGLE'],
      requirePreEntryLogin: true,
      requireEmail: null,
      regionalRestriction: {
        id: 'region-1',
        audienceId: 'audience-1',
        filter: 'EXCLUDE',
        regions: ['country:US']
      },
      minimumAgeRestriction: null,
      formFields: [formField()]
    },
    timing: {
      id: 'timing-1',
      sweepstakesId: 'sweep-1',
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      endDate: new Date('2026-11-08T00:00:00.000Z'),
      timeZone: 'Europe/Paris'
    },
    prizes: [
      {
        id: 'prize-1',
        sweepstakesId: 'sweep-1',
        name: 'Prize',
        index: 0,
        quota: 2
      }
    ],
    tasks: [
      task('task-1', {
        type: 'BONUS_TASK',
        title: 'Bonus',
        value: 1,
        mandatory: false,
        tasksRequired: 0
      })
    ],
    design: design({
      aspectRatio: 'NONE',
      displayName: false,
      displayDescription: false,
      background: { type: 'color', color: '#123456' }
    }),
    visibility: {
      id: 'visibility-1',
      sweepstakesId: 'sweep-1',
      visibility: 'PUBLIC',
      slug: 'my-giveaway',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z')
    },
    criteria: {
      id: 'criteria-1',
      sweepstakesId: 'sweep-1',
      minTasksCompleted: 2,
      minQualityScore: 80,
      allowMultipleWins: true,
      allowUserSelection: true,
      externalPlatforms: ['TWITTER_IMPORT']
    }
  });

describe('toSweepstakesInput', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  describe('when every relation is stored', () => {
    it('maps the stored sweepstakes into form input', () => {
      expect(toSweepstakesInput(fullPayload())).toEqual({
        setup: {
          name: 'My Giveaway',
          banner: 'https://example.com/banner.png',
          description: 'Win stuff'
        },
        terms: {
          type: 'TEMPLATE',
          sponsorName: 'Acme',
          sponsorAddress: '1 Main St',
          winnerSelectionMethod: 'Random Drawing',
          notificationTimeframeDays: 3,
          claimDeadlineDays: 5,
          maxEntriesPerUser: 10,
          governingLawCountry: 'USA',
          privacyPolicyUrl: 'https://example.com/privacy',
          additionalTerms: 'More terms',
          text: 'Custom text'
        },
        audience: {
          allowedIdentities: ['EMAIL', 'GOOGLE'],
          regionalRestriction: { regions: ['country:US'], filter: 'EXCLUDE' },
          requirePreEntryLogin: true,
          formFields: [
            {
              id: 'field-1',
              label: 'Username',
              type: 'USERNAME',
              required: true,
              placeholder: '@you',
              minimum: undefined,
              maximum: undefined,
              index: 0
            }
          ]
        },
        timing: {
          startDate: new Date('2026-11-01T00:00:00.000Z'),
          endDate: new Date('2026-11-08T00:00:00.000Z'),
          timeZone: 'Europe/Paris'
        },
        prizes: [{ id: 'prize-1', name: 'Prize', quota: 2 }],
        tasks: [
          {
            id: 'task-1',
            type: 'BONUS_TASK',
            title: 'Bonus',
            value: 1,
            mandatory: false,
            tasksRequired: 0
          }
        ],
        design: {
          aspectRatio: 'NONE',
          displayName: false,
          displayDescription: false,
          background: { type: 'color', color: '#123456' }
        },
        visibility: { visibility: 'PUBLIC', slug: 'my-giveaway' },
        criteria: {
          minQualityScore: 80,
          minTasksCompleted: 2,
          allowMultipleWins: true,
          allowUserSelection: true,
          externalPlatforms: ['TWITTER_IMPORT']
        }
      });
    });

    it('copies the stored timing dates instead of reusing them', () => {
      const payload = fullPayload();

      const input = toSweepstakesInput(payload);

      expect(input.timing?.startDate).not.toBe(payload.timing?.startDate);
      expect(input.timing?.endDate).not.toBe(payload.timing?.endDate);
    });
  });

  describe('when no relation is stored', () => {
    it('falls back to empty and default values', () => {
      vi.stubEnv('TZ', 'Asia/Tokyo');
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-01T06:30:00.000Z'));

      expect(toSweepstakesInput(emptyPayload())).toEqual({
        setup: { name: undefined, banner: undefined, description: undefined },
        terms: {
          type: undefined,
          sponsorName: undefined,
          sponsorAddress: undefined,
          winnerSelectionMethod: undefined,
          notificationTimeframeDays: undefined,
          claimDeadlineDays: undefined,
          maxEntriesPerUser: undefined,
          governingLawCountry: undefined,
          privacyPolicyUrl: undefined,
          additionalTerms: undefined,
          text: undefined
        },
        audience: {
          allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
          regionalRestriction: undefined,
          requirePreEntryLogin: false,
          formFields: []
        },
        timing: {
          startDate: new Date('2026-10-01T15:00:00.000Z'),
          endDate: new Date('2026-10-08T15:00:00.000Z'),
          timeZone: 'Asia/Tokyo'
        },
        prizes: [],
        tasks: [],
        design: undefined,
        visibility: { visibility: 'PRIVATE', slug: null },
        criteria: {
          minQualityScore: 50,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: false,
          externalPlatforms: null
        }
      });
    });
  });

  describe('setup and terms', () => {
    it('turns null details fields into undefined', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          details: {
            id: 'd',
            sweepstakesId: 'sweep-1',
            name: null,
            description: 'Only a description',
            banner: null
          }
        })
      );

      expect(input.setup).toEqual({
        name: undefined,
        banner: undefined,
        description: 'Only a description'
      });
    });

    it('turns null terms fields into undefined', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          terms: {
            id: 't',
            sweepstakesId: 'sweep-1',
            type: 'CUSTOM',
            sponsorName: null,
            sponsorAddress: null,
            winnerSelectionMethod: null,
            notificationTimeframeDays: null,
            claimDeadlineDays: null,
            maxEntriesPerUser: null,
            governingLawCountry: null,
            privacyPolicyUrl: null,
            additionalTerms: null,
            text: 'Custom'
          }
        })
      );

      expect(input.terms).toEqual({
        type: 'CUSTOM',
        sponsorName: undefined,
        sponsorAddress: undefined,
        winnerSelectionMethod: undefined,
        notificationTimeframeDays: undefined,
        claimDeadlineDays: undefined,
        maxEntriesPerUser: undefined,
        governingLawCountry: undefined,
        privacyPolicyUrl: undefined,
        additionalTerms: undefined,
        text: 'Custom'
      });
    });
  });

  describe('audience', () => {
    const audience = (
      overrides: Partial<NonNullable<Payload['audience']>> = {}
    ): Payload['audience'] => ({
      id: 'audience-1',
      sweepstakesId: 'sweep-1',
      allowedIdentities: ['EMAIL'],
      requirePreEntryLogin: null,
      requireEmail: null,
      regionalRestriction: null,
      minimumAgeRestriction: null,
      formFields: [],
      ...overrides
    });

    it('keeps an empty allowed identities list instead of using the defaults', () => {
      const input = toSweepstakesInput(
        emptyPayload({ audience: audience({ allowedIdentities: [] }) })
      );

      expect(input.audience?.allowedIdentities).toEqual([]);
    });

    it('treats a null requirePreEntryLogin as false', () => {
      const input = toSweepstakesInput(emptyPayload({ audience: audience() }));

      expect(input.audience?.requirePreEntryLogin).toBe(false);
    });

    it('drops a null regional restriction filter', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          audience: audience({
            regionalRestriction: {
              id: 'r',
              audienceId: 'audience-1',
              filter: null,
              regions: ['continent:EU']
            }
          })
        })
      );

      expect(input.audience?.regionalRestriction).toEqual({
        regions: ['continent:EU'],
        filter: undefined
      });
    });

    it('defaults missing regional restriction regions to an empty list', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          audience: audience({
            regionalRestriction: {
              id: 'r',
              audienceId: 'audience-1',
              filter: 'INCLUDE',
              regions: null
            } as unknown as NonNullable<
              Payload['audience']
            >['regionalRestriction']
          })
        })
      );

      expect(input.audience?.regionalRestriction).toEqual({
        regions: [],
        filter: 'INCLUDE'
      });
    });

    it('maps null form field values to undefined and a null required flag to false', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          audience: audience({
            formFields: [
              formField({
                id: 'field-2',
                label: null,
                type: null,
                required: null,
                placeholder: null,
                minimum: null,
                maximum: null,
                index: null
              })
            ]
          })
        })
      );

      expect(input.audience?.formFields).toEqual([
        {
          id: 'field-2',
          label: undefined,
          type: undefined,
          required: false,
          placeholder: undefined,
          minimum: undefined,
          maximum: undefined,
          index: undefined
        }
      ]);
    });

    it('maps a null form field id to undefined', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          audience: audience({
            formFields: [formField({ id: null as unknown as string })]
          })
        })
      );

      expect(input.audience?.formFields?.[0]?.id).toBeUndefined();
    });

    it('keeps the minimum and maximum of an age field', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          audience: audience({
            formFields: [
              formField({ type: 'AGE', minimum: 18, maximum: 99, index: 2 })
            ]
          })
        })
      );

      expect(input.audience?.formFields?.[0]).toMatchObject({
        type: 'AGE',
        minimum: 18,
        maximum: 99,
        index: 2
      });
    });

    it('maps missing form fields to an empty list', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          audience: audience({
            formFields: undefined as unknown as FormField[]
          })
        })
      );

      expect(input.audience?.formFields).toEqual([]);
    });
  });

  describe('timing', () => {
    const timing = (
      overrides: Partial<NonNullable<Payload['timing']>>
    ): Payload['timing'] => ({
      id: 'timing-1',
      sweepstakesId: 'sweep-1',
      startDate: null,
      endDate: null,
      timeZone: null,
      ...overrides
    });

    it('defaults a missing start date to the start of tomorrow', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);

      const input = toSweepstakesInput(
        emptyPayload({
          timing: timing({ endDate: new Date('2026-12-01T00:00:00.000Z') })
        })
      );

      expect(input.timing?.startDate).toEqual(new Date(2026, 9, 2));
      expect(input.timing?.endDate).toEqual(
        new Date('2026-12-01T00:00:00.000Z')
      );
    });

    it('defaults a missing end date to the start of the day eight days from now', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);

      const input = toSweepstakesInput(
        emptyPayload({
          timing: timing({ startDate: new Date('2026-12-01T00:00:00.000Z') })
        })
      );

      expect(input.timing?.endDate).toEqual(new Date(2026, 9, 9));
    });

    it('uses the runtime time zone when the stored time zone is empty', () => {
      vi.stubEnv('TZ', 'America/Chicago');

      const input = toSweepstakesInput(
        emptyPayload({ timing: timing({ timeZone: '' }) })
      );

      expect(input.timing?.timeZone).toBe('America/Chicago');
    });
  });

  describe('prizes and tasks', () => {
    it('maps null prize fields to undefined', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          prizes: [
            {
              id: 'prize-1',
              sweepstakesId: 'sweep-1',
              name: null,
              index: null,
              quota: null
            }
          ]
        })
      );

      expect(input.prizes).toEqual([
        { id: 'prize-1', name: undefined, quota: undefined }
      ]);
    });

    it('maps a null prize id to undefined', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          prizes: [
            {
              id: null as unknown as string,
              sweepstakesId: 'sweep-1',
              name: 'Prize',
              index: 0,
              quota: 1
            }
          ]
        })
      );

      expect(input.prizes).toEqual([
        { id: undefined, name: 'Prize', quota: 1 }
      ]);
    });

    it('maps missing prizes to an empty list', () => {
      const input = toSweepstakesInput(
        emptyPayload({ prizes: null as unknown as Payload['prizes'] })
      );

      expect(input.prizes).toEqual([]);
    });

    it('maps missing tasks to an empty list', () => {
      const input = toSweepstakesInput(
        emptyPayload({ tasks: null as unknown as Payload['tasks'] })
      );

      expect(input.tasks).toEqual([]);
    });

    it('drops empty task entries', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          tasks: [
            null as unknown as Task,
            task('task-2', { type: 'VISIT_URL' })
          ]
        })
      );

      expect(input.tasks).toEqual([{ id: 'task-2', type: 'VISIT_URL' }]);
    });
  });

  describe('visibility', () => {
    const visibility = (
      overrides: Partial<NonNullable<Payload['visibility']>>
    ): Payload['visibility'] => ({
      id: 'visibility-1',
      sweepstakesId: 'sweep-1',
      visibility: 'UNLISTED',
      slug: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides
    });

    it('keeps the stored visibility with a null slug', () => {
      const input = toSweepstakesInput(
        emptyPayload({ visibility: visibility({}) })
      );

      expect(input.visibility).toEqual({ visibility: 'UNLISTED', slug: null });
    });

    it('defaults a missing visibility value to PRIVATE', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          visibility: visibility({
            visibility: null as unknown as 'PUBLIC',
            slug: 'slug'
          })
        })
      );

      expect(input.visibility).toEqual({ visibility: 'PRIVATE', slug: 'slug' });
    });
  });

  describe('criteria', () => {
    const criteria = (
      overrides: Partial<NonNullable<Payload['criteria']>>
    ): Payload['criteria'] => ({
      id: 'criteria-1',
      sweepstakesId: 'sweep-1',
      minTasksCompleted: null,
      minQualityScore: null,
      allowMultipleWins: false,
      allowUserSelection: false,
      externalPlatforms: null,
      ...overrides
    });

    it('defaults null criteria values', () => {
      const input = toSweepstakesInput(
        emptyPayload({
          criteria: criteria({
            allowMultipleWins: null as unknown as boolean,
            allowUserSelection: null as unknown as boolean
          })
        })
      );

      expect(input.criteria).toEqual({
        minQualityScore: 50,
        minTasksCompleted: 1,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: null
      });
    });

    it('keeps a minimum quality score of zero', () => {
      const input = toSweepstakesInput(
        emptyPayload({ criteria: criteria({ minQualityScore: 0 }) })
      );

      expect(input.criteria?.minQualityScore).toBe(0);
    });

    it('throws a validation error for malformed external platforms', () => {
      const payload = emptyPayload({
        criteria: criteria({ externalPlatforms: ['MYSPACE_IMPORT'] })
      });

      expect(() => toSweepstakesInput(payload)).toThrow(ApplicationError);
      expect(() => toSweepstakesInput(payload)).toThrow(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Invalid external platforms format'
        })
      );
    });
  });
});

describe('toTaskInput', () => {
  it('returns undefined for a missing task', () => {
    expect(toTaskInput(null as unknown as Task)).toBeUndefined();
  });

  it('spreads the stored config and adds the task id', () => {
    expect(
      toTaskInput(task('task-1', { type: 'BONUS_TASK', value: 3 }))
    ).toEqual({ type: 'BONUS_TASK', value: 3, id: 'task-1' });
  });

  it('overrides an id stored in the config with the task id', () => {
    expect(toTaskInput(task('task-1', { id: 'stale', type: 'X' }))).toEqual({
      id: 'task-1',
      type: 'X'
    });
  });

  it.each<[string, Prisma.JsonValue]>([
    ['null', null],
    ['an array', [1, 2]],
    ['a string', 'config'],
    ['a number', 7]
  ])('returns only the id when the config is %s', (_, config) => {
    expect(toTaskInput(task('task-1', config))).toEqual({ id: 'task-1' });
  });

  it('does not validate the task config', () => {
    expect(toTaskInput(task('task-1', { type: 'UNKNOWN', title: '' }))).toEqual(
      { id: 'task-1', type: 'UNKNOWN', title: '' }
    );
  });
});

describe('toDesignInput', () => {
  it('returns undefined when no design is stored', () => {
    expect(toDesignInput(null)).toBeUndefined();
  });

  it('applies display and aspect ratio defaults to empty design data', () => {
    expect(toDesignInput(design(null))).toEqual({
      aspectRatio: 'VIDEO',
      displayName: true,
      displayDescription: true,
      background: DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
    });
  });

  it('falls back to VIDEO for an unknown aspect ratio', () => {
    expect(toDesignInput(design({ aspectRatio: 'SQUARE' }))?.aspectRatio).toBe(
      'VIDEO'
    );
  });

  it('keeps explicit false display flags', () => {
    expect(
      toDesignInput(design({ displayName: false, displayDescription: false }))
    ).toMatchObject({ displayName: false, displayDescription: false });
  });

  it('returns the shared default background for an unknown background type', () => {
    expect(
      toDesignInput(design({ background: { type: 'image' } }))?.background
    ).toBe(DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND);
  });

  it('keeps a stored color background', () => {
    expect(
      toDesignInput(design({ background: { type: 'color', color: '#abc' } }))
        ?.background
    ).toEqual({ type: 'color', color: '#abc' });
  });

  it('fills a color background without a color with the default color', () => {
    expect(
      toDesignInput(design({ background: { type: 'color' } }))?.background
    ).toEqual({ type: 'color', color: '#edf0f4' });
  });

  it('keeps a complete gradient background', () => {
    const background = {
      type: 'gradient',
      format: 'radial',
      angle: 0,
      stops: [{ color: '#111111', position: 25 }]
    };

    expect(toDesignInput(design({ background }))?.background).toEqual(
      background
    );
  });

  it('fills a gradient background with defaults for missing values', () => {
    expect(
      toDesignInput(
        design({
          background: {
            type: 'gradient',
            angle: '45',
            stops: [{}, { color: '#fff', position: '10' }]
          }
        })
      )?.background
    ).toEqual({
      type: 'gradient',
      format: 'linear',
      stops: [
        { color: '#000000', position: 0 },
        { color: '#fff', position: 0 }
      ],
      angle: 90
    });
  });

  it('uses an empty list for gradient stops that are not an array', () => {
    expect(
      toDesignInput(
        design({ background: { type: 'gradient', stops: { color: '#fff' } } })
      )?.background
    ).toMatchObject({ stops: [] });
  });
});
