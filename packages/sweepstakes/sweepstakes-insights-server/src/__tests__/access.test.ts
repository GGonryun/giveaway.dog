import { describe, it, expect } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import getSweepstakeEntries from '../get-sweepstake-entries';
import getSweepstakesPrizes from '../get-sweepstake-prizes';
import getSweepstakeTaskEntries from '../get-sweepstake-task-entries';
import getSweepstakesEntryTimeSeries from '../get-sweepstakes-entry-time-series';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import {
  buildMember,
  buildTeam,
  buildTeamSweepstakes,
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

const input = { sweepstakesId: SWEEPSTAKES_ID, slug: TEAM_SLUG };

const procedures = [
  {
    name: 'getSweepstakeEntries',
    call: () => getSweepstakeEntries(input),
    reads: () => [prismaMock.taskCompletion.findMany]
  },
  {
    name: 'getSweepstakeTaskEntries',
    call: () => getSweepstakeTaskEntries({ ...input, taskId: 'task-1' }),
    reads: () => [prismaMock.taskCompletion.findMany]
  },
  {
    name: 'getSweepstakesPrizes',
    call: () => getSweepstakesPrizes(input),
    reads: () => [prismaMock.prize.findMany]
  },
  {
    name: 'getSweepstakesEntryTimeSeries',
    call: () => getSweepstakesEntryTimeSeries(input),
    reads: () => [
      prismaMock.taskCompletion.findMany,
      nextCacheMock.unstable_cache
    ]
  }
];

const withRole = (role: TeamRole) =>
  buildTeamSweepstakes({
    team: buildTeam({ members: [buildMember({ role })] })
  });

describe.each(procedures)('$name', ({ call, reads }) => {
  const expectNoReads = () => {
    for (const read of reads()) {
      expect(read).not.toHaveBeenCalled();
    }
  };

  it('returns UNAUTHORIZED to a signed-out caller without reading the database', async () => {
    const result = await call();

    expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
      'Invalid session'
    );
    expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    expectNoReads();
  });

  it('looks up the sweepstakes through the caller membership and the team slug', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await call();

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: {
        id: SWEEPSTAKES_ID,
        team: {
          slug: TEAM_SLUG,
          members: { some: { userId: TEST_USER.id } }
        }
      },
      include: TEAM_SWEEPSTAKES_PAYLOAD
    });
  });

  it('returns NOT_FOUND to a signed-in caller who is not a member', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    const result = await call();

    expect(expectFailure(result, 'NOT_FOUND').message).toBe(
      'Sweepstakes not found'
    );
    expectNoReads();
  });

  it('returns FORBIDDEN to a blocked member', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      withRole(TeamRole.BLOCKED)
    );

    const result = await call();

    expect(expectFailure(result, 'FORBIDDEN').message).toBe(
      'You do not have permission to perform this action. Required permission: VIEW_SWEEPSTAKES'
    );
    expectNoReads();
  });

  it.each([TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST])(
    'lets a member with the %s role read it',
    async (role) => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(withRole(role));
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);
      prismaMock.prize.findMany.mockResolvedValue([]);

      const result = await call();

      expect(expectOk(result)).toEqual([]);
    }
  );
});
