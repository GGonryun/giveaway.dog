import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { e2eUserExtrasRequestSchema } from '@giveaway/e2e-model/extras';
import {
  deleteOrphanE2eIpAddresses,
  seedE2eUserExtras,
  toE2eIpAddress
} from '../users';
import { NOW } from './fixtures';

const db = asPrismaClient();
const IP =
  /^2001:db8:e2e:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}$/;

const seed = (users: Record<string, unknown>[]) =>
  seedE2eUserExtras({
    db,
    request: e2eUserExtrasRequestSchema.parse({ ns: 'abc123w0', users }),
    now: NOW
  });

beforeEach(() => {
  prismaMock.user.upsert.mockImplementation((async (args: {
    where: { email: string };
  }) => ({
    id: `user-${args.where.email.split('@')[0]}`,
    email: args.where.email
  })) as never);
});

describe('toE2eIpAddress', () => {
  it('makes a new address in the documentation prefix each time', () => {
    const first = toE2eIpAddress();

    expect(first).toMatch(IP);
    expect(toE2eIpAddress()).not.toBe(first);
  });
});

describe('deleteOrphanE2eIpAddresses', () => {
  it('deletes only the e2e addresses that no user has', async () => {
    await deleteOrphanE2eIpAddresses(db);

    expect(prismaMock.ipAddress.deleteMany).toHaveBeenCalledWith({
      where: { ip: { startsWith: '2001:db8:e2e:' }, users: { none: {} } }
    });
  });
});

describe('seedE2eUserExtras', () => {
  it('signs up the persona in its namespace, and changes nothing else without extras', async () => {
    const result = await seed([
      { persona: 'participant' },
      { persona: 'newbie', ns: 'abc123p1' }
    ]);

    expect(prismaMock.user.upsert).toHaveBeenNthCalledWith(1, {
      where: { email: 'e2e-participant-abc123w0@example.com' },
      update: { accountType: 'PARTICIPANT', onboarded: true },
      create: {
        email: 'e2e-participant-abc123w0@example.com',
        emailVerified: NOW,
        name: 'E2E participant',
        accountType: 'PARTICIPANT',
        onboarded: true
      },
      select: { id: true, email: true }
    });
    expect(prismaMock.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-e2e-participant-abc123w0' },
      data: {}
    });
    expect(prismaMock.account.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.ipAddress.create).not.toHaveBeenCalled();
    expect(prismaMock.ipAddress.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.userQuality.create).not.toHaveBeenCalled();
    expect(prismaMock.userTurnstile.upsert).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      users: [
        {
          persona: 'participant',
          ns: 'abc123w0',
          userId: 'user-e2e-participant-abc123w0',
          email: 'e2e-participant-abc123w0@example.com',
          ip: null
        },
        {
          persona: 'newbie',
          ns: 'abc123p1',
          userId: 'user-e2e-newbie-abc123p1',
          email: 'e2e-newbie-abc123p1@example.com',
          ip: null
        }
      ]
    });
  });

  it('sets the source, the verified email and the birthday', async () => {
    await seed([
      {
        persona: 'participant',
        source: 'DISCORD_IMPORT',
        emailVerified: true,
        birthday: '2008-12-31'
      },
      { persona: 'participant2', emailVerified: false, birthday: null }
    ]);

    expect(prismaMock.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-e2e-participant-abc123w0' },
      data: {
        source: 'DISCORD_IMPORT',
        emailVerified: NOW,
        birthday: new Date('2008-12-31T00:00:00.000Z')
      }
    });
    expect(prismaMock.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-e2e-participant2-abc123w0' },
      data: { emailVerified: null, birthday: null }
    });
  });

  it('replaces the accounts of the user with one account of each identity', async () => {
    await seed([
      {
        persona: 'participant',
        accounts: [
          {
            identity: 'TWITTER',
            status: 'ERROR',
            scopes: ['tweet.read', 'users.read'],
            label: 'alice'
          },
          { identity: 'GOOGLE' }
        ]
      }
    ]);

    expect(prismaMock.account.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-e2e-participant-abc123w0' }
    });
    expect(prismaMock.account.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 'user-e2e-participant-abc123w0',
          type: 'oauth',
          provider: 'twitter',
          providerAccountId: 'e2e-participant-abc123w0',
          status: 'ERROR',
          scope: 'tweet.read users.read',
          label: 'alice'
        },
        {
          userId: 'user-e2e-participant-abc123w0',
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'e2e-participant-abc123w0',
          status: 'ACTIVE',
          scope: '',
          label: 'e2e-participant-abc123w0'
        }
      ]
    });
    expect(
      prismaMock.account.deleteMany.mock.invocationCallOrder[0]
    ).toBeLessThan(prismaMock.account.createMany.mock.invocationCallOrder[0]);
  });

  it('removes every account when the request sends none', async () => {
    await seed([{ persona: 'participant', accounts: [] }]);

    expect(prismaMock.account.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.account.createMany).toHaveBeenCalledWith({ data: [] });
  });

  it('gives the user a new e2e address in the given country, and drops its old e2e addresses', async () => {
    const result = await seed([
      {
        persona: 'participant',
        location: { country: 'Germany', countryCode: 'DE', city: 'Berlin' }
      }
    ]);

    expect(prismaMock.userIpAddress.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-e2e-participant-abc123w0',
        ip: { ip: { startsWith: '2001:db8:e2e:' } }
      }
    });
    const [{ data }] = prismaMock.ipAddress.create.mock.calls[0];
    expect(data).toEqual({
      ip: expect.stringMatching(IP),
      country: 'Germany',
      countryCode: 'DE',
      city: 'Berlin',
      users: { create: { userId: 'user-e2e-participant-abc123w0' } }
    });
    expect(prismaMock.ipAddress.deleteMany).toHaveBeenCalledWith({
      where: { ip: { startsWith: '2001:db8:e2e:' }, users: { none: {} } }
    });
    const order = (mock: { mock: { invocationCallOrder: number[] } }) =>
      mock.mock.invocationCallOrder[0];
    expect(order(prismaMock.userIpAddress.deleteMany)).toBeLessThan(
      order(prismaMock.ipAddress.create)
    );
    expect(order(prismaMock.ipAddress.create)).toBeLessThan(
      order(prismaMock.ipAddress.deleteMany)
    );
    expect(result.users[0].ip).toBe(data.ip);
  });

  it('adds a quality score', async () => {
    await seed([{ persona: 'participant', quality: 0 }]);

    expect(prismaMock.userQuality.create).toHaveBeenCalledWith({
      data: { userId: 'user-e2e-participant-abc123w0', score: 0 }
    });
  });

  it.each([
    [{ success: true }, { success: true, score: 1 }],
    [{ success: false }, { success: false, score: 0 }],
    [
      { success: true, score: 0.4 },
      { success: true, score: 0.4 }
    ],
    [
      { success: false, score: 0 },
      { success: false, score: 0 }
    ]
  ])('sets the Turnstile result %j', async (turnstile, expected) => {
    await seed([{ persona: 'participant', turnstile }]);

    expect(prismaMock.userTurnstile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-e2e-participant-abc123w0' },
      update: expected,
      create: { userId: 'user-e2e-participant-abc123w0', ...expected }
    });
  });
});
