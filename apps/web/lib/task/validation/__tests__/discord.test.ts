import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkDiscordJoin } from '../discord';
import { DiscordJoinTaskSchema } from '@giveaway/task-model/schemas';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db,
  jsonResponse,
  textResponse
} from '@giveaway/testing-server/fixtures-task-validation';

const tokens = vi.hoisted(() => ({ refreshDiscordToken: vi.fn() }));

vi.mock('@/lib/integrations/utils/refresh-discord-token', () => ({
  refreshDiscordToken: tokens.refreshDiscordToken
}));

const fetchMock = vi.fn<typeof fetch>();

const CHANNEL = 'https://discord.com/channels/123456789/987654321';

const buildTask = (channel = CHANNEL): DiscordJoinTaskSchema => ({
  ...BASE_TASK,
  id: 'task-discord',
  type: 'DISCORD_JOIN',
  invite: 'https://discord.gg/abc123',
  channel
});

const join = (channel?: string) =>
  checkDiscordJoin(db, { task: buildTask(channel), userId: IDS.userId });

const NOT_MEMBER = 'You are not a member of the required Discord server.';

describe('checkDiscordJoin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    tokens.refreshDiscordToken.mockReset();
    tokens.refreshDiscordToken.mockResolvedValue({
      access_token: 'discord-access',
      expires_at: 4102444800
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the user is a member of the server', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse({ user: { id: 'discord-1' } }));
    });

    it('resolves', async () => {
      await expect(join()).resolves.toBeUndefined();
    });

    it('refreshes the Discord token for the user', async () => {
      await join();

      expect(tokens.refreshDiscordToken).toHaveBeenCalledWith(db, {
        userId: IDS.userId
      });
    });

    it('queries the guild membership endpoint with the bearer token', async () => {
      await join();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/users/@me/guilds/123456789/member',
        { headers: { Authorization: 'Bearer discord-access' } }
      );
    });

    it('extracts the guild id from a www channel URL', async () => {
      await join('https://www.discord.com/channels/42/7');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/users/@me/guilds/42/member',
        expect.anything()
      );
    });
  });

  it('propagates token refresh failures without calling Discord', async () => {
    const failure = new Error('refresh failed');
    tokens.refreshDiscordToken.mockRejectedValue(failure);

    await expect(join()).rejects.toBe(failure);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('when the guild id cannot be extracted', () => {
    it.each([
      ['a channel URL without a channel id', 'https://discord.com/channels/42'],
      ['a discordapp.com channel URL', 'https://discordapp.com/channels/42/7']
    ])('rejects with INTERNAL_SERVER_ERROR for %s', async (_label, channel) => {
      const error = await applicationError(join(channel));

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to extract Guild ID from the channel URL.'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the membership request fails', () => {
    it('rejects with a silent VALIDATION_ERROR on a 404', async () => {
      fetchMock.mockResolvedValue(textResponse('Unknown Guild', 404));

      const error = await applicationError(join());

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: NOT_MEMBER,
        silent: true,
        cause: 'Unknown Guild'
      });
    });

    it('rejects with UNAUTHORIZED on a 401', async () => {
      fetchMock.mockResolvedValue(textResponse('401: Unauthorized', 401));

      const error = await applicationError(join());

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message:
          'Discord authorization is invalid. Please reconnect your Discord account.',
        silent: false,
        cause: '401: Unauthorized'
      });
    });

    it('rejects with INTERNAL_SERVER_ERROR on any other status', async () => {
      fetchMock.mockResolvedValue(textResponse('rate limited', 429));

      const error = await applicationError(join());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify Discord server membership.',
        cause: 'rate limited'
      });
    });
  });

  describe('when the membership response has no user', () => {
    it.each([
      ['a null body', null],
      ['a body without a user', { roles: [] }]
    ])(
      'rejects with a silent VALIDATION_ERROR for %s',
      async (_label, body) => {
        fetchMock.mockResolvedValue(jsonResponse(body));

        const error = await applicationError(join());

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: NOT_MEMBER,
          silent: true,
          cause: undefined
        });
      }
    );
  });
});
