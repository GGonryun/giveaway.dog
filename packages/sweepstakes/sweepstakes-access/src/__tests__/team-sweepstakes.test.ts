import { describe, it, expect } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { TEST_USER } from '@giveaway/testing-server/session';
import { ApplicationError } from '@giveaway/util-errors';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import { findTeamSweepstakes } from '../team-sweepstakes';
import {
  teamSweepstakes,
  teamSweepstakesQuery
} from '../testing/team-sweepstakes';

const find = () =>
  findTeamSweepstakes({
    db: prismaMock as never,
    userId: TEST_USER.id,
    sweepstakesId: SWEEPSTAKES_ID,
    slug: TEAM_SLUG
  });

const rejection = async () => {
  const error = await find().catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApplicationError);
  return error as ApplicationError;
};

describe('findTeamSweepstakes', () => {
  it('loads the sweepstakes only through the membership of the caller in the team of the slug', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await find().catch(() => undefined);

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith(
      teamSweepstakesQuery(TEAM_SLUG)
    );
  });

  it('throws NOT_FOUND naming the id when the caller is not a member', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    const error = await rejection();

    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe(
      `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
    );
  });

  it('throws NOT_FOUND when the sweepstakes has no team', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: SWEEPSTAKES_ID,
      team: null
    } as never);

    expect((await rejection()).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the team returns no membership row', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: SWEEPSTAKES_ID,
      team: { members: [] }
    } as never);

    expect((await rejection()).code).toBe('FORBIDDEN');
  });

  it('throws FORBIDDEN naming the permission for a blocked member', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      teamSweepstakes('BLOCKED') as never
    );

    const error = await rejection();

    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toContain('VIEW_SWEEPSTAKES');
  });

  it.each(['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as const)(
    'returns the sweepstakes to a member with the %s role',
    async (role) => {
      const loaded = teamSweepstakes(role);
      prismaMock.sweepstakes.findUnique.mockResolvedValue(loaded as never);

      await expect(find()).resolves.toEqual(loaded);
    }
  );
});
