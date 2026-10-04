import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkBlueskyConnect,
  checkBlueskyFollow,
  checkBlueskyLike,
  checkBlueskyRepost
} from '../bluesky';
import {
  BlueskyConnectTaskSchema,
  BlueskyFollowTaskSchema,
  BlueskyLikeTaskSchema,
  BlueskyRepostTaskSchema
} from '../../schemas';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db
} from '@giveaway/testing-server/fixtures-task-validation';

const bluesky = vi.hoisted(() => ({
  isUserFollowingTarget: vi.fn(),
  isUserLikingPost: vi.fn(),
  isUserRepostingPost: vi.fn()
}));

vi.mock('@giveaway/bluesky-api/bluesky/is-user-following-target', () => ({
  isUserFollowingTarget: bluesky.isUserFollowingTarget
}));

vi.mock('@giveaway/bluesky-api/bluesky/is-user-liking-post', () => ({
  isUserLikingPost: bluesky.isUserLikingPost
}));

vi.mock('@giveaway/bluesky-api/bluesky/is-user-reposting-post', () => ({
  isUserRepostingPost: bluesky.isUserRepostingPost
}));

const POST_URL = 'https://bsky.app/profile/alice.bsky.social/post/3kabc';

const connectTask: BlueskyConnectTaskSchema = {
  ...BASE_TASK,
  id: 'task-connect',
  type: 'BLUESKY_CONNECT'
};

const followTask = (profileUrl: string): BlueskyFollowTaskSchema => ({
  ...BASE_TASK,
  id: 'task-follow',
  type: 'BLUESKY_FOLLOW',
  profileUrl
});

const likeTask: BlueskyLikeTaskSchema = {
  ...BASE_TASK,
  id: 'task-like',
  type: 'BLUESKY_LIKE',
  postUrl: POST_URL
};

const repostTask: BlueskyRepostTaskSchema = {
  ...BASE_TASK,
  id: 'task-repost',
  type: 'BLUESKY_REPOST',
  postUrl: POST_URL
};

const input = <T>(task: T) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId
});

beforeEach(() => {
  for (const fn of Object.values(bluesky)) {
    fn.mockReset();
  }
});

const userWithAccounts = (providers: string[] | undefined) => ({
  id: IDS.userId,
  accounts: providers?.map((provider) => ({ provider }))
});

describe('checkBlueskyConnect', () => {
  it('loads the user together with their accounts', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userWithAccounts(['bluesky']));

    await checkBlueskyConnect(db, input(connectTask));

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: IDS.userId },
      include: { accounts: true }
    });
  });

  it('resolves when one of the accounts is a Bluesky account', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      userWithAccounts(['twitter', 'bluesky'])
    );

    await expect(
      checkBlueskyConnect(db, input(connectTask))
    ).resolves.toBeUndefined();
  });

  it.each([
    ['the user does not exist', null],
    ['the user has no accounts relation', userWithAccounts(undefined)],
    ['the user has no accounts', userWithAccounts([])],
    ['the user only has other providers', userWithAccounts(['twitter'])]
  ])('rejects with FORBIDDEN when %s', async (_label, user) => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    const error = await applicationError(
      checkBlueskyConnect(db, input(connectTask))
    );

    expect(error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'User does not have a Bluesky account connected'
    });
  });
});

describe('checkBlueskyFollow', () => {
  beforeEach(() => {
    bluesky.isUserFollowingTarget.mockResolvedValue(true);
  });

  it.each([
    ['a profile URL', 'https://bsky.app/profile/alice.bsky.social'],
    [
      'a profile URL with a trailing slash',
      'https://bsky.app/profile/alice.bsky.social/'
    ],
    ['a bare handle', 'alice.bsky.social']
  ])(
    'checks the follow status using the handle from %s',
    async (_label, profileUrl) => {
      await checkBlueskyFollow(db, {
        task: followTask(profileUrl),
        userId: IDS.userId
      });

      expect(bluesky.isUserFollowingTarget).toHaveBeenCalledWith(db, {
        userId: IDS.userId,
        targetHandle: 'alice.bsky.social'
      });
    }
  );

  it('keeps any extra path segments after the handle', async () => {
    await checkBlueskyFollow(db, {
      task: followTask('https://bsky.app/profile/alice.bsky.social/post/1'),
      userId: IDS.userId
    });

    expect(bluesky.isUserFollowingTarget).toHaveBeenCalledWith(db, {
      userId: IDS.userId,
      targetHandle: 'alice.bsky.social/post/1'
    });
  });

  it('resolves when the user follows the target', async () => {
    await expect(
      checkBlueskyFollow(db, {
        task: followTask('alice.bsky.social'),
        userId: IDS.userId
      })
    ).resolves.toBeUndefined();
  });

  it('rejects with a silent VALIDATION_ERROR naming the handle when not following', async () => {
    bluesky.isUserFollowingTarget.mockResolvedValue(false);

    const error = await applicationError(
      checkBlueskyFollow(db, {
        task: followTask('https://bsky.app/profile/alice.bsky.social'),
        userId: IDS.userId
      })
    );

    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'User is not following alice.bsky.social on Bluesky',
      silent: true
    });
  });

  it('propagates errors from the follow lookup', async () => {
    const failure = new Error('network down');
    bluesky.isUserFollowingTarget.mockRejectedValue(failure);

    await expect(
      checkBlueskyFollow(db, {
        task: followTask('alice.bsky.social'),
        userId: IDS.userId
      })
    ).rejects.toBe(failure);
  });
});

describe('checkBlueskyLike', () => {
  it('checks the like status for the post URL', async () => {
    bluesky.isUserLikingPost.mockResolvedValue(true);

    await checkBlueskyLike(db, input(likeTask));

    expect(bluesky.isUserLikingPost).toHaveBeenCalledWith(db, {
      userId: IDS.userId,
      postUrl: POST_URL
    });
  });

  it('resolves when the user liked the post', async () => {
    bluesky.isUserLikingPost.mockResolvedValue(true);

    await expect(
      checkBlueskyLike(db, input(likeTask))
    ).resolves.toBeUndefined();
  });

  it('rejects with a silent FORBIDDEN when the user has not liked the post', async () => {
    bluesky.isUserLikingPost.mockResolvedValue(false);

    const error = await applicationError(checkBlueskyLike(db, input(likeTask)));

    expect(error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'You have not liked this Bluesky post yet',
      silent: true
    });
  });
});

describe('checkBlueskyRepost', () => {
  it('checks the repost status for the post URL', async () => {
    bluesky.isUserRepostingPost.mockResolvedValue(true);

    await checkBlueskyRepost(db, input(repostTask));

    expect(bluesky.isUserRepostingPost).toHaveBeenCalledWith(db, {
      userId: IDS.userId,
      postUrl: POST_URL
    });
  });

  it('resolves when the user reposted the post', async () => {
    bluesky.isUserRepostingPost.mockResolvedValue(true);

    await expect(
      checkBlueskyRepost(db, input(repostTask))
    ).resolves.toBeUndefined();
  });

  it('rejects with a silent VALIDATION_ERROR when the user has not reposted', async () => {
    bluesky.isUserRepostingPost.mockResolvedValue(false);

    const error = await applicationError(
      checkBlueskyRepost(db, input(repostTask))
    );

    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'You have not reposted this Bluesky post yet',
      silent: true
    });
  });
});
