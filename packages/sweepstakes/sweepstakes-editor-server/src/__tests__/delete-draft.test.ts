import { describe, it, expect, beforeEach } from 'vitest';
import { SweepstakesStatus, TeamRole } from '@giveaway/db-model';
import deleteDraft from '../delete-draft';
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

const withStatus = (status: SweepstakesStatus) =>
  buildTeamSweepstakes({ status });

describe('deleteDraft', () => {
  it('returns UNAUTHORIZED without touching the database', async () => {
    const result = await deleteDraft({ id: SWEEPSTAKES_ID });

    expectFailure(result, 'UNAUTHORIZED');
    expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.delete.mockResolvedValue({ id: SWEEPSTAKES_ID });
    });

    it('looks up the sweepstakes through the caller team membership', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await deleteDraft({ id: SWEEPSTAKES_ID });

      expectFailure(result, 'NOT_FOUND');
      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
      expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a member who cannot delete', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({ members: [buildMember({ role: TeamRole.ADMIN })] })
        })
      );

      const result = await deleteDraft({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: DELETE_SWEEPSTAKES'
      );
      expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
    });

    it.each([SweepstakesStatus.ACTIVE, SweepstakesStatus.COMPLETED])(
      'refuses to delete an %s sweepstakes',
      async (status) => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(withStatus(status));

        const result = await deleteDraft({ id: SWEEPSTAKES_ID });

        expect(expectFailure(result, 'CONFLICT').message).toBe(
          'Only a draft can be deleted from the editor'
        );
        expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
      }
    );

    it('deletes a draft by the id of the loaded record', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...withStatus(SweepstakesStatus.DRAFT),
        id: 'loaded-id'
      });

      const result = await deleteDraft({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({ slug: TEAM_SLUG });
      expect(prismaMock.sweepstakes.delete).toHaveBeenCalledWith({
        where: { id: 'loaded-id' }
      });
    });
  });
});
