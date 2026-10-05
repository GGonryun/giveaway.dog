import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkVeloraConnect, checkVeloraFollow } from '../velora';
import {
  VeloraConnectTaskSchema,
  VeloraFollowTaskSchema
} from '@giveaway/task-model/schemas';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  BASE_TASK,
  IDS,
  db,
  jsonResponse,
  textResponse
} from '@giveaway/testing-server/fixtures-task-validation';
import { applicationError } from '@giveaway/util-errors/testing/application-error';

const tokens = vi.hoisted(() => ({ refreshVeloraToken: vi.fn() }));

vi.mock('@giveaway/velora-api/refresh-velora-token', () => ({
  refreshVeloraToken: tokens.refreshVeloraToken
}));

const fetchMock = vi.fn<typeof fetch>();

const connectTask: VeloraConnectTaskSchema = {
  ...BASE_TASK,
  id: 'task-velora-connect',
  type: 'VELORA_CONNECT'
};

const followTask = (profileUrl: string): VeloraFollowTaskSchema => ({
  ...BASE_TASK,
  id: 'task-velora-follow',
  type: 'VELORA_FOLLOW',
  profileUrl
});

const AUTH_HEADERS = {
  headers: {
    Authorization: 'Bearer velora-access',
    Accept: 'application/json'
  }
};

const follow = (profileUrl = 'https://velora.tv/gonryun') =>
  checkVeloraFollow(db, { task: followTask(profileUrl), userId: IDS.userId });

describe('checkVeloraConnect', () => {
  const input = {
    task: connectTask,
    userId: IDS.userId,
    participantId: IDS.participantId,
    teamId: IDS.teamId
  };

  it('loads the user together with their accounts', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: IDS.userId,
      accounts: [{ provider: 'velora' }]
    });

    await checkVeloraConnect(db, input);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: IDS.userId },
      include: { accounts: true }
    });
  });

  it('resolves when one of the accounts is a Velora account', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: IDS.userId,
      accounts: [{ provider: 'discord' }, { provider: 'velora' }]
    });

    await expect(checkVeloraConnect(db, input)).resolves.toBeUndefined();
  });

  it.each([
    ['the user does not exist', null],
    ['the user has no accounts relation', { id: IDS.userId }],
    ['the user has no accounts', { id: IDS.userId, accounts: [] }],
    [
      'the user only has other providers',
      { id: IDS.userId, accounts: [{ provider: 'bluesky' }] }
    ]
  ])('rejects with FORBIDDEN when %s', async (_label, user) => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    const error = await applicationError(checkVeloraConnect(db, input));

    expect(error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'User does not have a Velora account connected'
    });
  });
});

describe('checkVeloraFollow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    tokens.refreshVeloraToken.mockReset();
    tokens.refreshVeloraToken.mockResolvedValue({
      access_token: 'velora-access',
      expires_at: 4102444800
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the user follows the target', () => {
    beforeEach(() => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ id: 'velora-user-9' }))
        .mockResolvedValueOnce(jsonResponse({ isFollowing: true }));
    });

    it('resolves', async () => {
      await expect(follow()).resolves.toBeUndefined();
    });

    it('refreshes the Velora token for the user', async () => {
      await follow();

      expect(tokens.refreshVeloraToken).toHaveBeenCalledWith(db, {
        userId: IDS.userId
      });
    });

    it('looks up the target user and then the follow status', async () => {
      await follow();

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.velora.tv/api/users/gonryun',
        AUTH_HEADERS
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.velora.tv/api/users/follow-status/velora-user-9',
        AUTH_HEADERS
      );
    });

    it('extracts the username from a www URL with a trailing slash', async () => {
      await follow('https://www.velora.tv/go.ry-un_1/');

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.velora.tv/api/users/go.ry-un_1',
        AUTH_HEADERS
      );
    });
  });

  it('propagates token refresh failures without calling Velora', async () => {
    const failure = new Error('refresh failed');
    tokens.refreshVeloraToken.mockRejectedValue(failure);

    await expect(follow()).rejects.toBe(failure);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects with INTERNAL_SERVER_ERROR when the username cannot be extracted', async () => {
    const error = await applicationError(follow('https://velora.tv/a/b'));

    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to extract username from Velora profile URL.'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('when the user lookup fails', () => {
    it('rejects with UNAUTHORIZED on a 401', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('bad token', 401));

      const error = await applicationError(follow());

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message:
          'Velora authorization is invalid. Please reconnect your Velora account.',
        cause: 'bad token'
      });
    });

    it('rejects with NOT_FOUND naming the user on a 404', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('missing', 404));

      const error = await applicationError(follow());

      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'User gonryun not found on Velora.',
        cause: undefined
      });
    });

    it('rejects with INTERNAL_SERVER_ERROR on any other status', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('boom', 500));

      const error = await applicationError(follow());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user information from Velora.',
        cause: 'boom'
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the follow status lookup fails', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'velora-user-9' }));
    });

    it('rejects with UNAUTHORIZED on a 401', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('expired', 401));

      const error = await applicationError(follow());

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message:
          'Velora authorization is invalid. Please reconnect your Velora account.',
        cause: 'expired'
      });
    });

    it('rejects with INTERNAL_SERVER_ERROR on any other status', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('unavailable', 503));

      const error = await applicationError(follow());

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify Velora follow status.',
        cause: 'unavailable'
      });
    });
  });

  describe('when the user does not follow the target', () => {
    it.each([
      ['isFollowing is false', { isFollowing: false }],
      ['isFollowing is missing', {}]
    ])(
      'rejects with a silent VALIDATION_ERROR when %s',
      async (_label, body) => {
        fetchMock
          .mockResolvedValueOnce(jsonResponse({ id: 'velora-user-9' }))
          .mockResolvedValueOnce(jsonResponse(body));

        const error = await applicationError(follow());

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message:
            'You must be following gonryun on Velora to complete this task.',
          silent: true
        });
      }
    );
  });
});
