import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SweepstakesStatus } from '@prisma/client';
import { validateSweepstakesState } from '../task-state';
import {
  applicationError,
  storedTask
} from '@giveaway/testing-server/fixtures-task-validation';

type StateTask = Parameters<typeof validateSweepstakesState>[0];

const START = new Date('2024-06-01T00:00:00.000Z');
const END = new Date('2024-06-30T00:00:00.000Z');
const NOW = new Date('2024-06-15T12:00:00.000Z');

const buildTask = ({
  status = 'ACTIVE',
  timing = { startDate: START, endDate: END }
}: {
  status?: SweepstakesStatus;
  timing?: { startDate: Date | null; endDate: Date | null } | null;
} = {}): StateTask => ({
  ...storedTask('task-1', { type: 'BONUS_TASK' }),
  sweepstakes: {
    id: 'sweep-1',
    status,
    teamId: 'team-1',
    createdAt: START,
    updatedAt: START,
    visibility: null,
    timing: timing
      ? {
          id: 'timing-1',
          sweepstakesId: 'sweep-1',
          timeZone: 'UTC',
          ...timing
        }
      : null
  }
});

describe('validateSweepstakesState', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the task is missing', () => {
    it.each([
      ['null', null],
      ['undefined', undefined]
    ])('throws NOT_FOUND for a %s task', async (_label, task) => {
      const error = await applicationError(() =>
        validateSweepstakesState(task)
      );

      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message:
          'Task does not exist. Refresh the page and try again, or contact support if the error persists.'
      });
    });
  });

  describe('when timing data is unusable', () => {
    it('throws INTERNAL_SERVER_ERROR when timing is missing', async () => {
      const error = await applicationError(() =>
        validateSweepstakesState(buildTask({ timing: null }))
      );

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Giveaway timing data is missing. Please contact support.'
      });
    });

    it.each([
      ['start date', { startDate: null, endDate: END }],
      ['end date', { startDate: START, endDate: null }]
    ])(
      'throws INTERNAL_SERVER_ERROR when the %s is missing',
      async (_label, timing) => {
        const error = await applicationError(() =>
          validateSweepstakesState(buildTask({ timing }))
        );

        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Giveaway timing data is incomplete. Please contact support.'
        });
      }
    );

    it('reports missing timing before checking the giveaway status', async () => {
      const error = await applicationError(() =>
        validateSweepstakesState(buildTask({ status: 'DRAFT', timing: null }))
      );

      expect(error.message).toBe(
        'Giveaway timing data is missing. Please contact support.'
      );
    });
  });

  describe('when the giveaway status does not accept entries', () => {
    it('throws FORBIDDEN for a draft giveaway', async () => {
      const error = await applicationError(() =>
        validateSweepstakesState(buildTask({ status: 'DRAFT' }))
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'This giveaway has not been published yet.',
        silent: false
      });
    });

    it('throws FORBIDDEN for a completed giveaway', async () => {
      const error = await applicationError(() =>
        validateSweepstakesState(buildTask({ status: 'COMPLETED' }))
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'This giveaway is no longer accepting entries.'
      });
    });

    it('checks the status before the dates', async () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

      const error = await applicationError(() =>
        validateSweepstakesState(buildTask({ status: 'COMPLETED' }))
      );

      expect(error.message).toBe(
        'This giveaway is no longer accepting entries.'
      );
    });
  });

  describe('when the giveaway is active', () => {
    it('does not throw while the giveaway is running', () => {
      expect(() => validateSweepstakesState(buildTask())).not.toThrow();
    });

    it('throws FORBIDDEN before the start date', async () => {
      vi.setSystemTime(new Date(START.getTime() - 1));

      const error = await applicationError(() =>
        validateSweepstakesState(buildTask())
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'This giveaway has not started yet.',
        silent: false
      });
    });

    it('accepts entries exactly at the start date', () => {
      vi.setSystemTime(START);

      expect(() => validateSweepstakesState(buildTask())).not.toThrow();
    });

    it('accepts entries exactly at the end date', () => {
      vi.setSystemTime(END);

      expect(() => validateSweepstakesState(buildTask())).not.toThrow();
    });

    it('throws a silent FORBIDDEN after the end date', async () => {
      vi.setSystemTime(new Date(END.getTime() + 1));

      const error = await applicationError(() =>
        validateSweepstakesState(buildTask())
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'This giveaway has ended and is no longer accepting entries.',
        silent: true
      });
    });
  });
});
