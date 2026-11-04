import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SweepstakesStatus, TeamTier } from '@giveaway/db-model';
import updateSweepstakes from '../update-sweepstakes';
import publishSweepstakes from '../publish-sweepstakes';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG,
  buildTeam,
  buildTeamSweepstakes,
  stubSweepstakesRewrite
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-b';

const DAY_MS = 24 * 60 * 60 * 1000;
const START = new Date('2026-06-20T00:00:00.000Z');
const after = (days: number, ms = 0) =>
  new Date(START.getTime() + days * DAY_MS + ms);

const timing = (endDate: Date) => ({
  startDate: START,
  endDate,
  timeZone: 'UTC'
});

const stubSweepstakes = (
  tier: TeamTier,
  status: SweepstakesStatus = SweepstakesStatus.DRAFT
) =>
  prismaMock.sweepstakes.findUnique.mockResolvedValue(
    buildTeamSweepstakes({ status, team: buildTeam({ tier }) })
  );

const PROCEDURES = [
  ['saving', updateSweepstakes],
  ['publishing', publishSweepstakes]
] as const;

describe('the duration limit of the team tier on the server', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubSweepstakesRewrite(prismaMock);
    signIn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe.each(PROCEDURES)('%s', (_, run) => {
    it.each([
      [TeamTier.FREE, 7, 'a Free'],
      [TeamTier.PRO, 30, 'a Pro'],
      [TeamTier.ELITE, 90, 'an Elite'],
      [TeamTier.ALPHA, 90, 'an Alpha']
    ])(
      '[TIER-004] refuses a giveaway of a %s team longer than %i days',
      async (tier, days, label) => {
        stubSweepstakes(tier);

        const result = await run({
          id: SWEEPSTAKES_ID,
          timing: timing(after(days, 1))
        });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          `A giveaway of ${label} team runs for at most ${days} days. Upgrade the team to run a longer giveaway.`
        );
        expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
        expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
      }
    );

    it.each([
      [TeamTier.FREE, 7],
      [TeamTier.PRO, 30],
      [TeamTier.ELITE, 90]
    ])(
      '[TIER-004] accepts a giveaway of a %s team that runs exactly %i days',
      async (tier, days) => {
        stubSweepstakes(tier);

        const result = await run({
          id: SWEEPSTAKES_ID,
          timing: timing(after(days))
        });

        expect(expectOk(result)).toEqual({ slug: TEAM_SLUG });
      }
    );

    it('[TIER-004] refuses a long draft whose dates did not change', async () => {
      stubSweepstakes(TeamTier.FREE, SweepstakesStatus.DRAFT);
      prismaMock.sweepstakesTiming.findUnique.mockResolvedValue({
        startDate: START,
        endDate: after(30)
      } as never);

      const result = await run({
        id: SWEEPSTAKES_ID,
        timing: timing(after(30))
      });

      expectFailure(result, 'FORBIDDEN');
    });
  });

  it('[TIER-005] saves a published giveaway longer than the limit when its dates did not change', async () => {
    stubSweepstakes(TeamTier.FREE, SweepstakesStatus.ACTIVE);
    prismaMock.sweepstakesTiming.findUnique.mockResolvedValue({
      startDate: START,
      endDate: after(30)
    } as never);

    const result = await updateSweepstakes({
      id: SWEEPSTAKES_ID,
      timing: { ...timing(after(30)), startDate: START.toISOString() }
    } as never);

    expect(expectOk(result)).toEqual({ slug: TEAM_SLUG });
    expect(prismaMock.sweepstakesTiming.findUnique).toHaveBeenCalledWith({
      where: { sweepstakesId: SWEEPSTAKES_ID },
      select: { startDate: true, endDate: true }
    });
  });

  it('[TIER-005] refuses a published giveaway when a changed date makes it longer than the limit', async () => {
    stubSweepstakes(TeamTier.FREE, SweepstakesStatus.ACTIVE);
    prismaMock.sweepstakesTiming.findUnique.mockResolvedValue({
      startDate: START,
      endDate: after(30)
    } as never);

    const result = await updateSweepstakes({
      id: SWEEPSTAKES_ID,
      timing: timing(after(31))
    });

    expectFailure(result, 'FORBIDDEN');
    expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
  });

  it('accepts a save without both dates', async () => {
    stubSweepstakes(TeamTier.FREE);

    const result = await updateSweepstakes({
      id: SWEEPSTAKES_ID,
      timing: { startDate: START }
    });

    expect(expectOk(result)).toEqual({ slug: TEAM_SLUG });
    expect(prismaMock.sweepstakesTiming.findUnique).not.toHaveBeenCalled();
  });
});
