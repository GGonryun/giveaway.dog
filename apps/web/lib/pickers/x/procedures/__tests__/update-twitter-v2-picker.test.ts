import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import { updateTwitterV2Picker } from '../update-twitter-v2-picker';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildFormInput, buildPicker, buildTeam } from './fixtures-pickers';

type UpdateInput = Parameters<typeof updateTwitterV2Picker>[0];

const input = (overrides: Partial<UpdateInput> = {}): UpdateInput => ({
  pickerId: 'picker-1',
  slug: 'acme',
  data: buildFormInput(),
  ...overrides
});

const updateData = () => prismaMock.twitterPicker.update.mock.calls[0][0].data;

describe('updateTwitterV2Picker', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await updateTwitterV2Picker(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());
      prismaMock.twitterPicker.update.mockResolvedValue(buildPicker());
    });

    describe('with invalid input', () => {
      it('rejects a disabled repost action', async () => {
        const result = await updateTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              actions: { repost: false, reply: false }
            }
          })
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Repost action must be enabled for V2 pickers');
        expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
      });

      it('rejects a missing picker id', async () => {
        const result = await updateTwitterV2Picker({
          slug: 'acme',
          data: buildFormInput()
        } as unknown as UpdateInput);

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"pickerId"/
        );
      });
    });

    describe('team and picker checks', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        await updateTwitterV2Picker(input({ slug: 'dog-team' }));

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('returns NOT_FOUND when the team does not exist', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);

        const result = await updateTwitterV2Picker(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN for a FREE team', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ tier: TeamTier.FREE })
        );

        const result = await updateTwitterV2Picker(input());

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'This feature requires a team with at least the PRO tier.'
        );
        expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN for a blocked member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.BLOCKED })
        );

        const result = await updateTwitterV2Picker(input());

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: UPDATE_PICKERS'
        );
      });

      it('looks the picker up by id only', async () => {
        await updateTwitterV2Picker(input({ pickerId: 'picker-42' }));

        expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
          where: { id: 'picker-42' }
        });
      });

      it('returns NOT_FOUND when the picker does not exist', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        const result = await updateTwitterV2Picker(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Picker not found'
        );
        expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN when the picker belongs to another team', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(
          buildPicker({ teamId: 'team-2' })
        );

        const result = await updateTwitterV2Picker(input());

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to update this picker'
        );
        expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN when the picker has no team', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(
          buildPicker({ teamId: null })
        );

        const result = await updateTwitterV2Picker(input());

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to update this picker'
        );
      });
    });

    describe('saving the form', () => {
      it('maps the form to picker columns', async () => {
        await updateTwitterV2Picker(
          input({
            pickerId: 'picker-42',
            data: {
              ...buildFormInput(),
              setup: {
                postUrls: [
                  { url: 'https://x.com/a/status/1' },
                  { url: 'https://x.com/b/status/2' }
                ]
              }
            }
          })
        );

        expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith({
          where: { id: 'picker-42' },
          data: {
            tweetUrls: ['https://x.com/a/status/1', 'https://x.com/b/status/2'],
            winners: 2,
            minPostCount: 10,
            minAccountAgeDays: 30,
            minFollowersCount: 50,
            minFollowingCount: 20,
            requireProfileImage: true,
            requireBannerImage: false,
            requireLocation: true,
            requireBio: false,
            lastPostWithin: 'PAST_WEEK',
            runAt: null
          }
        });
      });

      it('stores the scheduled run date', async () => {
        await updateTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              timing: { runAt: '2025-07-01T09:30:00.000Z', timeZone: 'UTC' }
            }
          })
        );

        expect(updateData().runAt).toEqual(
          new Date('2025-07-01T09:30:00.000Z')
        );
      });

      it('accepts a run date in the past', async () => {
        const result = await updateTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              timing: { runAt: '2000-01-01T00:00:00.000Z', timeZone: 'UTC' }
            }
          })
        );

        expectOk(result);
        expect(updateData().runAt).toEqual(
          new Date('2000-01-01T00:00:00.000Z')
        );
      });

      it('clears the run date when timing is undefined', async () => {
        await updateTwitterV2Picker(
          input({ data: { ...buildFormInput(), timing: undefined } })
        );

        expect(updateData().runAt).toBeNull();
      });

      it('clears the run date when the run date is empty', async () => {
        await updateTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              timing: { runAt: '', timeZone: 'UTC' }
            }
          })
        );

        expect(updateData().runAt).toBeNull();
      });

      it('stores the filter defaults when no filters are given', async () => {
        await updateTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              filters: {}
            } as unknown as UpdateInput['data']
          })
        );

        expect(updateData()).toMatchObject({
          minPostCount: null,
          minAccountAgeDays: null,
          minFollowersCount: null,
          minFollowingCount: null,
          requireProfileImage: false,
          requireBannerImage: false,
          requireLocation: false,
          requireBio: false,
          lastPostWithin: null
        });
      });

      it.each([
        ['hasProfileImage', 'requireProfileImage'],
        ['hasBanner', 'requireBannerImage'],
        ['hasLocation', 'requireLocation'],
        ['hasDescription', 'requireBio']
      ] as const)(
        'maps only the %s flag to the %s column',
        async (flag, column) => {
          const form = buildFormInput();

          await updateTwitterV2Picker(
            input({
              data: {
                ...form,
                filters: {
                  ...form.filters,
                  hasProfileImage: false,
                  hasBanner: false,
                  hasLocation: false,
                  hasDescription: false,
                  [flag]: true
                }
              }
            })
          );

          expect(updateData()).toMatchObject({
            requireProfileImage: column === 'requireProfileImage',
            requireBannerImage: column === 'requireBannerImage',
            requireLocation: column === 'requireLocation',
            requireBio: column === 'requireBio'
          });
        }
      );

      it('does not change the picker status', async () => {
        await updateTwitterV2Picker(input());

        expect(updateData()).not.toHaveProperty('status');
      });

      it('returns success', async () => {
        const result = await updateTwitterV2Picker(input());

        expect(expectOk(result)).toEqual({ success: true });
      });

      it('returns NOT_FOUND when the picker disappears before the update', async () => {
        prismaMock.twitterPicker.update.mockRejectedValue(
          knownRequestError('P2025')
        );

        const result = await updateTwitterV2Picker(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
        );
      });
    });
  });
});
