import { describe, it, expect } from 'vitest';
import { convertSweepstakesToTemplate } from '../convert-sweepstakes-to-template';
import { DEFAULT_TEMPLATE_IMAGE, DEFAULT_TEMPLATE_NAME } from '../../defaults';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';

const team = {
  id: 'team-1',
  name: 'Acme',
  slug: 'acme',
  logo: 'https://example.com/logo.png'
};

const input = { id: 'sw-1', slug: 'acme' };

const sweepstakes = (overrides: Record<string, unknown> = {}) => ({
  id: 'sw-1',
  details: {
    name: 'Summer Bash',
    description: 'Win a prize',
    banner: 'https://example.com/banner.png'
  },
  terms: {
    type: 'TEMPLATE',
    sponsorName: 'Acme',
    sponsorAddress: null,
    winnerSelectionMethod: 'Random Drawing',
    notificationTimeframeDays: 7,
    claimDeadlineDays: 14,
    maxEntriesPerUser: null,
    governingLawCountry: 'USA',
    privacyPolicyUrl: null,
    additionalTerms: null,
    text: null
  },
  audience: {
    allowedIdentities: ['TWITTER'],
    regionalRestriction: null,
    requirePreEntryLogin: true,
    formFields: [
      {
        id: 'field-1',
        label: 'Email',
        type: 'EMAIL',
        required: true,
        placeholder: null,
        minimum: null,
        maximum: null,
        index: 0
      }
    ]
  },
  timing: {
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-02-01T00:00:00.000Z'),
    timeZone: 'UTC'
  },
  prizes: [{ id: 'prize-1', name: 'Shirt', quota: 2 }],
  tasks: [
    {
      id: 'task-1',
      config: { type: 'BONUS_TASK', title: 'Bonus', value: 1 }
    }
  ],
  design: {
    data: {
      displayName: false,
      displayDescription: true,
      aspectRatio: 'NONE',
      background: { type: 'color', color: '#123456' }
    }
  },
  visibility: { visibility: 'PUBLIC', slug: 'summer' },
  criteria: {
    minQualityScore: 80,
    minTasksCompleted: 2,
    allowMultipleWins: true,
    allowUserSelection: false,
    externalPlatforms: null
  },
  ...overrides
});

type CreateData = {
  name: string;
  description: string;
  image: string;
  type: string;
  content: Record<string, unknown>;
  teamId: string;
  createdById: string;
};

const createdData = (): CreateData => {
  const [args] = prismaMock.template.create.mock.calls[0];
  return (args as { data: CreateData }).data;
};

const arrange = (sweepstakesRow: unknown = sweepstakes()) => {
  signIn();
  prismaMock.team.findUnique.mockResolvedValue(team);
  prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow);
  prismaMock.template.create.mockResolvedValue({
    id: 'tpl-new',
    name: 'ignored',
    teamId: 'team-1'
  });
};

describe('convertSweepstakesToTemplate', () => {
  describe('authorization and input', () => {
    it('returns UNAUTHORIZED for signed-out callers', async () => {
      const result = await convertSweepstakesToTemplate(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the sweepstakes id is missing', async () => {
      signIn();

      const result = await convertSweepstakesToTemplate({
        slug: 'acme'
      } as unknown as Parameters<typeof convertSweepstakesToTemplate>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('lookups', () => {
    it('looks up the team by slug among the caller memberships', async () => {
      arrange();

      await convertSweepstakesToTemplate(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: {
          slug: 'acme',
          members: { some: { userId: TEST_USER.id } }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      arrange();
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await convertSweepstakesToTemplate(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Team not found or you do not have access.'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes from any team the caller belongs to with the form payload', async () => {
      arrange();

      await convertSweepstakesToTemplate(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'sw-1',
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: FORM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the sweepstakes is not accessible', async () => {
      arrange(null);

      const result = await convertSweepstakesToTemplate(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID sw-1 not found'
      );
      expect(prismaMock.template.create).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes is found', () => {
    it('returns only the id of the new template', async () => {
      arrange();

      expect(expectOk(await convertSweepstakesToTemplate(input))).toEqual({
        id: 'tpl-new'
      });
    });

    it('creates a sweepstakes template for the team and caller', async () => {
      arrange();

      await convertSweepstakesToTemplate(input);

      expect(createdData()).toMatchObject({
        name: 'Summer Bash Template',
        description: '',
        image: 'https://example.com/banner.png',
        type: 'SWEEPSTAKES',
        teamId: 'team-1',
        createdById: TEST_USER.id
      });
    });

    it('stores the form sections without timing or visibility', async () => {
      arrange();

      await convertSweepstakesToTemplate(input);

      expect(Object.keys(createdData().content).sort()).toEqual([
        'audience',
        'criteria',
        'design',
        'prizes',
        'setup',
        'tasks',
        'terms'
      ]);
    });

    it('stores the sweepstakes content converted to the form input shape', async () => {
      arrange();

      await convertSweepstakesToTemplate(input);

      expect(createdData().content).toEqual({
        setup: {
          name: 'Summer Bash',
          banner: 'https://example.com/banner.png',
          description: 'Win a prize'
        },
        audience: {
          allowedIdentities: ['TWITTER'],
          regionalRestriction: undefined,
          requirePreEntryLogin: true,
          formFields: [
            {
              id: 'field-1',
              label: 'Email',
              type: 'EMAIL',
              required: true,
              placeholder: undefined,
              minimum: undefined,
              maximum: undefined,
              index: 0
            }
          ]
        },
        tasks: [{ type: 'BONUS_TASK', title: 'Bonus', value: 1, id: 'task-1' }],
        design: {
          aspectRatio: 'NONE',
          displayName: false,
          displayDescription: true,
          background: { type: 'color', color: '#123456' }
        },
        criteria: {
          minQualityScore: 80,
          minTasksCompleted: 2,
          allowMultipleWins: true,
          allowUserSelection: false,
          externalPlatforms: null
        },
        terms: {
          type: 'TEMPLATE',
          sponsorName: 'Acme',
          sponsorAddress: undefined,
          winnerSelectionMethod: 'Random Drawing',
          notificationTimeframeDays: 7,
          claimDeadlineDays: 14,
          maxEntriesPerUser: undefined,
          governingLawCountry: 'USA',
          privacyPolicyUrl: undefined,
          additionalTerms: undefined,
          text: undefined
        },
        prizes: [{ id: 'prize-1', name: 'Shirt', quota: 2 }]
      });
    });

    it('keeps the original task and prize ids', async () => {
      arrange();

      await convertSweepstakesToTemplate(input);

      const content = createdData().content as {
        tasks: { id: string }[];
        prizes: { id: string }[];
      };
      expect(content.tasks[0].id).toBe('task-1');
      expect(content.prizes[0].id).toBe('prize-1');
    });

    it('does not revalidate any cache tags', async () => {
      arrange();

      await convertSweepstakesToTemplate(input);

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('name and image fallbacks', () => {
    it('uses the default template name when the sweepstakes has no name', async () => {
      arrange(
        sweepstakes({
          details: { name: null, description: 'x', banner: 'https://b.png' }
        })
      );

      await convertSweepstakesToTemplate(input);

      expect(createdData().name).toBe(DEFAULT_TEMPLATE_NAME);
    });

    it('uses the default template name when the sweepstakes name is empty', async () => {
      arrange(
        sweepstakes({ details: { name: '', description: 'x', banner: null } })
      );

      await convertSweepstakesToTemplate(input);

      expect(createdData().name).toBe(DEFAULT_TEMPLATE_NAME);
    });

    it('uses the default name and image when there are no details', async () => {
      arrange(sweepstakes({ details: null }));

      await convertSweepstakesToTemplate(input);

      expect(createdData()).toMatchObject({
        name: DEFAULT_TEMPLATE_NAME,
        image: DEFAULT_TEMPLATE_IMAGE
      });
    });

    it('uses the default image when the banner is empty', async () => {
      arrange(
        sweepstakes({
          details: { name: 'Bash', description: 'x', banner: '' }
        })
      );

      await convertSweepstakesToTemplate(input);

      expect(createdData()).toMatchObject({
        name: 'Bash Template',
        image: DEFAULT_TEMPLATE_IMAGE
      });
    });
  });

  describe('when optional sections are missing', () => {
    it('stores converter defaults for audience, design and criteria', async () => {
      arrange(
        sweepstakes({
          audience: null,
          design: null,
          criteria: null,
          terms: null,
          tasks: [],
          prizes: []
        })
      );

      await convertSweepstakesToTemplate(input);

      expect(createdData().content).toMatchObject({
        audience: {
          requirePreEntryLogin: false,
          formFields: []
        },
        design: undefined,
        criteria: {
          minQualityScore: 50,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: false,
          externalPlatforms: null
        },
        tasks: [],
        prizes: []
      });
    });
  });

  describe('failures', () => {
    it('returns VALIDATION_ERROR when stored external platforms are malformed', async () => {
      arrange(
        sweepstakes({
          criteria: {
            minQualityScore: 80,
            minTasksCompleted: 2,
            allowMultipleWins: true,
            allowUserSelection: false,
            externalPlatforms: { not: 'valid' }
          }
        })
      );

      const result = await convertSweepstakesToTemplate(input);

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid external platforms format'
      );
      expect(prismaMock.template.create).not.toHaveBeenCalled();
    });

    it('maps a P2025 error from the create to NOT_FOUND', async () => {
      arrange();
      prismaMock.template.create.mockRejectedValue(knownRequestError('P2025'));

      const result = await convertSweepstakesToTemplate(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });
  });
});
