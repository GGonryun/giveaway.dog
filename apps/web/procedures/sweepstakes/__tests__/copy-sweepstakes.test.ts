import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma, TeamRole } from '@prisma/client';
import copySweepstakes from '../copy-sweepstakes';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import {
  buildMember,
  buildTeam,
  SWEEPSTAKES_ID,
  TEAM_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

const ids = vi.hoisted(() => {
  let count = 0;
  return {
    nanoid: vi.fn(() => `gen-${++count}`),
    reset: () => {
      count = 0;
    }
  };
});

vi.mock('nanoid', () => ({ nanoid: ids.nanoid }));

const START = new Date('2026-11-01T00:00:00.000Z');
const END = new Date('2026-11-08T00:00:00.000Z');

const fullOriginal = () => ({
  id: SWEEPSTAKES_ID,
  status: 'ACTIVE',
  teamId: TEAM_ID,
  details: {
    id: 'details-1',
    sweepstakesId: SWEEPSTAKES_ID,
    name: 'Summer Giveaway',
    description: 'Win things',
    banner: 'https://example.com/banner.png'
  },
  timing: {
    id: 'timing-1',
    sweepstakesId: SWEEPSTAKES_ID,
    startDate: START,
    endDate: END,
    timeZone: 'America/New_York'
  },
  audience: {
    id: 'audience-1',
    sweepstakesId: SWEEPSTAKES_ID,
    allowedIdentities: ['TWITTER'],
    requirePreEntryLogin: true,
    requireEmail: true,
    regionalRestriction: {
      id: 'region-1',
      audienceId: 'audience-1',
      filter: 'INCLUDE',
      regions: ['US', 'CA']
    },
    minimumAgeRestriction: {
      id: 'age-1',
      audienceId: 'audience-1',
      value: 18,
      label: 'Must be 18',
      required: true,
      format: 'CHECKBOX'
    },
    formFields: [
      {
        id: 'field-1',
        audienceId: 'audience-1',
        label: 'Username',
        type: 'USERNAME',
        required: true
      }
    ]
  },
  terms: {
    id: 'terms-1',
    sweepstakesId: SWEEPSTAKES_ID,
    type: 'TEMPLATE',
    sponsorName: 'Acme',
    sponsorAddress: '1 Main St',
    winnerSelectionMethod: 'Random Drawing',
    notificationTimeframeDays: 5,
    maxEntriesPerUser: 3,
    claimDeadlineDays: 10,
    governingLawCountry: 'USA',
    privacyPolicyUrl: 'https://example.com/privacy',
    additionalTerms: 'None',
    text: 'Full terms'
  },
  prizes: [
    {
      id: 'prize-a',
      sweepstakesId: SWEEPSTAKES_ID,
      name: 'Gold',
      index: 0,
      quota: 1
    },
    {
      id: 'prize-b',
      sweepstakesId: SWEEPSTAKES_ID,
      name: 'Silver',
      index: 1,
      quota: 3
    }
  ],
  tasks: [
    {
      id: 'task-a',
      sweepstakesId: SWEEPSTAKES_ID,
      index: 0,
      config: { type: 'BONUS_TASK', title: 'Bonus' }
    },
    {
      id: 'task-b',
      sweepstakesId: SWEEPSTAKES_ID,
      index: 1,
      config: null
    }
  ],
  design: {
    id: 'design-1',
    sweepstakesId: SWEEPSTAKES_ID,
    data: { aspectRatio: 'VIDEO' }
  },
  visibility: {
    id: 'visibility-1',
    sweepstakesId: SWEEPSTAKES_ID,
    visibility: 'PUBLIC',
    slug: 'summer'
  },
  criteria: {
    id: 'criteria-1',
    sweepstakesId: SWEEPSTAKES_ID,
    minTasksCompleted: 2,
    minQualityScore: 70,
    allowMultipleWins: true,
    allowUserSelection: true,
    externalPlatforms: ['TWITTER_IMPORT']
  }
});

const bareOriginal = () => ({
  id: SWEEPSTAKES_ID,
  status: 'DRAFT',
  teamId: TEAM_ID,
  details: null,
  timing: null,
  audience: null,
  terms: null,
  prizes: [],
  tasks: [],
  design: null,
  visibility: null,
  criteria: null
});

const copiedData = () =>
  prismaMock.sweepstakes.create.mock.calls[0][0].data as Record<
    string,
    unknown
  >;

describe('copySweepstakes', () => {
  beforeEach(() => {
    ids.reset();
    ids.nanoid.mockClear();
  });

  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without querying the database', async () => {
      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('rejects a missing id', async () => {
      signIn();

      const result = await copySweepstakes(
        {} as unknown as Parameters<typeof copySweepstakes>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the original cannot be loaded', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the original through a team the caller belongs to', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: FORM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the original does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found or you do not have access to it.'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the original has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...bareOriginal(),
        teamId: null
      });

      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Sweepstakes team data is missing.'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });
  });

  describe('when the caller lacks access to the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(bareOriginal());
    });

    it('looks up the team by id and caller membership', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { id: TEAM_ID, members: { some: { userId: TEST_USER.id } } },
        include: { members: true }
      });
    });

    it('returns NOT_FOUND when the team is missing', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller is not a member of the team', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ members: [buildMember({ userId: 'someone-else' })] })
      );

      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You are not a member of this team'
      );
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller is a guest', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ members: [buildMember({ role: TeamRole.GUEST })] })
      );

      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      );
      expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
    });
  });

  describe('when copying a fully configured sweepstakes', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(fullOriginal());
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ members: [buildMember({ role: TeamRole.MEMBER })] })
      );
      prismaMock.sweepstakes.create.mockResolvedValue({ id: 'copy-1' });
    });

    it('returns the id of the created copy and the team slug', async () => {
      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({ id: 'copy-1', slug: TEAM_SLUG });
    });

    it('generates six character ids for the copy, its prizes and its tasks', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(ids.nanoid).toHaveBeenCalledTimes(5);
      for (const call of ids.nanoid.mock.calls) {
        expect(call).toEqual([6]);
      }
    });

    it('creates a private draft in the same team', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData()).toMatchObject({
        id: 'gen-1',
        teamId: TEAM_ID,
        status: 'DRAFT',
        visibility: { create: { visibility: 'PRIVATE', slug: null } }
      });
    });

    it('appends (Copy) to the name and keeps the description and banner', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().details).toEqual({
        create: {
          name: 'Summer Giveaway (Copy)',
          description: 'Win things',
          banner: 'https://example.com/banner.png'
        }
      });
    });

    it('copies the timing', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().timing).toEqual({
        create: {
          startDate: START,
          endDate: END,
          timeZone: 'America/New_York'
        }
      });
    });

    it('copies only the email requirement and the legacy restrictions of the audience', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().audience).toEqual({
        create: {
          requireEmail: true,
          regionalRestriction: {
            create: { filter: 'INCLUDE', regions: ['US', 'CA'] }
          },
          minimumAgeRestriction: {
            create: {
              value: 18,
              label: 'Must be 18',
              required: true,
              format: 'CHECKBOX'
            }
          }
        }
      });
    });

    it('copies every terms field', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().terms).toEqual({
        create: {
          type: 'TEMPLATE',
          sponsorName: 'Acme',
          sponsorAddress: '1 Main St',
          winnerSelectionMethod: 'Random Drawing',
          notificationTimeframeDays: 5,
          maxEntriesPerUser: 3,
          claimDeadlineDays: 10,
          governingLawCountry: 'USA',
          privacyPolicyUrl: 'https://example.com/privacy',
          additionalTerms: 'None',
          text: 'Full terms'
        }
      });
    });

    it('recreates prizes with new ids', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().prizes).toEqual({
        createMany: {
          data: [
            { id: 'gen-2', name: 'Gold', index: 0, quota: 1 },
            { id: 'gen-3', name: 'Silver', index: 1, quota: 3 }
          ]
        }
      });
    });

    it('recreates tasks with new ids and stores a missing config as JsonNull', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().tasks).toEqual({
        createMany: {
          data: [
            {
              id: 'gen-4',
              index: 0,
              config: { type: 'BONUS_TASK', title: 'Bonus' }
            },
            { id: 'gen-5', index: 1, config: Prisma.JsonNull }
          ]
        }
      });
    });

    it('uses the JSON null sentinel rather than the database null for a missing task config', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      const tasks = copiedData().tasks as {
        createMany: { data: { config: unknown }[] };
      };
      expect(tasks.createMany.data[1].config).toBe(Prisma.JsonNull);
      expect(tasks.createMany.data[1].config).not.toBe(Prisma.DbNull);
    });

    it('copies the design data', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().design).toStrictEqual({
        create: { data: { aspectRatio: 'VIDEO' } }
      });
    });

    it('copies the winner criteria without user selection or external platforms', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().criteria).toEqual({
        create: {
          minTasksCompleted: 2,
          minQualityScore: 70,
          allowMultipleWins: true
        }
      });
    });
  });

  describe('when copying a sweepstakes with no optional sections', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(bareOriginal());
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.sweepstakes.create.mockResolvedValue({ id: 'copy-2' });
    });

    it('omits every optional nested create', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      const data = copiedData();
      expect(data.details).toBeUndefined();
      expect(data.timing).toBeUndefined();
      expect(data.audience).toBeUndefined();
      expect(data.terms).toBeUndefined();
      expect(data.design).toBeUndefined();
      expect(data.criteria).toBeUndefined();
    });

    it('still creates empty prize and task lists and private visibility', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData()).toMatchObject({
        prizes: { createMany: { data: [] } },
        tasks: { createMany: { data: [] } },
        visibility: { create: { visibility: 'PRIVATE', slug: null } }
      });
    });

    it('only generates the id of the copy', async () => {
      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(ids.nanoid).toHaveBeenCalledTimes(1);
    });

    it('returns the created id', async () => {
      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({ id: 'copy-2', slug: TEAM_SLUG });
    });
  });

  describe('when nested sections contain empty values', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.sweepstakes.create.mockResolvedValue({ id: 'copy-3' });
    });

    it('stores a null name instead of appending (Copy)', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...bareOriginal(),
        details: { name: null, description: null, banner: null }
      });

      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().details).toEqual({
        create: { name: null, description: null, banner: null }
      });
    });

    it('stores an empty name as null', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...bareOriginal(),
        details: { name: '', description: 'd', banner: null }
      });

      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().details).toEqual({
        create: { name: null, description: 'd', banner: null }
      });
    });

    it('omits restrictions that the original audience does not have', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...bareOriginal(),
        audience: {
          requireEmail: null,
          regionalRestriction: null,
          minimumAgeRestriction: null,
          formFields: []
        }
      });

      await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(copiedData().audience).toEqual({
        create: {
          requireEmail: null,
          regionalRestriction: undefined,
          minimumAgeRestriction: undefined
        }
      });
    });

    it('stores missing design data as JsonNull', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...bareOriginal(),
        design: { data: null }
      });

      await copySweepstakes({ id: SWEEPSTAKES_ID });

      const design = copiedData().design as { create: { data: unknown } };
      expect(design.create.data).toBe(Prisma.JsonNull);
      expect(design.create.data).not.toBe(Prisma.DbNull);
    });
  });

  describe('when the database fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(bareOriginal());
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
    });

    it('maps a unique constraint error to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.sweepstakes.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await copySweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: /
      );
    });
  });
});
