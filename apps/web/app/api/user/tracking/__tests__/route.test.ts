import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UserEventType, type UserEvent } from '@prisma/client';
import { GET } from '../route';
import {
  createPrismaMock,
  prismaMock,
  type PrismaMock
} from '@giveaway/testing-server/prisma';
import { MAX_TRACKING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';

const CRON_SECRET = 'cron-secret';

const CHROME_ON_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const GEO = {
  ip: '203.0.113.7',
  success: true,
  type: 'IPv4',
  continent: 'Europe',
  continent_code: 'EU',
  country: 'Germany',
  country_code: 'DE',
  region: 'Berlin',
  region_code: 'BE',
  city: 'Berlin',
  latitude: 52.52,
  longitude: 13.405,
  is_eu: true,
  postal: '10115',
  calling_code: '49',
  capital: 'Berlin',
  borders: 'AT,CH',
  flag: { img: 'flag.svg', emoji: 'DE', emoji_unicode: 'U+1F1E9' },
  connection: {
    asn: 3320,
    org: 'Deutsche Telekom',
    isp: 'Deutsche Telekom AG',
    domain: 'telekom.de'
  },
  timezone: {
    id: 'Europe/Berlin',
    abbr: 'CET',
    is_dst: false,
    offset: 3600,
    utc: '+01:00'
  }
};

const buildEvent = (overrides: Partial<UserEvent> = {}): UserEvent => ({
  id: 'event-1',
  userId: 'user-1',
  type: UserEventType.TRACKING,
  geo: GEO,
  acceptLanguage: 'de-DE',
  timeZone: 'Europe/Berlin',
  screen: '1920x1080',
  userAgent: CHROME_ON_WINDOWS,
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides
});

const buildRequest = (headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/user/tracking', { headers });

const authorizedRequest = () =>
  buildRequest({ authorization: `Bearer ${CRON_SECRET}` });

describe('GET /api/user/tracking', () => {
  let tx: PrismaMock;

  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    tx = createPrismaMock();
    prismaMock.$transaction.mockImplementation(
      async (fn: (client: PrismaMock) => Promise<unknown>) => fn(tx)
    );
    prismaMock.userEvent.findMany.mockResolvedValue([]);
    tx.deviceFingerprint.upsert.mockResolvedValue({ id: 'fp-1' });
    tx.deviceAgent.upsert.mockResolvedValue({ id: 'agent-1' });
    tx.ipAddress.upsert.mockResolvedValue({ id: 'ip-1' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the cron secret is not valid', () => {
    it('returns 401 with an error body', async () => {
      const res = await GET(buildRequest());

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('does not read any events', async () => {
      await GET(buildRequest({ authorization: 'Bearer wrong' }));

      expect(prismaMock.userEvent.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when there are no events', () => {
    it('reports an empty run', async () => {
      const res = await GET(authorizedRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        processed: 0,
        errors: 0,
        total: 0
      });
    });

    it('reads the events of every user', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.userEvent.findMany).toHaveBeenCalledWith({
        take: MAX_TRACKING_REQUESTS_PER_RUN,
        orderBy: { timestamp: 'asc' }
      });
    });
  });

  describe('when an event is processed', () => {
    it('reports the counts of the run', async () => {
      prismaMock.userEvent.findMany.mockResolvedValue([buildEvent()]);

      const res = await GET(authorizedRequest());

      expect(await res.json()).toEqual({
        success: true,
        processed: 1,
        errors: 0,
        total: 1
      });
    });
  });

  describe('when reading events fails', () => {
    it('returns 500 with a generic error', async () => {
      prismaMock.userEvent.findMany.mockRejectedValue(new Error('db down'));

      const res = await GET(authorizedRequest());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
  });
});
