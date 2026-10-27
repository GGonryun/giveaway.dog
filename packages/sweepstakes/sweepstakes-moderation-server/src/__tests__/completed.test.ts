import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompletionStatus, SweepstakesStatus } from '@giveaway/db-model';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG,
  buildTeamSweepstakes
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-b';
import { deleteTaskCompletion } from '../delete-task-completion';
import { disqualifyParticipant } from '../disqualify-participant';
import { reverifyTaskCompletion } from '../reverify-task-completion';
import { updateTaskCompletionStatus } from '../update-task-completion-status';
import updateWinnerCriteria from '../update-winner-criteria';

const calls = [
  {
    name: 'updateTaskCompletionStatus',
    call: () =>
      updateTaskCompletionStatus({
        sweepstakesId: SWEEPSTAKES_ID,
        taskCompletionId: 'completion-1',
        status: CompletionStatus.REJECTED,
        reason: 'Changed my mind'
      })
  },
  {
    name: 'deleteTaskCompletion',
    call: () =>
      deleteTaskCompletion({
        sweepstakesId: SWEEPSTAKES_ID,
        taskCompletionId: 'completion-1'
      })
  },
  {
    name: 'reverifyTaskCompletion',
    call: () =>
      reverifyTaskCompletion({
        sweepstakesId: SWEEPSTAKES_ID,
        taskCompletionId: 'completion-1'
      })
  },
  {
    name: 'disqualifyParticipant',
    call: () =>
      disqualifyParticipant({
        sweepstakesId: SWEEPSTAKES_ID,
        participantId: 'participant-1',
        disqualificationReason: 'Used a bot'
      })
  },
  {
    name: 'updateWinnerCriteria',
    call: () =>
      updateWinnerCriteria({
        sweepstakesId: SWEEPSTAKES_ID,
        slug: TEAM_SLUG,
        minTasksCompleted: 1,
        minQualityScore: 0,
        allowMultipleWins: false,
        allowUserSelection: false
      })
  }
];

describe('a completed sweepstakes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      buildTeamSweepstakes({ status: SweepstakesStatus.COMPLETED })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(calls)(
    '$name returns FORBIDDEN and reads or writes nothing else',
    async ({ call }) => {
      const result = await call();

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Completed sweepstakes cannot be modified.'
      );
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
      expect(
        prismaMock.sweepstakesParticipant.findFirst
      ).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.delete).not.toHaveBeenCalled();
      expect(
        prismaMock.sweepstakesWinnerCriteria.update
      ).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    }
  );

  it.each([SweepstakesStatus.DRAFT, SweepstakesStatus.ACTIVE])(
    'still lets the host change the criteria of a %s sweepstakes',
    async (status) => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ status })
      );
      prismaMock.sweepstakesWinnerCriteria.update.mockResolvedValue({
        minTasksCompleted: 1,
        minQualityScore: 0,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: null
      } as never);

      const result = await calls[4].call();

      expectOk(result);
    }
  );
});
