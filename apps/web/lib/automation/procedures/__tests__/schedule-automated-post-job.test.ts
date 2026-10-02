import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scheduleAutomatedPostJob } from '../schedule-automated-post-job';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

type ScheduleInput = Parameters<typeof scheduleAutomatedPostJob>[0];

const NOW = new Date('2026-06-01T12:00:00.000Z');
const START = new Date('2026-06-02T12:00:00.000Z');
const END = new Date('2026-06-10T12:00:00.000Z');

const blueskyInput: ScheduleInput = {
  sweepstakesId: 'sweep-1',
  type: 'POST_TO_BLUESKY',
  request: { integrationId: 'bsky-int', text: 'Hello', tasks: ['LIKE'] }
};

const discordInput: ScheduleInput = {
  sweepstakesId: 'sweep-1',
  type: 'POST_TO_DISCORD',
  request: {
    integrationId: 'discord-int',
    channelId: 'channel-1',
    roles: [],
    tasks: []
  }
};

const sweepstakesRow = ({
  team = { id: 'team-1', members: [{ id: 'm-1', userId: TEST_USER.id }] },
  timing = { startDate: START, endDate: END }
}: {
  team?: { id: string; members: { id: string; userId: string }[] } | null;
  timing?: { startDate: Date | null; endDate: Date | null } | null;
} = {}) => ({
  id: 'sweep-1',
  team,
  timing
});

describe('scheduleAutomatedPostJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying the sweepstakes', async () => {
      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects twitter requests at input validation', async () => {
      const result = await scheduleAutomatedPostJob({
        ...blueskyInput,
        type: 'POST_TO_TWITTER'
      } as unknown as ScheduleInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes with caller memberships and timing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow());
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-int' });
      prismaMock.automatedPostJob.create.mockResolvedValue({ id: 'job-1' });

      await scheduleAutomatedPostJob(blueskyInput);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        include: {
          team: {
            include: { members: { where: { userId: TEST_USER.id } } }
          },
          timing: true
        }
      });
    });

    it('creates a pending bluesky job that runs at the sweepstakes start date', async () => {
      const created = { id: 'job-1', status: 'PENDING' };
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow());
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-int' });
      prismaMock.automatedPostJob.create.mockResolvedValue(created);

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectOk(result)).toEqual(created);
      expect(prismaMock.automatedPostJob.create).toHaveBeenCalledWith({
        data: {
          sweepstakes: { connect: { id: 'sweep-1' } },
          type: 'POST_TO_BLUESKY',
          status: 'PENDING',
          runAt: START,
          request: { integrationId: 'bsky-int', text: 'Hello', tasks: ['LIKE'] }
        }
      });
    });

    it('validates the bluesky integration against the sweepstakes team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow());
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-int' });
      prismaMock.automatedPostJob.create.mockResolvedValue({ id: 'job-1' });

      await scheduleAutomatedPostJob(blueskyInput);

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bsky-int',
          teamId: 'team-1',
          provider: 'BLUESKY',
          status: 'ACTIVE'
        }
      });
    });

    it('creates a discord job after validating the discord integration', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow());
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'discord-int' });
      prismaMock.automatedPostJob.create.mockResolvedValue({ id: 'job-2' });

      const result = await scheduleAutomatedPostJob(discordInput);

      expect(expectOk(result)).toEqual({ id: 'job-2' });
      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'discord-int',
          teamId: 'team-1',
          provider: 'DISCORD',
          status: 'ACTIVE'
        }
      });
      expect(prismaMock.automatedPostJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'POST_TO_DISCORD',
          runAt: START
        })
      });
    });

    it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.automatedPostJob.create).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({ team: null })
      );

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.automatedPostJob.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller is not a team member', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({ team: { id: 'team-1', members: [] } })
      );

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to modify this sweepstakes'
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('returns PRECONDITION_FAILED when the sweepstakes has no timing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({ timing: null })
      );

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'PRECONDITION_FAILED').message).toBe(
        'Sweepstakes start date is not set'
      );
    });

    it('returns PRECONDITION_FAILED when the start date is missing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({ timing: { startDate: null, endDate: END } })
      );

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'PRECONDITION_FAILED').message).toBe(
        'Sweepstakes start date is not set'
      );
    });

    it('returns PRECONDITION_FAILED when the end date is missing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({ timing: { startDate: START, endDate: null } })
      );

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'PRECONDITION_FAILED').message).toBe(
        'Sweepstakes end date is not set'
      );
    });

    it('returns PRECONDITION_FAILED when the sweepstakes already ended', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({
          timing: {
            startDate: new Date('2026-05-01T00:00:00.000Z'),
            endDate: new Date(NOW.getTime() - 1)
          }
        })
      );

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'PRECONDITION_FAILED').message).toBe(
        'Sweepstakes has already ended'
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('still schedules when the end date equals the current time', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({
          timing: { startDate: START, endDate: new Date(NOW.getTime()) }
        })
      );
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-int' });
      prismaMock.automatedPostJob.create.mockResolvedValue({ id: 'job-1' });

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectOk(result)).toEqual({ id: 'job-1' });
    });

    it('schedules even when the start date is already in the past', async () => {
      const pastStart = new Date('2026-05-01T00:00:00.000Z');
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesRow({ timing: { startDate: pastStart, endDate: END } })
      );
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-int' });
      prismaMock.automatedPostJob.create.mockResolvedValue({ id: 'job-1' });

      await scheduleAutomatedPostJob(blueskyInput);

      expect(prismaMock.automatedPostJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ runAt: pastStart })
      });
    });

    it('returns PRECONDITION_FAILED and creates nothing when the integration is inactive', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow());
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const result = await scheduleAutomatedPostJob(blueskyInput);

      expect(expectFailure(result, 'PRECONDITION_FAILED').message).toBe(
        'Bluesky integration not found or not active'
      );
      expect(prismaMock.automatedPostJob.create).not.toHaveBeenCalled();
    });
  });
});
