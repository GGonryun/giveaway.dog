import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getUserDeviceActivity from '../get-user-device-activity';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

type DeviceActivityInput = Parameters<typeof getUserDeviceActivity>[0];

const UPDATED_AT = new Date('2026-09-20T08:00:00.000Z');

type AgentOptions = {
  device?: string | null;
  os?: string | null;
  browser?: string | null;
  count?: number;
};

const userAgentRow = ({
  device = 'mobile',
  os = 'iOS',
  browser = 'Safari',
  count = 4
}: AgentOptions = {}) => ({
  id: 'user-agent-1',
  userId: 'user-2',
  agentId: 'agent-1',
  count,
  createdAt: UPDATED_AT,
  updatedAt: UPDATED_AT,
  agent: {
    id: 'agent-1',
    agent: 'Mozilla/5.0 (iPhone)',
    device,
    os,
    browser,
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT
  }
});

describe('getUserDeviceActivity', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.userAgent.findMany).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('rejects a missing user id', async () => {
      signIn();

      const result = await getUserDeviceActivity(
        {} as unknown as DeviceActivityInput
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the requested user devices newest first with their agent', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue([]);

      await getUserDeviceActivity({ userId: 'user-2' });

      expect(prismaMock.userAgent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
        orderBy: { updatedAt: 'desc' },
        include: { agent: true }
      });
    });

    it('allows reading the activity of a user other than the caller', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue([userAgentRow()]);

      const result = await getUserDeviceActivity({ userId: 'someone-else' });

      expect(expectOk(result)).toHaveLength(1);
      expect(prismaMock.userAgent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'someone-else' } })
      );
    });

    it('maps each device to its activity summary', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue([userAgentRow()]);

      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expect(expectOk(result)).toEqual([
        {
          agent: 'Mozilla/5.0 (iPhone)',
          device: 'mobile',
          os: 'iOS',
          browser: 'Safari',
          count: 4,
          lastUsed: UPDATED_AT
        }
      ]);
    });

    it('reports an unrecognised device type as unknown', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue([
        userAgentRow({ device: 'smart-fridge' })
      ]);

      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expect(expectOk(result)[0].device).toBe('unknown');
    });

    it('falls back to unknown os and browser labels', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue([
        userAgentRow({ device: null, os: null, browser: null })
      ]);

      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expect(expectOk(result)[0]).toMatchObject({
        device: 'unknown',
        os: 'Unknown OS',
        browser: 'Unknown Browser'
      });
    });

    it('falls back to unknown os and browser labels for a recognised device', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue([
        userAgentRow({ device: 'desktop', os: null, browser: null })
      ]);

      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expect(expectOk(result)[0]).toMatchObject({
        device: 'desktop',
        os: 'Unknown OS',
        browser: 'Unknown Browser'
      });
    });

    it('returns an empty list when the user has no devices', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue([]);

      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expect(expectOk(result)).toEqual([]);
    });

    it('returns an empty list when the query yields nothing', async () => {
      prismaMock.userAgent.findMany.mockResolvedValue(null);

      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expect(expectOk(result)).toEqual([]);
    });

    it('maps a P2025 database error to NOT_FOUND', async () => {
      prismaMock.userAgent.findMany.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await getUserDeviceActivity({ userId: 'user-2' });

      expectFailure(result, 'NOT_FOUND');
    });
  });
});
