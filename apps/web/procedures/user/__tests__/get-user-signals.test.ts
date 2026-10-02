import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccountStatus, type Account } from '@prisma/client';
import { getUserSignals, type UserSignals } from '../get-user-signals';
import { prismaMock } from '@/test/prisma';
import { dbUser } from './fixtures-procedures-user';

const USER_ID = 'user-7';
const NOW = new Date('2026-10-01T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = new Date(NOW.getTime() - 30 * DAY);

const ZERO_SIGNALS: UserSignals = {
  deviceStability: 0,
  ipConsistency: 0,
  geoConsistency: 0,
  providersConnected: 0,
  emailVerified: 0,
  taskActivity: 0,
  taskDiversity: 0,
  accountAge: 0,
  overlappingIpAddresses: 0,
  overlappingFingerprints: 0,
  turnstileTrust: 0
};

const account = (provider: string): Account => ({
  userId: USER_ID,
  type: 'oauth',
  provider,
  providerAccountId: `${provider}-account`,
  refresh_token: null,
  access_token: null,
  expires_at: null,
  token_type: null,
  scope: null,
  id_token: null,
  session_state: null,
  label: null,
  link: null,
  status: AccountStatus.ACTIVE,
  createdAt: NOW,
  updatedAt: NOW
});

type UserOptions = {
  createdAt?: Date;
  emailVerified?: Date | null;
  accounts?: Account[];
};

const signalsUser = ({
  createdAt = NOW,
  emailVerified = null,
  accounts = []
}: UserOptions = {}) => ({
  ...dbUser({ id: USER_ID, createdAt, emailVerified }),
  accounts
});

type IpOptions = {
  regionCode?: string | null;
  countryCode?: string | null;
  continentCode?: string | null;
  users?: string[];
};

const ipRow = ({
  regionCode = 'ON',
  countryCode = 'CA',
  continentCode = 'NA',
  users = [USER_ID]
}: IpOptions = {}) => ({
  ip: {
    regionCode,
    countryCode,
    continentCode,
    users: users.map((userId) => ({ userId }))
  }
});

const fingerprintRow = (
  count: number,
  users: string[] = [USER_ID],
  fingerprint = `fp-${count}-${users.join('-')}`
) => ({
  fingerprint: {
    fingerprint,
    users: users.map((userId) => ({ userId }))
  },
  count
});

const completionRow = (taskId: string, index = 0) => ({
  id: `completion-${taskId}-${index}`,
  participantId: 'participant-1',
  taskId,
  completedAt: NOW,
  proof: null,
  reason: null,
  status: 'COMPLETED'
});

const completions = (count: number, taskId?: string) =>
  Array.from({ length: count }, (_, index) =>
    completionRow(taskId ?? `task-${index}`, index)
  );

type Turnstile = { success: boolean; score: number | null } | null;

type SetupOptions = {
  user?: ReturnType<typeof signalsUser> | null;
  completions?: ReturnType<typeof completionRow>[];
  ips?: ReturnType<typeof ipRow>[];
  fingerprints?: ReturnType<typeof fingerprintRow>[];
  turnstile?: Turnstile;
};

const setup = ({
  user = signalsUser(),
  completions: completionRows = [],
  ips = [],
  fingerprints = [],
  turnstile = null
}: SetupOptions = {}) => {
  prismaMock.user.findUnique.mockResolvedValue(user);
  prismaMock.taskCompletion.findMany.mockResolvedValue(completionRows);
  prismaMock.userIpAddress.findMany.mockResolvedValue(ips);
  prismaMock.userFingerprint.findMany.mockResolvedValue(fingerprints);
  prismaMock.userTurnstile.findUnique.mockResolvedValue(
    turnstile && {
      id: 'turnstile-1',
      userId: USER_ID,
      token: 'token',
      createdAt: NOW,
      updatedAt: NOW,
      ...turnstile
    }
  );
};

describe('getUserSignals', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the user does not exist', () => {
    it('returns all signals as zero', async () => {
      setup({ user: null });

      const result = await getUserSignals(USER_ID);

      expect(result).toEqual(ZERO_SIGNALS);
    });

    it('does not load any further activity', async () => {
      setup({ user: null });

      await getUserSignals(USER_ID);

      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
      expect(prismaMock.userIpAddress.findMany).not.toHaveBeenCalled();
      expect(prismaMock.userFingerprint.findMany).not.toHaveBeenCalled();
      expect(prismaMock.userTurnstile.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('queries', () => {
    beforeEach(() => {
      setup();
    });

    it('loads the user with linked accounts', async () => {
      await getUserSignals(USER_ID);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        include: { accounts: true }
      });
    });

    it('loads up to 100 task completions from the last 30 days, newest first', async () => {
      await getUserSignals(USER_ID);

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          participant: { userId: USER_ID },
          completedAt: { gte: THIRTY_DAYS_AGO }
        },
        orderBy: { completedAt: 'desc' },
        take: 100
      });
    });

    it('loads ip addresses used in the last 30 days with their geo data and users', async () => {
      await getUserSignals(USER_ID);

      expect(prismaMock.userIpAddress.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, updatedAt: { gte: THIRTY_DAYS_AGO } },
        orderBy: { updatedAt: 'desc' },
        select: {
          ip: {
            select: {
              regionCode: true,
              countryCode: true,
              continentCode: true,
              users: { select: { userId: true } }
            }
          }
        }
      });
    });

    it('loads every fingerprint with its users and session count', async () => {
      await getUserSignals(USER_ID);

      expect(prismaMock.userFingerprint.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { updatedAt: 'desc' },
        select: {
          fingerprint: {
            select: {
              fingerprint: true,
              users: { select: { userId: true } }
            }
          },
          count: true
        }
      });
    });

    it('loads the turnstile result of the user', async () => {
      await getUserSignals(USER_ID);

      expect(prismaMock.userTurnstile.findUnique).toHaveBeenCalledWith({
        where: { userId: USER_ID }
      });
    });
  });

  it('returns all signals as zero for a brand new user with no activity', async () => {
    setup();

    const result = await getUserSignals(USER_ID);

    expect(result).toEqual(ZERO_SIGNALS);
  });

  it('combines every signal for an established user', async () => {
    setup({
      user: signalsUser({
        createdAt: new Date(NOW.getTime() - 35 * DAY),
        emailVerified: NOW,
        accounts: [account('twitter'), account('google')]
      }),
      completions: completions(7),
      ips: [ipRow(), ipRow({ regionCode: 'QC', users: [USER_ID, 'user-8'] })],
      fingerprints: [fingerprintRow(9), fingerprintRow(1, ['user-8'])],
      turnstile: { success: true, score: 0.9 }
    });

    const result = await getUserSignals(USER_ID);

    expect(result).toEqual({
      deviceStability: 18,
      ipConsistency: 15,
      geoConsistency: 5,
      providersConnected: 4,
      emailVerified: 10,
      taskActivity: 2,
      taskDiversity: 7,
      accountAge: 4,
      overlappingIpAddresses: -30,
      overlappingFingerprints: -30,
      turnstileTrust: 8
    });
  });

  describe('deviceStability', () => {
    it.each([
      [[], 0],
      [[0], 0],
      [[10], 20],
      [[8, 2], 16],
      [[3, 1], 14],
      [[5, 5], 10],
      [[1, 1, 1], 6],
      [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0]
    ])(
      'scores fingerprint session counts %j as %i',
      async (counts, expected) => {
        setup({
          fingerprints: counts.map((count, index) =>
            fingerprintRow(count, [USER_ID], `fp-${index}`)
          )
        });

        const result = await getUserSignals(USER_ID);

        expect(result.deviceStability).toBe(expected);
      }
    );
  });

  describe('ipConsistency', () => {
    it('is zero when no ip address was used recently', async () => {
      setup();

      const result = await getUserSignals(USER_ID);

      expect(result.ipConsistency).toBe(0);
    });

    it('awards the full bonus for a single ip address', async () => {
      setup({ ips: [ipRow()] });

      const result = await getUserSignals(USER_ID);

      expect(result.ipConsistency).toBe(20);
    });

    it('treats identical ip records as one ip address', async () => {
      setup({ ips: [ipRow(), ipRow()] });

      const result = await getUserSignals(USER_ID);

      expect(result.ipConsistency).toBe(20);
    });

    it('counts ip records that differ only by their users as distinct', async () => {
      setup({ ips: [ipRow(), ipRow({ users: [USER_ID, 'user-8'] })] });

      const result = await getUserSignals(USER_ID);

      expect(result.ipConsistency).toBe(15);
    });

    it.each([
      [3, 10],
      [5, 0],
      [8, 0]
    ])(
      'subtracts 5 per additional ip address for %i addresses to reach %i',
      async (count, expected) => {
        setup({
          ips: Array.from({ length: count }, (_, index) =>
            ipRow({ regionCode: `R${index}` })
          )
        });

        const result = await getUserSignals(USER_ID);

        expect(result.ipConsistency).toBe(expected);
      }
    );
  });

  describe('geoConsistency', () => {
    it('is zero when no ip address was used recently', async () => {
      setup();

      const result = await getUserSignals(USER_ID);

      expect(result.geoConsistency).toBe(0);
    });

    it('awards 10 when every ip is in the same region', async () => {
      setup({ ips: [ipRow(), ipRow({ users: [USER_ID, 'user-8'] })] });

      const result = await getUserSignals(USER_ID);

      expect(result.geoConsistency).toBe(10);
    });

    it('awards 10 when every ip has no region code', async () => {
      setup({
        ips: [
          ipRow({ regionCode: null, countryCode: 'CA' }),
          ipRow({ regionCode: null, countryCode: 'US' })
        ]
      });

      const result = await getUserSignals(USER_ID);

      expect(result.geoConsistency).toBe(10);
    });

    it('awards 5 when the regions differ within one country', async () => {
      setup({ ips: [ipRow(), ipRow({ regionCode: 'QC' })] });

      const result = await getUserSignals(USER_ID);

      expect(result.geoConsistency).toBe(5);
    });

    it('awards 2 when the countries differ within one continent', async () => {
      setup({
        ips: [ipRow(), ipRow({ regionCode: 'CA', countryCode: 'US' })]
      });

      const result = await getUserSignals(USER_ID);

      expect(result.geoConsistency).toBe(2);
    });

    it('is zero when the ips span several continents', async () => {
      setup({
        ips: [
          ipRow(),
          ipRow({ regionCode: 'BE', countryCode: 'DE', continentCode: 'EU' })
        ]
      });

      const result = await getUserSignals(USER_ID);

      expect(result.geoConsistency).toBe(0);
    });
  });

  describe('providersConnected', () => {
    it.each([
      [[], 0],
      [['twitter'], 2],
      [['twitter', 'twitter', 'google'], 4],
      [['twitter', 'google', 'discord', 'twitch', 'kick'], 10],
      [['twitter', 'google', 'discord', 'twitch', 'kick', 'steam'], 10]
    ])('scores linked providers %j as %i', async (providers, expected) => {
      setup({
        user: signalsUser({ accounts: providers.map(account) })
      });

      const result = await getUserSignals(USER_ID);

      expect(result.providersConnected).toBe(expected);
    });
  });

  describe('emailVerified', () => {
    it('awards 10 for a verified email', async () => {
      setup({ user: signalsUser({ emailVerified: NOW }) });

      const result = await getUserSignals(USER_ID);

      expect(result.emailVerified).toBe(10);
    });

    it('is zero for an unverified email', async () => {
      setup({ user: signalsUser({ emailVerified: null }) });

      const result = await getUserSignals(USER_ID);

      expect(result.emailVerified).toBe(0);
    });
  });

  describe('taskActivity', () => {
    it.each([
      [0, 0],
      [2, 0],
      [3, 1],
      [9, 3],
      [30, 10],
      [100, 10]
    ])('scores %i recent completions as %i', async (count, expected) => {
      setup({ completions: completions(count, 'same-task') });

      const result = await getUserSignals(USER_ID);

      expect(result.taskActivity).toBe(expected);
    });
  });

  describe('taskDiversity', () => {
    it('counts repeated completions of one task once', async () => {
      setup({ completions: completions(4, 'same-task') });

      const result = await getUserSignals(USER_ID);

      expect(result.taskDiversity).toBe(1);
    });

    it('counts each distinct task', async () => {
      setup({ completions: completions(6) });

      const result = await getUserSignals(USER_ID);

      expect(result.taskDiversity).toBe(6);
    });

    it('caps the score at 10 distinct tasks', async () => {
      setup({ completions: completions(15) });

      const result = await getUserSignals(USER_ID);

      expect(result.taskDiversity).toBe(10);
    });
  });

  describe('accountAge', () => {
    it.each([
      [0, 0],
      [1, 0],
      [3, 0],
      [6.9, 0],
      [7, 0],
      [7.9, 0],
      [8, 0],
      [13, 0],
      [13.5, 0],
      [14, 1],
      [20.9, 1],
      [21, 2],
      [77, 10],
      [400, 10]
    ])('scores an account %f days old as %i', async (days, expected) => {
      setup({
        user: signalsUser({ createdAt: new Date(NOW.getTime() - days * DAY) })
      });

      const result = await getUserSignals(USER_ID);

      expect(result.accountAge).toBe(expected);
    });
  });

  describe('overlappingIpAddresses', () => {
    it('is zero when only the user has used their ips', async () => {
      setup({ ips: [ipRow()] });

      const result = await getUserSignals(USER_ID);

      expect(result.overlappingIpAddresses).toBe(0);
    });

    it('applies a -30 penalty when another user shares an ip', async () => {
      setup({
        ips: [ipRow(), ipRow({ regionCode: 'QC', users: ['user-8'] })]
      });

      const result = await getUserSignals(USER_ID);

      expect(result.overlappingIpAddresses).toBe(-30);
    });

    it('applies the same penalty regardless of how many users share an ip', async () => {
      setup({ ips: [ipRow({ users: [USER_ID, 'user-8', 'user-9'] })] });

      const result = await getUserSignals(USER_ID);

      expect(result.overlappingIpAddresses).toBe(-30);
    });
  });

  describe('overlappingFingerprints', () => {
    it('is zero when only the user has used their fingerprints', async () => {
      setup({ fingerprints: [fingerprintRow(3)] });

      const result = await getUserSignals(USER_ID);

      expect(result.overlappingFingerprints).toBe(0);
    });

    it('applies a -30 penalty when another user shares a fingerprint', async () => {
      setup({ fingerprints: [fingerprintRow(3, [USER_ID, 'user-8'])] });

      const result = await getUserSignals(USER_ID);

      expect(result.overlappingFingerprints).toBe(-30);
    });
  });

  describe('turnstileTrust', () => {
    it('is zero when the user has no turnstile result', async () => {
      setup({ turnstile: null });

      const result = await getUserSignals(USER_ID);

      expect(result.turnstileTrust).toBe(0);
    });

    it('is zero when the turnstile check failed', async () => {
      setup({ turnstile: { success: false, score: 1 } });

      const result = await getUserSignals(USER_ID);

      expect(result.turnstileTrust).toBe(0);
    });

    it('is zero when the turnstile check has no score', async () => {
      setup({ turnstile: { success: true, score: null } });

      const result = await getUserSignals(USER_ID);

      expect(result.turnstileTrust).toBe(0);
    });

    it.each([
      [1, 10],
      [0.75, 5],
      [0.5, 0],
      [0.25, -5],
      [0, -10],
      [3, 10],
      [-2, -10]
    ])('maps a successful score of %f to %f', async (score, expected) => {
      setup({ turnstile: { success: true, score } });

      const result = await getUserSignals(USER_ID);

      expect(result.turnstileTrust).toBe(expected);
    });
  });
});
