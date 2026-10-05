import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Prisma } from '@giveaway/db-model';
import { castArray } from 'lodash';
import {
  toStorableCriteria,
  toStorableSweepstakes,
  toStorableSweepstakesUpdate,
  toStorableTask,
  toStorableTasks,
  toStorableVisibility,
  type StorableTaskSchema
} from '../storable';
import type {
  SweepstakesInputFormFieldSchema,
  SweepstakesInputPrizeSchema,
  SweepstakesInputSchema,
  SweepstakesInputTaskSchema,
  TeamSweepstakesGetPayload
} from '../db';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';

type Input = Omit<SweepstakesInputSchema, 'id'>;

const NOW = new Date('2026-10-01T12:00:00.000Z');

const importTask: SweepstakesInputTaskSchema = {
  id: 'task-import',
  type: 'TWITTER_RETWEET_IMPORT_V2',
  title: 'Repost',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  tweetId: 'https://x.com/acme/status/1'
};

const bonusTask: SweepstakesInputTaskSchema = {
  id: 'task-bonus',
  type: 'BONUS_TASK',
  title: 'Bonus',
  value: 2,
  mandatory: true,
  tasksRequired: 0
};

const audienceOf = (
  input: Input,
  status?: Parameters<typeof toStorableTasks>[1]
) => toStorableSweepstakesUpdate(input, status).audience?.create;

const formFieldsOf = (formFields: SweepstakesInputFormFieldSchema[]) => {
  const data = audienceOf({ audience: { formFields } })?.formFields?.createMany
    ?.data;
  return data && castArray(data);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toStorableSweepstakesUpdate', () => {
  describe('when the input is empty', () => {
    it('always creates details and timing and leaves every other relation undefined', () => {
      expect(toStorableSweepstakesUpdate({})).toEqual({
        details: {
          create: { name: undefined, description: undefined, banner: undefined }
        },
        timing: {
          create: {
            startDate: undefined,
            endDate: undefined,
            timeZone: undefined
          }
        },
        terms: undefined,
        audience: undefined,
        prizes: undefined,
        tasks: undefined,
        design: undefined,
        visibility: undefined,
        criteria: undefined
      });
    });
  });

  describe('when the input is complete', () => {
    it('maps every section into nested create inputs', () => {
      const startDate = new Date('2026-11-01T00:00:00.000Z');
      const endDate = new Date('2026-11-08T00:00:00.000Z');

      const result = toStorableSweepstakesUpdate(
        {
          setup: { name: 'Giveaway', description: 'Win', banner: 'b.png' },
          timing: { startDate, endDate, timeZone: 'UTC' },
          terms: { type: 'CUSTOM', text: 'Terms' },
          audience: {
            allowedIdentities: ['EMAIL'],
            requirePreEntryLogin: true,
            regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' },
            formFields: [{ id: 'f1', label: 'Email', type: 'EMAIL' }]
          },
          prizes: [{ id: 'p1', name: 'Prize', quota: 3 }],
          tasks: [bonusTask],
          design: {
            aspectRatio: 'NONE',
            displayName: true,
            displayDescription: true,
            background: { type: 'color', color: '#fff' }
          },
          visibility: { visibility: 'PUBLIC', slug: 'giveaway' },
          criteria: {
            minTasksCompleted: 2,
            minQualityScore: 60,
            allowMultipleWins: true,
            allowUserSelection: true,
            externalPlatforms: ['TWITTER_IMPORT']
          }
        },
        'DRAFT'
      );

      expect(result).toEqual({
        details: {
          create: { name: 'Giveaway', description: 'Win', banner: 'b.png' }
        },
        timing: { create: { startDate, endDate, timeZone: 'UTC' } },
        terms: { create: { type: 'CUSTOM', text: 'Terms' } },
        audience: {
          create: {
            allowedIdentities: ['EMAIL'],
            requirePreEntryLogin: true,
            regionalRestriction: {
              create: { filter: 'INCLUDE', regions: ['country:US'] }
            },
            formFields: {
              createMany: {
                data: [
                  {
                    id: 'f1',
                    label: 'Email',
                    type: 'EMAIL',
                    placeholder: undefined,
                    index: 0
                  }
                ]
              }
            }
          }
        },
        prizes: {
          createMany: {
            data: [{ id: 'p1', index: 0, name: 'Prize', quota: 3 }]
          }
        },
        tasks: {
          create: [
            {
              id: 'task-bonus',
              index: 0,
              config: {
                type: 'BONUS_TASK',
                title: 'Bonus',
                value: 2,
                mandatory: true,
                tasksRequired: 0
              },
              jobs: { create: [] }
            }
          ]
        },
        design: {
          create: {
            data: {
              aspectRatio: 'NONE',
              displayName: true,
              displayDescription: true,
              background: { type: 'color', color: '#fff' }
            }
          }
        },
        visibility: { create: { visibility: 'PUBLIC', slug: 'giveaway' } },
        criteria: {
          create: {
            minTasksCompleted: 2,
            minQualityScore: 60,
            allowMultipleWins: true,
            allowUserSelection: true,
            externalPlatforms: ['TWITTER_IMPORT']
          }
        }
      });
    });
  });

  describe('terms', () => {
    it('leaves terms undefined when the type is missing', () => {
      expect(
        toStorableSweepstakesUpdate({ terms: { sponsorName: 'Acme' } }).terms
      ).toBeUndefined();
    });

    it('stores every template field for TEMPLATE terms', () => {
      expect(
        toStorableSweepstakesUpdate({
          terms: {
            type: 'TEMPLATE',
            sponsorName: 'Acme',
            sponsorAddress: '1 Main St',
            winnerSelectionMethod: 'Random',
            notificationTimeframeDays: 3,
            maxEntriesPerUser: 5,
            claimDeadlineDays: 4,
            governingLawCountry: 'USA',
            privacyPolicyUrl: 'https://example.com/privacy',
            additionalTerms: 'More'
          }
        }).terms
      ).toEqual({
        create: {
          type: 'TEMPLATE',
          sponsorName: 'Acme',
          sponsorAddress: '1 Main St',
          winnerSelectionMethod: 'Random',
          notificationTimeframeDays: 3,
          maxEntriesPerUser: 5,
          claimDeadlineDays: 4,
          governingLawCountry: 'USA',
          privacyPolicyUrl: 'https://example.com/privacy',
          additionalTerms: 'More'
        }
      });
    });

    it('stores only the type and text for CUSTOM terms', () => {
      expect(
        toStorableSweepstakesUpdate({
          terms: {
            type: 'CUSTOM',
            text: 'Custom',
            sponsorName: 'ignored'
          } as Input['terms']
        }).terms
      ).toEqual({ create: { type: 'CUSTOM', text: 'Custom' } });
    });

    it('throws for an unknown terms type', () => {
      expect(() =>
        toStorableSweepstakesUpdate({
          terms: { type: 'LEGAL' } as unknown as Input['terms']
        })
      ).toThrow('Unexpected value: LEGAL');
    });
  });

  describe('audience', () => {
    it('applies the identity, login, restriction, and form field defaults', () => {
      expect(audienceOf({ audience: {} })).toEqual({
        allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
        requirePreEntryLogin: false,
        regionalRestriction: undefined,
        formFields: undefined
      });
    });

    it('keeps an empty allowed identities list', () => {
      expect(
        audienceOf({ audience: { allowedIdentities: [] } })?.allowedIdentities
      ).toEqual([]);
    });

    it('stores a regional restriction even when its fields are missing', () => {
      expect(
        audienceOf({ audience: { regionalRestriction: {} } })
          ?.regionalRestriction
      ).toEqual({ create: { filter: undefined, regions: undefined } });
    });

    it('creates no form fields from an empty list', () => {
      expect(formFieldsOf([])).toEqual([]);
    });
  });

  describe('form fields', () => {
    it('stores an untyped field with only its id, label, and index', () => {
      expect(formFieldsOf([{ id: 'f1', label: 'Untyped' }])).toEqual([
        {
          id: 'f1',
          label: 'Untyped',
          type: undefined,
          required: undefined,
          index: 0,
          placeholder: undefined,
          minimum: undefined,
          maximum: undefined
        }
      ]);
    });

    it('stores a username field with its placeholder and a default required flag', () => {
      expect(
        formFieldsOf([
          { id: 'f1', label: 'User', type: 'USERNAME', placeholder: '@you' }
        ])
      ).toEqual([
        {
          id: 'f1',
          label: 'User',
          type: 'USERNAME',
          required: false,
          placeholder: '@you',
          index: 0
        }
      ]);
    });

    it('stores an email field without a required flag', () => {
      expect(
        formFieldsOf([
          {
            id: 'f1',
            label: 'Email',
            type: 'EMAIL',
            placeholder: 'you@example.com'
          }
        ])
      ).toEqual([
        {
          id: 'f1',
          label: 'Email',
          type: 'EMAIL',
          placeholder: 'you@example.com',
          index: 0
        }
      ]);
    });

    it('stores an age field with its limits and no placeholder', () => {
      expect(
        formFieldsOf([
          {
            id: 'f1',
            label: 'Age',
            type: 'AGE',
            required: true,
            minimum: 18,
            maximum: 99
          }
        ])
      ).toEqual([
        {
          id: 'f1',
          label: 'Age',
          type: 'AGE',
          required: true,
          minimum: 18,
          maximum: 99,
          index: 0
        }
      ]);
    });

    it('stores a twitter field with its placeholder and required flag', () => {
      expect(
        formFieldsOf([
          {
            id: 'f1',
            label: 'X',
            type: 'TWITTER',
            required: true,
            placeholder: 'https://x.com/you'
          }
        ])
      ).toEqual([
        {
          id: 'f1',
          label: 'X',
          type: 'TWITTER',
          required: true,
          placeholder: 'https://x.com/you',
          index: 0
        }
      ]);
    });

    it('keeps the required flag of a username field', () => {
      expect(
        formFieldsOf([{ id: 'f1', type: 'USERNAME', required: true }])?.[0]
          ?.required
      ).toBe(true);
    });

    it.each(['AGE', 'TWITTER'] as const)(
      'defaults the required flag of a %s field to false',
      (type) => {
        expect(formFieldsOf([{ id: 'f1', type }])?.[0]?.required).toBe(false);
      }
    );

    it('numbers the fields by their position in the list', () => {
      expect(
        formFieldsOf([
          { id: 'a', type: 'EMAIL' },
          { id: 'b', type: 'USERNAME' },
          { id: 'c' }
        ])?.map((field) => [field.id, field.index])
      ).toEqual([
        ['a', 0],
        ['b', 1],
        ['c', 2]
      ]);
    });

    it('throws for an unknown field type', () => {
      expect(() =>
        formFieldsOf([
          {
            id: 'f1',
            type: 'PHONE'
          } as unknown as SweepstakesInputFormFieldSchema
        ])
      ).toThrow('Unexpected value: PHONE');
    });
  });

  describe('prizes', () => {
    it('leaves prizes undefined for an empty list', () => {
      expect(
        toStorableSweepstakesUpdate({ prizes: [] }).prizes
      ).toBeUndefined();
    });

    it('leaves prizes undefined when no prize has an id', () => {
      expect(
        toStorableSweepstakesUpdate({ prizes: [{ name: 'No id' }, { id: '' }] })
          .prizes
      ).toBeUndefined();
    });

    it('drops empty and id-less prizes and renumbers the rest', () => {
      expect(
        toStorableSweepstakesUpdate({
          prizes: [
            null as unknown as SweepstakesInputPrizeSchema,
            { name: 'No id', quota: 1 },
            { id: 'p1', name: 'First', quota: 1 },
            { id: 'p2' }
          ]
        }).prizes
      ).toEqual({
        createMany: {
          data: [
            { id: 'p1', index: 0, name: 'First', quota: 1 },
            { id: 'p2', index: 1, name: undefined, quota: undefined }
          ]
        }
      });
    });
  });

  describe('design', () => {
    it('defaults the aspect ratio to VIDEO and the display flags to false', () => {
      expect(toStorableSweepstakesUpdate({ design: {} }).design).toEqual({
        create: {
          data: {
            aspectRatio: 'VIDEO',
            displayName: false,
            displayDescription: false,
            background: undefined
          }
        }
      });
    });

    it('stores the name and description display flags independently', () => {
      expect(
        toStorableSweepstakesUpdate({
          design: { displayName: true, displayDescription: false }
        }).design?.create?.data
      ).toMatchObject({ displayName: true, displayDescription: false });
    });
  });

  it('passes the status through to the task jobs', () => {
    expect(
      toStorableSweepstakesUpdate({ tasks: [importTask] }, 'ACTIVE').tasks
        ?.create
    ).toEqual([
      expect.objectContaining({
        jobs: { create: [{ runAt: NOW, data: { runs: 0 } }] }
      })
    ]);
  });
});

describe('toStorableTasks', () => {
  it('returns undefined when there are no tasks', () => {
    expect(toStorableTasks(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty list', () => {
    expect(toStorableTasks([])).toBeUndefined();
  });

  it('returns undefined when no task has an id', () => {
    expect(toStorableTasks([{ type: 'BONUS_TASK' }])).toBeUndefined();
  });

  it('drops empty and id-less tasks, renumbers the rest, and keeps the id out of the config', () => {
    expect(
      toStorableTasks([
        null as unknown as SweepstakesInputTaskSchema,
        { type: 'VISIT_URL' },
        bonusTask
      ])
    ).toEqual({
      create: [
        {
          id: 'task-bonus',
          index: 0,
          config: {
            type: 'BONUS_TASK',
            title: 'Bonus',
            value: 2,
            mandatory: true,
            tasksRequired: 0
          },
          jobs: { create: [] }
        }
      ]
    });
  });

  it('creates an import job for an import task when the sweepstakes is active', () => {
    expect(toStorableTasks([bonusTask, importTask], 'ACTIVE')?.create).toEqual([
      expect.objectContaining({ id: 'task-bonus', jobs: { create: [] } }),
      expect.objectContaining({
        id: 'task-import',
        index: 1,
        jobs: { create: [{ runAt: NOW, data: { runs: 0 } }] }
      })
    ]);
  });

  it.each(['DRAFT', 'COMPLETED', undefined] as const)(
    'creates no jobs when the status is %s',
    (status) => {
      expect(toStorableTasks([importTask], status)?.create).toEqual([
        expect.objectContaining({ jobs: { create: [] } })
      ]);
    }
  );
});

describe('toStorableTask', () => {
  const storable = (
    overrides: Partial<StorableTaskSchema> = {}
  ): StorableTaskSchema =>
    ({
      id: 'task-1',
      index: 4,
      type: 'BONUS_TASK',
      title: 'Bonus',
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      ...overrides
    }) as StorableTaskSchema;

  it('keeps the id and index out of the stored config', () => {
    expect(toStorableTask(storable(), 'DRAFT')).toEqual({
      id: 'task-1',
      index: 4,
      config: {
        type: 'BONUS_TASK',
        title: 'Bonus',
        value: 1,
        mandatory: false,
        tasksRequired: 0
      },
      jobs: { create: [] }
    });
  });

  it('creates an import job for an active import task', () => {
    expect(
      toStorableTask(
        storable({
          type: 'BLUESKY_LIKE_IMPORT'
        } as Partial<StorableTaskSchema>),
        'ACTIVE'
      ).jobs
    ).toEqual({ create: [{ runAt: NOW, data: { runs: 0 } }] });
  });

  it('creates no jobs for an active non-import task', () => {
    expect(toStorableTask(storable(), 'ACTIVE').jobs).toEqual({ create: [] });
  });
});

describe('toStorableVisibility', () => {
  it('returns undefined without visibility', () => {
    expect(toStorableVisibility(undefined)).toBeUndefined();
  });

  it('stores the visibility and slug', () => {
    expect(
      toStorableVisibility({ visibility: 'UNLISTED', slug: 'my-slug' })
    ).toEqual({ create: { visibility: 'UNLISTED', slug: 'my-slug' } });
  });

  it('stores an empty slug as null', () => {
    expect(toStorableVisibility({ visibility: 'PUBLIC', slug: '' })).toEqual({
      create: { visibility: 'PUBLIC', slug: null }
    });
  });

  it('stores a missing slug as null and leaves the visibility undefined', () => {
    expect(toStorableVisibility({})).toEqual({
      create: { visibility: undefined, slug: null }
    });
  });
});

describe('toStorableCriteria', () => {
  it('returns undefined without criteria', () => {
    expect(toStorableCriteria(undefined)).toBeUndefined();
  });

  it('applies the defaults and stores missing external platforms as JSON null', () => {
    expect(toStorableCriteria({})).toEqual({
      create: {
        minTasksCompleted: 1,
        minQualityScore: 50,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: Prisma.JsonNull
      }
    });
  });

  it('stores null external platforms as JSON null', () => {
    expect(
      toStorableCriteria({ externalPlatforms: null })?.create?.externalPlatforms
    ).toBe(Prisma.JsonNull);
  });

  it('keeps an empty external platforms list', () => {
    expect(
      toStorableCriteria({ externalPlatforms: [] })?.create?.externalPlatforms
    ).toEqual([]);
  });

  it('stores the multiple wins and user selection flags independently', () => {
    expect(
      toStorableCriteria({ allowMultipleWins: true, allowUserSelection: false })
        ?.create
    ).toMatchObject({ allowMultipleWins: true, allowUserSelection: false });
  });

  it('keeps zero and false values', () => {
    expect(
      toStorableCriteria({
        minTasksCompleted: 0,
        minQualityScore: 0,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: ['DISCORD_IMPORT']
      })
    ).toEqual({
      create: {
        minTasksCompleted: 0,
        minQualityScore: 0,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: ['DISCORD_IMPORT']
      }
    });
  });
});

describe('toStorableSweepstakes', () => {
  const sweepstakes = (
    overrides: Partial<TeamSweepstakesGetPayload> = {}
  ): TeamSweepstakesGetPayload => ({
    id: 'sweep-1',
    status: 'ACTIVE',
    teamId: 'team-1',
    createdAt: NOW,
    updatedAt: NOW,
    team: null,
    ...overrides
  });

  it('adds the stored id, team, and status to the update payload', () => {
    const result = toStorableSweepstakes(sweepstakes(), {
      id: 'ignored',
      setup: { name: 'Giveaway' }
    });

    expect(result).toEqual({
      details: {
        create: { name: 'Giveaway', description: undefined, banner: undefined }
      },
      timing: {
        create: {
          startDate: undefined,
          endDate: undefined,
          timeZone: undefined
        }
      },
      terms: undefined,
      audience: undefined,
      prizes: undefined,
      tasks: undefined,
      design: undefined,
      visibility: undefined,
      criteria: undefined,
      id: 'sweep-1',
      teamId: 'team-1',
      status: 'ACTIVE'
    });
  });

  it('prefers the status from the input over the stored status', () => {
    const result = toStorableSweepstakes(sweepstakes({ status: 'DRAFT' }), {
      id: 'sweep-1',
      status: 'ACTIVE',
      tasks: [importTask]
    });

    expect(result.status).toBe('ACTIVE');
    expect(result.tasks).toEqual({
      create: [
        expect.objectContaining({
          jobs: { create: [{ runAt: NOW, data: { runs: 0 } }] }
        })
      ]
    });
  });

  it('uses the stored status for the task jobs when the input has none', () => {
    const result = toStorableSweepstakes(sweepstakes({ status: 'DRAFT' }), {
      id: 'sweep-1',
      tasks: [importTask]
    });

    expect(result.status).toBe('DRAFT');
    expect(result.tasks).toEqual({
      create: [expect.objectContaining({ jobs: { create: [] } })]
    });
  });

  it('keeps a null team id', () => {
    expect(
      toStorableSweepstakes(sweepstakes({ teamId: null }), { id: 'sweep-1' })
        .teamId
    ).toBeNull();
  });
});
