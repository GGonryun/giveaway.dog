import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { e2ePickerRequestSchema } from '@giveaway/e2e-model/extras';
import { seedE2ePicker, toE2eTweetUrl } from '../pickers';
import { e2eUser, NOW, realUser, teamRow } from './fixtures';

const db = asPrismaClient();
const NANOID = /^[\w-]{21}$/;
const DAY = 24 * 60 * 60 * 1000;

const seed = (request: Record<string, unknown>) =>
  seedE2ePicker({
    db,
    request: e2ePickerRequestSchema.parse({
      team: 'e2e-abc123-w0',
      ...request
    }),
    now: NOW
  });

const dataOf = (mock: { mock: { calls: unknown[][] } }) =>
  (mock.mock.calls[0][0] as { data: Record<string, unknown> }).data;

beforeEach(() => {
  prismaMock.team.findUnique.mockResolvedValue(teamRow());
});

describe('toE2eTweetUrl', () => {
  it('builds a post URL that no real account has', () => {
    expect(toE2eTweetUrl('p-0')).toBe('https://x.com/e2e/status/p-0');
  });
});

describe('seedE2ePicker', () => {
  it('creates an empty finished picker for the team by default, with no workflow run', async () => {
    const result = await seed({});

    const picker = dataOf(prismaMock.twitterPicker.create);
    expect(picker).toEqual({
      id: expect.stringMatching(NANOID),
      teamId: 'team-e2e-abc123-w0',
      status: 'COMPLETE',
      winners: 1,
      tweetUrls: [],
      runAt: null
    });
    expect(prismaMock.twitterPost.createMany).toHaveBeenCalledWith({
      data: []
    });
    expect(prismaMock.twitterPickerUser.createMany).toHaveBeenCalledWith({
      data: []
    });
    expect(prismaMock.twitterPickerDraw.createMany).toHaveBeenCalledWith({
      data: []
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: picker.id,
      team: 'e2e-abc123-w0',
      status: 'COMPLETE',
      users: [],
      posts: [],
      draws: []
    });
  });

  it('writes the filters, the posts, the users and the draws of the request', async () => {
    const result = await seed({
      status: 'PROCESSED',
      winners: 2,
      runIn: 3600,
      minFollowersCount: 5,
      requireBio: true,
      lastPostWithin: 'PAST_DAY',
      posts: [{ text: 'Win!', retweetCount: 7 }, {}],
      users: [
        { username: 'alice', createdDaysAgo: 10, followersCount: 3 },
        { username: 'bob' }
      ],
      draws: [{ user: 1, disqualified: 'Bot' }, { user: 0 }]
    });

    const picker = dataOf(prismaMock.twitterPicker.create);
    const pickerId = picker.id as string;
    expect(picker).toEqual({
      id: pickerId,
      teamId: 'team-e2e-abc123-w0',
      status: 'PROCESSED',
      winners: 2,
      minFollowersCount: 5,
      requireBio: true,
      lastPostWithin: 'PAST_DAY',
      tweetUrls: [
        `https://x.com/e2e/status/${pickerId}-0`,
        `https://x.com/e2e/status/${pickerId}-1`
      ],
      runAt: new Date(NOW.getTime() + 3_600_000)
    });

    const posts = dataOf(prismaMock.twitterPost.createMany) as never as Record<
      string,
      unknown
    >[];
    expect(posts).toEqual([
      {
        id: expect.stringMatching(NANOID),
        text: 'Win!',
        retweetCount: 7,
        tweetId: `${pickerId}-0`,
        userId: 'e2e',
        username: 'e2e',
        createdAt: NOW,
        pickerId
      },
      {
        id: expect.stringMatching(NANOID),
        tweetId: `${pickerId}-1`,
        userId: 'e2e',
        username: 'e2e',
        createdAt: NOW,
        pickerId
      }
    ]);

    const users = dataOf(
      prismaMock.twitterPickerUser.createMany
    ) as never as Record<string, unknown>[];
    expect(users).toEqual([
      {
        id: expect.stringMatching(NANOID),
        username: 'alice',
        followersCount: 3,
        userId: `${pickerId}-0`,
        createdAt: new Date(NOW.getTime() - 10 * DAY),
        pickerId
      },
      {
        id: expect.stringMatching(NANOID),
        username: 'bob',
        userId: `${pickerId}-1`,
        createdAt: null,
        pickerId
      }
    ]);

    const draws = dataOf(
      prismaMock.twitterPickerDraw.createMany
    ) as never as Record<string, unknown>[];
    expect(draws).toEqual([
      {
        id: expect.stringMatching(NANOID),
        pickerId,
        userId: users[1].id,
        disqualified: 'Bot'
      },
      {
        id: expect.stringMatching(NANOID),
        pickerId,
        userId: users[0].id,
        disqualified: undefined
      }
    ]);

    expect(result).toEqual({
      id: pickerId,
      team: 'e2e-abc123-w0',
      status: 'PROCESSED',
      users: [
        { id: users[0].id, username: 'alice' },
        { id: users[1].id, username: 'bob' }
      ],
      posts: [
        { id: posts[0].id, tweetId: `${pickerId}-0` },
        { id: posts[1].id, tweetId: `${pickerId}-1` }
      ],
      draws: [
        { id: draws[0].id, userId: users[1].id, disqualified: 'Bot' },
        { id: draws[1].id, userId: users[0].id, disqualified: null }
      ]
    });
  });

  it('runs a picker in the past', async () => {
    await seed({ runIn: -60 });

    expect(dataOf(prismaMock.twitterPicker.create).runAt).toEqual(
      new Date(NOW.getTime() - 60_000)
    );
  });

  it('gives each picker its own ids', async () => {
    await seed({ users: [{ username: 'a' }] });
    await seed({ users: [{ username: 'a' }] });

    const [first, second] = prismaMock.twitterPicker.create.mock.calls.map(
      ([args]) => args.data.id
    );
    expect(first).not.toBe(second);
  });

  it('refuses a team with a member who is not an e2e user, and writes nothing', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({
        members: [
          { role: 'OWNER', user: e2eUser('host') },
          { role: 'MEMBER', user: realUser() }
        ]
      })
    );

    await expect(seed({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
