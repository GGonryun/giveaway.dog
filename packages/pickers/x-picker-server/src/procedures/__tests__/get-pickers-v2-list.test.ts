import { describe, it, expect, beforeEach } from 'vitest';
import { PickerStatus, TeamRole, TeamTier } from '@giveaway/db-model';
import { getPickersV2List } from '../get-pickers-v2-list';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildPicker, buildTeam } from '../../testing/fixtures-pickers';

describe('getPickersV2List', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without reading the team or the pickers', async () => {
      const result = await getPickersV2List({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.findMany.mockResolvedValue([]);
    });

    describe('team access', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        await getPickersV2List({ slug: 'dog-team' });

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('returns NOT_FOUND without listing pickers when the caller is not a member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);

        const result = await getPickersV2List({ slug: 'someone-elses-team' });

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expect(prismaMock.twitterPicker.findMany).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN without listing pickers for a blocked member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.BLOCKED })
        );

        const result = await getPickersV2List({ slug: 'acme' });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: VIEW_PICKERS'
        );
        expect(prismaMock.twitterPicker.findMany).not.toHaveBeenCalled();
      });

      it('lists the pickers for a guest of a FREE team', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.GUEST, tier: TeamTier.FREE })
        );

        const result = await getPickersV2List({ slug: 'acme' });

        expect(expectOk(result)).toEqual({ pickers: [] });
      });

      it('scopes the picker query to the id of the caller team', async () => {
        prismaMock.team.findUnique.mockResolvedValue({
          ...buildTeam(),
          id: 'team-7'
        });

        await getPickersV2List({ slug: 'acme' });

        expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledWith({
          where: { teamId: 'team-7', status: undefined },
          orderBy: { createdAt: 'desc' }
        });
      });
    });

    describe('with invalid input', () => {
      it('rejects a missing slug', async () => {
        const result = await getPickersV2List(
          {} as unknown as Parameters<typeof getPickersV2List>[0]
        );

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"slug"/
        );
        expect(prismaMock.twitterPicker.findMany).not.toHaveBeenCalled();
      });

      it('rejects an unknown status filter', async () => {
        const result = await getPickersV2List({
          slug: 'acme',
          status: 'archived'
        } as unknown as Parameters<typeof getPickersV2List>[0]);

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"status"/
        );
      });
    });

    describe('filtering', () => {
      it('queries the team pickers newest first without a status filter', async () => {
        await getPickersV2List({ slug: 'acme' });

        expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledWith({
          where: { teamId: 'team-1', status: undefined },
          orderBy: { createdAt: 'desc' }
        });
      });

      it('does not filter by status for ALL', async () => {
        await getPickersV2List({ slug: 'acme', status: 'ALL' });

        expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledWith({
          where: { teamId: 'team-1', status: undefined },
          orderBy: { createdAt: 'desc' }
        });
      });

      it('filters by a specific status', async () => {
        await getPickersV2List({ slug: 'acme', status: PickerStatus.COMPLETE });

        expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledWith({
          where: { teamId: 'team-1', status: 'COMPLETE' },
          orderBy: { createdAt: 'desc' }
        });
      });
    });

    describe('formatting', () => {
      it('returns an empty list when the team has no pickers', async () => {
        const result = await getPickersV2List({ slug: 'acme' });

        expect(expectOk(result)).toEqual({ pickers: [] });
      });

      it('maps each picker to a list item named after its id', async () => {
        prismaMock.twitterPicker.findMany.mockResolvedValue([
          buildPicker({
            id: 'p-1',
            status: PickerStatus.DRAFT,
            updatedAt: new Date('2025-03-01T00:00:00.000Z')
          }),
          buildPicker({
            id: 'p-2',
            status: PickerStatus.COMPLETE,
            updatedAt: new Date('2025-02-01T00:00:00.000Z')
          })
        ]);

        const result = await getPickersV2List({ slug: 'acme' });

        expect(expectOk(result)).toEqual({
          pickers: [
            {
              pickerId: 'p-1',
              status: 'DRAFT',
              type: 'TWITTER',
              updatedAt: new Date('2025-03-01T00:00:00.000Z'),
              name: 'p-1'
            },
            {
              pickerId: 'p-2',
              status: 'COMPLETE',
              type: 'TWITTER',
              updatedAt: new Date('2025-02-01T00:00:00.000Z'),
              name: 'p-2'
            }
          ]
        });
      });

      it('fails output validation for a picker with an unknown status', async () => {
        prismaMock.twitterPicker.findMany.mockResolvedValue([
          buildPicker({ status: 'ARCHIVED' as unknown as PickerStatus })
        ]);

        const result = await getPickersV2List({ slug: 'acme' });

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Output validation failed');
      });
    });
  });
});
