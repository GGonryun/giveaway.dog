import { describe, it, expect, beforeEach } from 'vitest';
import getSweepstakeEntries from '../get-sweepstake-entries';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';
import {
  buildTaskRecord,
  buildTeam,
  buildUserRecord,
  expectedBonusTask,
  expectedUserSchema,
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from './fixtures-procedures-sweepstakes-a';

const input = { sweepstakesId: SWEEPSTAKES_ID, slug: TEAM_SLUG };

const sweepstakes = (overrides: Record<string, unknown> = {}) => ({
  id: SWEEPSTAKES_ID,
  status: 'ACTIVE',
  teamId: 'team-1',
  team: buildTeam(),
  ...overrides
});

const completion = (
  id: string,
  completedAt: string,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  participantId: `participant-${id}`,
  taskId: 'task-1',
  completedAt: new Date(completedAt),
  proof: null,
  reason: null,
  status: 'COMPLETED',
  participant: {
    id: `participant-${id}`,
    userId: 'entrant-1',
    sweepstakesId: SWEEPSTAKES_ID,
    user: buildUserRecord()
  },
  task: buildTaskRecord(),
  ...overrides
});

describe('getSweepstakeEntries', () => {
  describe('when the input is invalid', () => {
    it('rejects a missing slug', async () => {
      const result = await getSweepstakeEntries({
        sweepstakesId: SWEEPSTAKES_ID
      } as unknown as Parameters<typeof getSweepstakeEntries>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes cannot be found', () => {
    it('looks up the sweepstakes by id and team slug', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await getSweepstakeEntries(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: SWEEPSTAKES_ID, team: { slug: TEAM_SLUG } },
        include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND naming the id when nothing matches', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await getSweepstakeEntries(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakes({ team: null })
      );

      const result = await getSweepstakeEntries(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes exists', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakes({ id: 'loaded-id' })
      );
    });

    it('loads completions of every task in the loaded sweepstakes', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getSweepstakeEntries(input);

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: { task: { sweepstakesId: 'loaded-id' } },
        include: {
          participant: {
            include: { user: { select: USER_SCHEMA_SELECT_QUERY } }
          },
          task: true
        }
      });
    });

    it('returns an empty list when there are no completions', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await getSweepstakeEntries(input);

      expect(expectOk(result)).toEqual([]);
    });

    it('is available to anonymous visitors and signed in users alike', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);
      signIn();

      const result = await getSweepstakeEntries(input);

      expect(expectOk(result)).toEqual([]);
    });

    it('maps a completion into an entry and keeps the raw completion fields', async () => {
      const raw = completion('c-1', '2026-09-01T10:00:00.000Z', {
        proof: { url: 'https://example.com/proof.png' },
        reason: 'Looks good'
      });
      prismaMock.taskCompletion.findMany.mockResolvedValue([raw]);

      const result = await getSweepstakeEntries(input);

      expect(expectOk(result)).toEqual([
        {
          id: 'c-1',
          participantId: 'participant-c-1',
          taskId: 'task-1',
          status: 'COMPLETED',
          reason: 'Looks good',
          participant: raw.participant,
          user: expectedUserSchema(),
          completedAt: Date.parse('2026-09-01T10:00:00.000Z'),
          proof: { url: 'https://example.com/proof.png' },
          task: expectedBonusTask('task-1')
        }
      ]);
    });

    it('sorts entries from newest to oldest', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('old', '2026-09-01T00:00:00.000Z'),
        completion('newest', '2026-09-03T00:00:00.000Z'),
        completion('middle', '2026-09-02T00:00:00.000Z')
      ]);

      const result = await getSweepstakeEntries(input);

      expect(expectOk(result).map((entry) => entry.id)).toEqual([
        'newest',
        'middle',
        'old'
      ]);
    });

    it.each([
      ['null', null],
      ['an array', ['a', 'b']],
      ['a string', 'proof'],
      ['a number', 5]
    ])('turns a proof that is %s into an empty object', async (_, proof) => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('c-1', '2026-09-01T00:00:00.000Z', { proof })
      ]);

      const result = await getSweepstakeEntries(input);

      expect(expectOk(result)[0].proof).toEqual({});
    });

    it('derives defaults for a sparse participant user', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('c-1', '2026-09-01T00:00:00.000Z', {
          participant: {
            id: 'participant-c-1',
            userId: 'entrant-1',
            sweepstakesId: SWEEPSTAKES_ID,
            user: buildUserRecord({
              image: 'not a url',
              agents: [],
              ips: [],
              quality: [{ score: 140 }],
              emailVerified: null,
              accounts: []
            })
          }
        })
      ]);

      const result = await getSweepstakeEntries(input);

      expect(expectOk(result)[0].user).toEqual(
        expectedUserSchema({
          image: null,
          countryCode: 'XX',
          userAgent: 'unknown',
          qualityScore: 100,
          emailVerified: false,
          providers: [],
          isAnonymous: true
        })
      );
    });

    it('returns INTERNAL_SERVER_ERROR when a task config cannot be parsed', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('c-1', '2026-09-01T00:00:00.000Z', {
          task: buildTaskRecord({ config: { type: 'NOT_A_TASK' } })
        })
      ]);

      const result = await getSweepstakeEntries(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
    });

    it('fails output validation when a participant email is malformed', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('c-1', '2026-09-01T00:00:00.000Z', {
          participant: {
            id: 'participant-c-1',
            userId: 'entrant-1',
            sweepstakesId: SWEEPSTAKES_ID,
            user: buildUserRecord({ email: 'not-an-email' })
          }
        })
      ]);

      const result = await getSweepstakeEntries(input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });
});
