import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Prisma, TeamRole } from '@giveaway/db-model';
import { createSweepstakes } from '../create-sweepstakes';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  DEFAULT_SWEEPSTAKES_AUDIENCE,
  DEFAULT_SWEEPSTAKES_DESIGN,
  DEFAULT_SWEEPSTAKES_DETAILS,
  DEFAULT_SWEEPSTAKES_TERMS,
  DEFAULT_SWEEPSTAKES_TIMING,
  DEFAULT_SWEEPSTAKES_VISIBILITY,
  DEFAULT_SWEEPSTAKES_WINNER_CRITERIA
} from '@giveaway/sweepstakes-model/defaults';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import { getTemplateById } from '@giveaway/templates-model/data/static-templates';
import {
  bonusTaskConfig,
  buildMember,
  buildTeam,
  TEAM_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

const ids = vi.hoisted(() => {
  const state = { prefix: 'static', count: 0 };
  return {
    state,
    nanoid: vi.fn(() => `${state.prefix}-${++state.count}`)
  };
});

vi.mock('nanoid', () => ({ nanoid: ids.nanoid }));

const TIMEZONE = 'Europe/Paris';

const input = { slug: TEAM_SLUG, timezone: TIMEZONE };

const createdData = () =>
  prismaMock.sweepstakes.create.mock.calls[0][0].data as Record<
    string,
    unknown
  >;

const dbTemplate = (content: Record<string, unknown>) => ({
  id: 'tpl-1',
  name: 'Team template',
  description: 'A saved template',
  image: 'https://example.com/template.png',
  type: 'SWEEPSTAKES',
  content,
  teamId: TEAM_ID,
  createdById: TEST_USER.id,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
});

describe('createSweepstakes', () => {
  beforeEach(() => {
    ids.state.prefix = 'gen';
    ids.state.count = 0;
    ids.nanoid.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without querying the database', async () => {
      const result = await createSweepstakes(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a missing timezone', async () => {
      const result = await createSweepstakes({
        slug: TEAM_SLUG
      } as unknown as Parameters<typeof createSweepstakes>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a non-string template id', async () => {
      const result = await createSweepstakes({
        ...input,
        templateId: 7
      } as unknown as Parameters<typeof createSweepstakes>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the team is not accessible', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the team by slug and caller membership', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      await createSweepstakes(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: {
          slug: TEAM_SLUG,
          members: { some: { userId: TEST_USER.id } }
        },
        include: { members: true }
      });
    });

    it('returns NOT_FOUND when the team does not exist', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await createSweepstakes(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller is a guest', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ members: [buildMember({ role: TeamRole.GUEST })] })
      );

      const result = await createSweepstakes(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      );
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the loaded team has no id', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ id: undefined })
      );

      const result = await createSweepstakes(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Team does not exist or you do not have access to it.'
      );
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });
  });

  describe('when no template is requested', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.sweepstakes.create.mockResolvedValue({
        id: 'created-1',
        status: 'DRAFT',
        teamId: TEAM_ID
      });
    });

    it('returns the created record as is', async () => {
      const result = await createSweepstakes(input);

      expect(expectOk(result)).toEqual({
        id: 'created-1',
        status: 'DRAFT',
        teamId: TEAM_ID
      });
    });

    it('creates a draft with default sections', async () => {
      await createSweepstakes(input);

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith({
        data: {
          id: 'gen-1',
          teamId: TEAM_ID,
          status: 'DRAFT',
          details: { create: DEFAULT_SWEEPSTAKES_DETAILS },
          timing: {
            create: { ...DEFAULT_SWEEPSTAKES_TIMING, timeZone: TIMEZONE }
          },
          audience: { create: DEFAULT_SWEEPSTAKES_AUDIENCE },
          terms: {
            create: { ...DEFAULT_SWEEPSTAKES_TERMS, sponsorName: 'Acme Inc' }
          },
          prizes: { createMany: { data: [] } },
          tasks: { createMany: { data: [] } },
          design: { create: DEFAULT_SWEEPSTAKES_DESIGN },
          visibility: { create: DEFAULT_SWEEPSTAKES_VISIBILITY },
          criteria: { create: DEFAULT_SWEEPSTAKES_WINNER_CRITERIA }
        }
      });
    });

    it('generates a six character sweepstakes id', async () => {
      await createSweepstakes(input);

      expect(ids.nanoid).toHaveBeenCalledTimes(1);
      expect(ids.nanoid).toHaveBeenCalledWith(6);
    });

    it('uses the requested timezone and the team name as sponsor', async () => {
      await createSweepstakes(input);

      expect(createdData()).toMatchObject({
        timing: { create: { timeZone: TIMEZONE } },
        terms: { create: { sponsorName: 'Acme Inc' } }
      });
    });

    it('starts as an unlisted sweepstakes named Untitled Sweepstakes', async () => {
      await createSweepstakes(input);

      expect(createdData()).toMatchObject({
        details: {
          create: {
            name: 'Untitled Sweepstakes',
            description: 'Enter to win a prize!'
          }
        },
        visibility: { create: { visibility: 'UNLISTED', slug: null } }
      });
    });

    it('treats an empty template id as no template', async () => {
      await createSweepstakes({ ...input, templateId: '' });

      expect(prismaMock.template.findFirst).not.toHaveBeenCalled();
      expect(createdData().timing).toEqual({
        create: { ...DEFAULT_SWEEPSTAKES_TIMING, timeZone: TIMEZONE }
      });
    });

    it('logs the team the sweepstakes is created for', async () => {
      await createSweepstakes(input);

      expect(console.info).toHaveBeenCalledWith(
        'Creating sweepstakes for team:',
        TEAM_ID
      );
    });
  });

  describe('when a static template is requested', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.sweepstakes.create.mockResolvedValue({ id: 'created-2' });
    });

    it('does not query database templates', async () => {
      await createSweepstakes({ ...input, templateId: 'basic-giveaway' });

      expect(prismaMock.template.findFirst).not.toHaveBeenCalled();
    });

    it('returns the created record', async () => {
      const result = await createSweepstakes({
        ...input,
        templateId: 'basic-giveaway'
      });

      expect(expectOk(result)).toEqual({ id: 'created-2' });
    });

    it('overlays the template sections on the defaults and regenerates every id', async () => {
      await createSweepstakes({ ...input, templateId: 'basic-giveaway' });

      expect(createdData()).toEqual({
        id: 'gen-2',
        teamId: TEAM_ID,
        status: 'DRAFT',
        details: {
          create: {
            name: 'My Giveaway',
            description: 'Enter to win amazing prizes!',
            banner:
              'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/73f5c6fa-953d-4a1d-a4b6-3cd03cddb4a7.png'
          }
        },
        timing: { create: {} },
        audience: {
          create: {
            allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
            requirePreEntryLogin: false,
            formFields: { createMany: { data: [] } }
          }
        },
        terms: {
          create: {
            type: 'TEMPLATE',
            sponsorName: 'Giveaway Sponsor',
            sponsorAddress: '',
            winnerSelectionMethod: 'Random Drawing',
            notificationTimeframeDays: 7,
            claimDeadlineDays: 7,
            governingLawCountry: 'USA',
            privacyPolicyUrl: ''
          }
        },
        prizes: { createMany: { data: [] } },
        tasks: {
          create: [
            {
              id: 'gen-3',
              index: 0,
              config: {
                type: 'VISIT_URL',
                title: 'Visit our website',
                label: 'Click Here!',
                href: 'https://giveaway.dog',
                value: 1,
                mandatory: false,
                tasksRequired: 0
              },
              jobs: { create: [] }
            }
          ]
        },
        design: {
          create: {
            data: {
              aspectRatio: 'VIDEO',
              displayName: true,
              displayDescription: true,
              background: { type: 'color', color: '#edf0f4' }
            }
          }
        },
        visibility: { create: { visibility: 'UNLISTED', slug: null } },
        criteria: {
          create: {
            minTasksCompleted: 1,
            minQualityScore: 50,
            allowMultipleWins: false,
            allowUserSelection: false,
            externalPlatforms: Prisma.JsonNull
          }
        }
      });
    });

    it('replaces the requested timezone with an empty timing section', async () => {
      await createSweepstakes({ ...input, templateId: 'basic-giveaway' });

      expect(createdData().timing).toStrictEqual({
        create: {
          startDate: undefined,
          endDate: undefined,
          timeZone: undefined
        }
      });
    });

    it('does not reuse the task ids stored in the template', async () => {
      const templateTaskIds = (getTemplateById('x-giveaway')?.tasks ?? []).map(
        (task) => task.id
      );

      await createSweepstakes({ ...input, templateId: 'x-giveaway' });

      const tasks = createdData().tasks as {
        create: { id: string; index: number }[];
      };
      const createdIds = tasks.create.map((task) => task.id);
      expect(templateTaskIds).toHaveLength(4);
      expect(createdIds).toEqual(['gen-3', 'gen-4', 'gen-5', 'gen-6']);
      expect(createdIds.filter((id) => templateTaskIds.includes(id))).toEqual(
        []
      );
      expect(tasks.create.map((task) => task.index)).toEqual([0, 1, 2, 3]);
    });

    it('uses the template sponsor instead of the team name', async () => {
      await createSweepstakes({ ...input, templateId: 'x-giveaway' });

      expect(createdData()).toMatchObject({
        terms: { create: { sponsorName: 'Giveaway Sponsor' } }
      });
    });
  });

  describe('when a database template is requested', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.sweepstakes.create.mockResolvedValue({ id: 'created-3' });
    });

    it('looks up the template within the team', async () => {
      prismaMock.template.findFirst.mockResolvedValue(dbTemplate({}));

      await createSweepstakes({ ...input, templateId: 'tpl-1' });

      expect(prismaMock.template.findFirst).toHaveBeenCalledWith({
        where: { id: 'tpl-1', teamId: TEAM_ID }
      });
    });

    it('returns NOT_FOUND when the template is not in the team', async () => {
      prismaMock.template.findFirst.mockResolvedValue(null);

      const result = await createSweepstakes({ ...input, templateId: 'tpl-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Template not found or you do not have access.'
      );
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });

    it('keeps default sections that the template content does not define', async () => {
      prismaMock.template.findFirst.mockResolvedValue(dbTemplate({}));

      await createSweepstakes({ ...input, templateId: 'tpl-1' });

      expect(createdData()).toMatchObject({
        id: 'gen-2',
        teamId: TEAM_ID,
        status: 'DRAFT',
        terms: {
          create: { ...DEFAULT_SWEEPSTAKES_TERMS, sponsorName: 'Acme Inc' }
        },
        prizes: { createMany: { data: [] } },
        tasks: { createMany: { data: [] } },
        design: { create: DEFAULT_SWEEPSTAKES_DESIGN },
        visibility: { create: DEFAULT_SWEEPSTAKES_VISIBILITY },
        criteria: { create: DEFAULT_SWEEPSTAKES_WINNER_CRITERIA },
        details: { create: {} },
        timing: { create: {} }
      });
    });

    it('returns VALIDATION_ERROR when the stored template has no string id', async () => {
      prismaMock.template.findFirst.mockResolvedValue({
        ...dbTemplate({}),
        id: 42
      });

      const result = await createSweepstakes({ ...input, templateId: 'tpl-1' });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Template validation failed'
      );
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });

    it('replaces the default details and timing with empty sections', async () => {
      prismaMock.template.findFirst.mockResolvedValue(dbTemplate({}));

      await createSweepstakes({ ...input, templateId: 'tpl-1' });

      expect(createdData().details).toStrictEqual({
        create: { name: undefined, description: undefined, banner: undefined }
      });
      expect(createdData().timing).toStrictEqual({
        create: {
          startDate: undefined,
          endDate: undefined,
          timeZone: undefined
        }
      });
    });

    it('keeps the default audience when the template has none', async () => {
      prismaMock.template.findFirst.mockResolvedValue(dbTemplate({}));

      await createSweepstakes({ ...input, templateId: 'tpl-1' });

      const audience = createdData().audience as {
        create: { formFields: { createMany: { data: { id?: string }[] } } };
      };
      expect(audience.create.formFields.createMany.data).toHaveLength(3);
      expect(audience.create).toMatchObject({
        requirePreEntryLogin: false,
        allowedIdentities: DEFAULT_ALLOWED_IDENTITIES
      });
    });

    it('stores template content with freshly generated ids', async () => {
      prismaMock.template.findFirst.mockResolvedValue(
        dbTemplate({
          setup: { name: 'Saved', description: 'From db' },
          audience: {
            allowedIdentities: ['DISCORD'],
            requirePreEntryLogin: true,
            regionalRestriction: { filter: 'EXCLUDE', regions: ['FR'] },
            formFields: [{ id: 'old-field', type: 'EMAIL', label: 'Email' }]
          },
          terms: { type: 'CUSTOM', text: 'Custom terms' },
          prizes: [{ id: 'old-prize', name: 'Gold', quota: 2 }],
          tasks: [{ id: 'old-task', ...bonusTaskConfig('Saved bonus') }]
        })
      );

      await createSweepstakes({ ...input, templateId: 'tpl-1' });

      expect(createdData()).toMatchObject({
        id: 'gen-2',
        details: { create: { name: 'Saved', description: 'From db' } },
        audience: {
          create: {
            allowedIdentities: ['DISCORD'],
            requirePreEntryLogin: true,
            regionalRestriction: {
              create: { filter: 'EXCLUDE', regions: ['FR'] }
            },
            formFields: {
              createMany: {
                data: [{ id: 'gen-3', type: 'EMAIL', label: 'Email', index: 0 }]
              }
            }
          }
        },
        terms: { create: { type: 'CUSTOM', text: 'Custom terms' } },
        prizes: {
          createMany: {
            data: [{ id: 'gen-4', index: 0, name: 'Gold', quota: 2 }]
          }
        },
        tasks: {
          create: [
            {
              id: 'gen-5',
              index: 0,
              config: bonusTaskConfig('Saved bonus'),
              jobs: { create: [] }
            }
          ]
        }
      });
    });

    it('returns the created record', async () => {
      prismaMock.template.findFirst.mockResolvedValue(dbTemplate({}));

      const result = await createSweepstakes({ ...input, templateId: 'tpl-1' });

      expect(expectOk(result)).toEqual({ id: 'created-3' });
    });
  });
});
