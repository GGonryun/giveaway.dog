import { describe, it, expect, beforeEach } from 'vitest';
import { PickerStatus } from '@giveaway/db-model';
import { getPickersV2List } from '../get-pickers-v2-list';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildPicker } from '../../testing/fixtures-pickers';

describe('getPickersV2List', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying pickers', async () => {
      const result = await getPickersV2List({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.twitterPicker.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.twitterPicker.findMany.mockResolvedValue([]);
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
          where: { team: { slug: 'acme' }, status: undefined },
          orderBy: { createdAt: 'desc' }
        });
      });

      it('does not filter by status for ALL', async () => {
        await getPickersV2List({ slug: 'acme', status: 'ALL' });

        expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledWith({
          where: { team: { slug: 'acme' }, status: undefined },
          orderBy: { createdAt: 'desc' }
        });
      });

      it('filters by a specific status', async () => {
        await getPickersV2List({ slug: 'acme', status: PickerStatus.COMPLETE });

        expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledWith({
          where: { team: { slug: 'acme' }, status: 'COMPLETE' },
          orderBy: { createdAt: 'desc' }
        });
      });

      it('does not verify that the caller belongs to the team', async () => {
        await getPickersV2List({ slug: 'someone-elses-team' });

        expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledWith({
          where: { team: { slug: 'someone-elses-team' }, status: undefined },
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
