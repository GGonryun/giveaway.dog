import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PickerStatus, TeamRole, TeamTier } from '@giveaway/db-model';
import { publishTwitterV2Picker } from '../publish-twitter-v2-picker';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  NOW,
  buildFormInput,
  buildPicker,
  buildTeam
} from '../../testing/fixtures-pickers';

const editablePicker = (overrides: Parameters<typeof buildPicker>[0] = {}) =>
  buildPicker({ status: PickerStatus.PROCESSED, ...overrides });

const DAY_MS = 24 * 60 * 60 * 1000;

const m = vi.hoisted(() => ({
  startScrapeTwitter: vi.fn()
}));

vi.mock('@giveaway/x-picker-workflow/scrape-twitter/start', () => ({
  startScrapeTwitter: m.startScrapeTwitter
}));

type PublishInput = Parameters<typeof publishTwitterV2Picker>[0];

const input = (overrides: Partial<PublishInput> = {}): PublishInput => ({
  pickerId: 'picker-1',
  slug: 'acme',
  data: buildFormInput(),
  ...overrides
});

describe('publishTwitterV2Picker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.startScrapeTwitter.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without starting a workflow', async () => {
      const result = await publishTwitterV2Picker(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(m.startScrapeTwitter).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ tier: TeamTier.FREE })
      );
      prismaMock.twitterPicker.findUnique.mockResolvedValue(editablePicker());
      m.startScrapeTwitter.mockResolvedValue({ runId: 'run-1' });
    });

    describe('with invalid input', () => {
      it('rejects form data without post urls', async () => {
        const result = await publishTwitterV2Picker(
          input({
            data: { ...buildFormInput(), setup: { postUrls: [] } }
          })
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('At least one post URL is required');
        expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
        expect(m.startScrapeTwitter).not.toHaveBeenCalled();
      });

      it('rejects a run date in the past', async () => {
        const result = await publishTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              timing: {
                runAt: new Date(NOW.getTime() - DAY_MS).toISOString(),
                timeZone: 'UTC'
              }
            }
          })
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Run date must be in the future');
        expect(m.startScrapeTwitter).not.toHaveBeenCalled();
      });

      it('rejects a run date beyond the schedule window', async () => {
        const result = await publishTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              timing: {
                runAt: new Date(NOW.getTime() + 30 * DAY_MS).toISOString(),
                timeZone: 'UTC'
              }
            }
          })
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Duration cannot exceed 14 days');
      });

      it('rejects a missing slug', async () => {
        const result = await publishTwitterV2Picker({
          pickerId: 'picker-1',
          data: buildFormInput()
        } as unknown as PublishInput);

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"slug"/
        );
      });
    });

    describe('team and picker checks', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        await publishTwitterV2Picker(input({ slug: 'dog-team' }));

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('allows a FREE team', async () => {
        const result = await publishTwitterV2Picker(input());

        expect(expectOk(result)).toEqual({ success: true });
      });

      it('returns NOT_FOUND when the team does not exist', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expect(m.startScrapeTwitter).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN for a guest member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.GUEST })
        );

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: UPDATE_PICKERS'
        );
        expect(m.startScrapeTwitter).not.toHaveBeenCalled();
      });

      it('looks the picker up within the team', async () => {
        await publishTwitterV2Picker(input({ pickerId: 'picker-42' }));

        expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
          where: { id: 'picker-42', teamId: 'team-1' }
        });
      });

      it('returns NOT_FOUND when the picker is not in the team', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Picker not found'
        );
        expect(m.startScrapeTwitter).not.toHaveBeenCalled();
      });

      it.each([
        PickerStatus.COMPLETE,
        PickerStatus.CANCELLED,
        PickerStatus.FAILED,
        PickerStatus.SUSPENDED
      ])(
        'returns CONFLICT without starting a workflow for a %s picker',
        async (status) => {
          prismaMock.twitterPicker.findUnique.mockResolvedValue(
            buildPicker({ status })
          );

          const result = await publishTwitterV2Picker(input());

          expect(expectFailure(result, 'CONFLICT').message).toBe(
            'This picker can no longer be edited'
          );
          expect(m.startScrapeTwitter).not.toHaveBeenCalled();
        }
      );
    });

    describe('starting the scrape workflow', () => {
      it('starts the workflow in process with the picker and the parsed form', async () => {
        const picker = editablePicker();
        prismaMock.twitterPicker.findUnique.mockResolvedValue(picker);

        await publishTwitterV2Picker(input());

        expect(m.startScrapeTwitter).toHaveBeenCalledTimes(1);
        expect(m.startScrapeTwitter).toHaveBeenCalledWith({
          picker,
          data: buildFormInput()
        });
      });

      it('sends the form with schema defaults applied', async () => {
        await publishTwitterV2Picker(
          input({
            data: {
              setup: { postUrls: [{ url: 'https://x.com/a/status/1' }] },
              actions: {},
              winners: {},
              filters: {}
            } as unknown as PublishInput['data']
          })
        );

        expect(m.startScrapeTwitter.mock.calls[0][0].data).toEqual({
          setup: { postUrls: [{ url: 'https://x.com/a/status/1' }] },
          actions: { repost: true, reply: false },
          winners: { quota: 1 },
          filters: {
            minimumPostCount: null,
            minimumAccountAgeDays: null,
            minimumFollowers: null,
            minimumFollowing: null,
            hasProfileImage: false,
            hasBanner: false,
            hasLocation: false,
            hasDescription: false
          }
        });
      });

      it('sends a valid future run date', async () => {
        const runAt = new Date(NOW.getTime() + DAY_MS).toISOString();

        await publishTwitterV2Picker(
          input({
            data: { ...buildFormInput(), timing: { runAt, timeZone: 'UTC' } }
          })
        );

        expect(m.startScrapeTwitter.mock.calls[0][0].data.timing).toEqual({
          runAt,
          timeZone: 'UTC'
        });
      });

      it('makes no HTTP request to the deployment', async () => {
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal('fetch', fetchMock);

        await publishTwitterV2Picker(input());

        expect(fetchMock).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
      });

      it('returns success when the workflow starts', async () => {
        const result = await publishTwitterV2Picker(input());

        expect(expectOk(result)).toEqual({ success: true });
      });

      it('does not update the picker itself', async () => {
        await publishTwitterV2Picker(input());

        expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
      });
    });

    describe('when the workflow fails to start', () => {
      it('returns INTERNAL_SERVER_ERROR with the error message', async () => {
        m.startScrapeTwitter.mockRejectedValue(new Error('world unavailable'));

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
          'world unavailable'
        );
      });
    });
  });
});
