import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import { disqualifyParticipant } from '../disqualify-participant';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import {
  buildMember,
  buildTeam,
  buildTeamSweepstakes,
  SWEEPSTAKES_ID
} from './fixtures-procedures-sweepstakes-a';

const input = {
  sweepstakesId: SWEEPSTAKES_ID,
  participantId: 'participant-1',
  disqualificationReason: 'Bot activity'
};

const participant = {
  id: 'participant-1',
  userId: 'entrant-1',
  sweepstakesId: SWEEPSTAKES_ID
};

describe('disqualifyParticipant', () => {
  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await disqualifyParticipant(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('rejects a missing disqualification reason', async () => {
      signIn();

      const result = await disqualifyParticipant({
        sweepstakesId: SWEEPSTAKES_ID,
        participantId: 'participant-1'
      } as unknown as Parameters<typeof disqualifyParticipant>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller cannot manage the sweepstakes', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the sweepstakes through the caller team membership', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await disqualifyParticipant(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND from the shared lookup when the sweepstakes is missing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await disqualifyParticipant(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(
        prismaMock.sweepstakesParticipant.findFirst
      ).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a guest', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({ members: [buildMember({ role: TeamRole.GUEST })] })
        })
      );

      const result = await disqualifyParticipant(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('when the participant is not in the sweepstakes', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes()
      );
      prismaMock.sweepstakesParticipant.findFirst.mockResolvedValue(null);
    });

    it('scopes the participant lookup to the sweepstakes', async () => {
      await disqualifyParticipant(input);

      expect(prismaMock.sweepstakesParticipant.findFirst).toHaveBeenCalledWith({
        where: { id: 'participant-1', sweepstakesId: SWEEPSTAKES_ID }
      });
    });

    it('returns NOT_FOUND', async () => {
      const result = await disqualifyParticipant(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Participant not found in this sweepstakes.'
      );
    });

    it('does not modify completions or draws', async () => {
      await disqualifyParticipant(input);

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('when the participant is disqualified', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMember({ role: TeamRole.MEMBER })]
          })
        })
      );
      prismaMock.sweepstakesParticipant.findFirst.mockResolvedValue(
        participant
      );
    });

    it('returns success', async () => {
      const result = await disqualifyParticipant(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('runs both updates in one transaction', async () => {
      await disqualifyParticipant(input);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('rejects every non-rejected completion of the participant in this sweepstakes', async () => {
      await disqualifyParticipant(input);

      expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith({
        where: {
          participantId: 'participant-1',
          task: { sweepstakesId: SWEEPSTAKES_ID },
          status: { not: 'REJECTED' }
        },
        data: {
          status: 'REJECTED',
          reason: 'Participant disqualified: Bot activity'
        }
      });
    });

    it('disqualifies every winning draw of the participant in this sweepstakes', async () => {
      await disqualifyParticipant(input);

      expect(prismaMock.prizeDraw.updateMany).toHaveBeenCalledWith({
        where: {
          taskCompletion: {
            participantId: 'participant-1',
            task: { sweepstakesId: SWEEPSTAKES_ID }
          },
          result: 'WINNER'
        },
        data: {
          result: 'DISQUALIFIED',
          disqualificationReason: 'Participant disqualified: Bot activity'
        }
      });
    });

    it('trims surrounding whitespace from the reason', async () => {
      await disqualifyParticipant({
        ...input,
        disqualificationReason: '  Duplicate account  '
      });

      expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: 'REJECTED',
            reason: 'Participant disqualified: Duplicate account'
          }
        })
      );
      expect(prismaMock.prizeDraw.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            result: 'DISQUALIFIED',
            disqualificationReason:
              'Participant disqualified: Duplicate account'
          }
        })
      );
    });

    it.each(['', '   '])(
      'falls back to No reason provided when the reason is %j',
      async (reason) => {
        await disqualifyParticipant({
          ...input,
          disqualificationReason: reason
        });

        expect(prismaMock.taskCompletion.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              status: 'REJECTED',
              reason: 'Participant disqualified: No reason provided'
            }
          })
        );
        expect(prismaMock.prizeDraw.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              result: 'DISQUALIFIED',
              disqualificationReason:
                'Participant disqualified: No reason provided'
            }
          })
        );
      }
    );
  });

  describe('when the transaction fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes()
      );
      prismaMock.sweepstakesParticipant.findFirst.mockResolvedValue(
        participant
      );
    });

    it('stops before updating draws when rejecting completions fails', async () => {
      prismaMock.taskCompletion.updateMany.mockRejectedValue(
        knownRequestError('P2034')
      );

      const result = await disqualifyParticipant(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: .{6}$/
      );
      expect(prismaMock.prizeDraw.updateMany).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR with the error message', async () => {
      prismaMock.prizeDraw.updateMany.mockRejectedValue(new Error('deadlock'));

      const result = await disqualifyParticipant(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'deadlock'
      );
    });
  });
});
