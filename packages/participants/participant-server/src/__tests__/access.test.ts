import { describe, it, expect } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import { getSweepstakesParticipants } from '../get-sweepstakes-participants';
import { getSweepstakesParticipant } from '../get-sweepstake-participant';
import { getTeamParticipant } from '../get-team-participant';
import { getTeamParticipants } from '../get-team-participants';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import {
  buildMember,
  buildTeam,
  buildTeamSweepstakes,
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import {
  buildParticipantRow,
  buildUserRow
} from '@giveaway/participant-model/testing/fixtures-participant-referrals-automation';

const ALLOWED_ROLES = [
  TeamRole.OWNER,
  TeamRole.ADMIN,
  TeamRole.MEMBER,
  TeamRole.GUEST
];

const teamWithRole = (role: TeamRole) =>
  buildTeam({ members: [buildMember({ role })] });

const FORBIDDEN_MESSAGE =
  'You do not have permission to perform this action. Required permission: VIEW_SWEEPSTAKES';

describe.each([
  {
    name: 'getSweepstakesParticipants',
    call: () =>
      getSweepstakesParticipants({
        slug: TEAM_SLUG,
        sweepstakesId: SWEEPSTAKES_ID
      }),
    reads: () => [prismaMock.sweepstakesParticipant.findMany],
    stubReads: () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);
    }
  },
  {
    name: 'getSweepstakesParticipant',
    call: () =>
      getSweepstakesParticipant({
        slug: TEAM_SLUG,
        sweepstakesId: SWEEPSTAKES_ID,
        userId: 'user-2'
      }),
    reads: () => [prismaMock.sweepstakesParticipant.findUnique],
    stubReads: () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        buildParticipantRow()
      );
    }
  }
])('$name', ({ call, reads, stubReads }) => {
  const expectNoReads = () => {
    for (const read of reads()) {
      expect(read).not.toHaveBeenCalled();
    }
  };

  it('returns UNAUTHORIZED to a signed-out caller without reading the database', async () => {
    const result = await call();

    expectFailure(result, 'UNAUTHORIZED');
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
      buildTeamSweepstakes({ team: teamWithRole(TeamRole.BLOCKED) })
    );

    const result = await call();

    expect(expectFailure(result, 'FORBIDDEN').message).toBe(FORBIDDEN_MESSAGE);
    expectNoReads();
  });

  it.each(ALLOWED_ROLES)(
    'lets a member with the %s role read it',
    async (role) => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ team: teamWithRole(role) })
      );
      stubReads();

      const result = await call();

      expectOk(result);
    }
  );
});

describe.each([
  {
    name: 'getTeamParticipant',
    call: () => getTeamParticipant({ slug: TEAM_SLUG, userId: 'user-2' }),
    reads: () => [prismaMock.user.findFirst],
    stubReads: () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...buildUserRow(),
        participation: []
      });
    }
  },
  {
    name: 'getTeamParticipants',
    call: () =>
      getTeamParticipants({ slug: TEAM_SLUG } as Parameters<
        typeof getTeamParticipants
      >[0]),
    reads: () => [prismaMock.user.count, prismaMock.user.findMany],
    stubReads: () => {
      prismaMock.user.count.mockResolvedValue(0);
      prismaMock.user.findMany.mockResolvedValue([]);
    }
  }
])('$name', ({ call, reads, stubReads }) => {
  const expectNoReads = () => {
    for (const read of reads()) {
      expect(read).not.toHaveBeenCalled();
    }
  };

  it('returns UNAUTHORIZED to a signed-out caller without reading the database', async () => {
    const result = await call();

    expectFailure(result, 'UNAUTHORIZED');
    expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    expectNoReads();
  });

  it('looks up the team through the caller membership', async () => {
    signIn();
    prismaMock.team.findUnique.mockResolvedValue(null);

    await call();

    expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
      where: {
        slug: TEAM_SLUG,
        members: { some: { userId: TEST_USER.id } }
      },
      include: { members: true }
    });
  });

  it('returns NOT_FOUND to a signed-in caller who is not a member', async () => {
    signIn();
    prismaMock.team.findUnique.mockResolvedValue(null);

    const result = await call();

    expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
    expectNoReads();
  });

  it('returns FORBIDDEN to a blocked member', async () => {
    signIn();
    prismaMock.team.findUnique.mockResolvedValue(
      teamWithRole(TeamRole.BLOCKED)
    );

    const result = await call();

    expect(expectFailure(result, 'FORBIDDEN').message).toBe(FORBIDDEN_MESSAGE);
    expectNoReads();
  });

  it.each(ALLOWED_ROLES)(
    'lets a member with the %s role read it',
    async (role) => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(teamWithRole(role));
      stubReads();

      const result = await call();

      expectOk(result);
    }
  );
});
