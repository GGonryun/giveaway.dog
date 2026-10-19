import { describe, it, expect, beforeEach } from 'vitest';
import { UserEventType, type UserEvent } from '@giveaway/db-model';
import { runUserTracking } from '../run-user-tracking';
import {
  asPrismaClient,
  createPrismaMock,
  prismaMock,
  type PrismaMock
} from '@giveaway/testing-server/prisma';
import { MAX_TRACKING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';

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

const db = asPrismaClient();

describe('runUserTracking', () => {
  let tx: PrismaMock;

  beforeEach(() => {
    tx = createPrismaMock();
    prismaMock.$transaction.mockImplementation(
      async (fn: (client: PrismaMock) => Promise<unknown>) => fn(tx)
    );
    prismaMock.userEvent.findMany.mockResolvedValue([]);
    tx.deviceFingerprint.upsert.mockResolvedValue({ id: 'fp-1' });
    tx.deviceAgent.upsert.mockResolvedValue({ id: 'agent-1' });
    tx.ipAddress.upsert.mockResolvedValue({ id: 'ip-1' });
  });

  describe('when there are no events', () => {
    it('reports an empty run', async () => {
      expect(await runUserTracking(db)).toEqual({
        processed: 0,
        errors: 0,
        total: 0
      });
    });

    it('reads only the events of one user when it is given', async () => {
      await runUserTracking(db, { userId: 'user-1' });

      expect(prismaMock.userEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        take: MAX_TRACKING_REQUESTS_PER_RUN,
        orderBy: { timestamp: 'asc' }
      });
    });

    it('reads a bounded batch of the oldest events', async () => {
      await runUserTracking(db);

      expect(MAX_TRACKING_REQUESTS_PER_RUN).toBe(10);
      expect(prismaMock.userEvent.findMany).toHaveBeenCalledWith({
        take: MAX_TRACKING_REQUESTS_PER_RUN,
        orderBy: { timestamp: 'asc' }
      });
    });
  });

  describe('when an event has complete tracking data', () => {
    beforeEach(() => {
      prismaMock.userEvent.findMany.mockResolvedValue([buildEvent()]);
    });

    it('reports the event as processed', async () => {
      expect(await runUserTracking(db)).toEqual({
        processed: 1,
        errors: 0,
        total: 1
      });
    });

    it('upserts the device fingerprint built from the event', async () => {
      await runUserTracking(db);

      const fingerprint =
        'desktop|Windows 10/11|Chrome 120|de-DE|203.0.113.7|Europe/Berlin|1920x1080';
      expect(tx.deviceFingerprint.upsert).toHaveBeenCalledWith({
        where: { fingerprint },
        create: { fingerprint },
        update: {}
      });
    });

    it('upserts the parsed device agent', async () => {
      await runUserTracking(db);

      expect(tx.deviceAgent.upsert).toHaveBeenCalledWith({
        where: { agent: CHROME_ON_WINDOWS },
        create: {
          agent: CHROME_ON_WINDOWS,
          device: 'desktop',
          os: 'Windows 10/11',
          browser: 'Chrome 120'
        },
        update: {}
      });
    });

    it('upserts the ip address with the geo fields on both create and update', async () => {
      await runUserTracking(db);

      const fields = {
        ip: '203.0.113.7',
        asn: 3320,
        isp: 'Deutsche Telekom AG',
        org: 'Deutsche Telekom',
        domain: 'telekom.de',
        country: 'Germany',
        countryCode: 'DE',
        continent: 'Europe',
        continentCode: 'EU',
        region: 'Berlin',
        regionCode: 'BE',
        city: 'Berlin',
        postal: '10115',
        callingCode: '49',
        latitude: 52.52,
        longitude: 13.405,
        timezone: 'Europe/Berlin'
      };
      expect(tx.ipAddress.upsert).toHaveBeenCalledWith({
        where: { ip: '203.0.113.7' },
        create: fields,
        update: fields
      });
    });

    it('links the fingerprint to the user and increments its count', async () => {
      await runUserTracking(db);

      expect(tx.userFingerprint.upsert).toHaveBeenCalledWith({
        where: {
          userId_fingerprintId: { userId: 'user-1', fingerprintId: 'fp-1' }
        },
        create: { userId: 'user-1', fingerprintId: 'fp-1', count: 1 },
        update: { count: { increment: 1 } }
      });
    });

    it('links the device agent to the user and increments its count', async () => {
      await runUserTracking(db);

      expect(tx.userAgent.upsert).toHaveBeenCalledWith({
        where: { userId_agentId: { userId: 'user-1', agentId: 'agent-1' } },
        create: { userId: 'user-1', agentId: 'agent-1', count: 1 },
        update: { count: { increment: 1 } }
      });
    });

    it('links the ip address to the user and increments its count', async () => {
      await runUserTracking(db);

      expect(tx.userIpAddress.upsert).toHaveBeenCalledWith({
        where: { userId_ipId: { userId: 'user-1', ipId: 'ip-1' } },
        create: { userId: 'user-1', ipId: 'ip-1', count: 1 },
        update: { count: { increment: 1 } }
      });
    });

    it('queues a scoring request for the user without changing an existing one', async () => {
      await runUserTracking(db);

      expect(tx.userScoringRequest.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1' },
        update: {}
      });
    });

    it('deletes the event inside the transaction', async () => {
      await runUserTracking(db);

      expect(tx.userEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' }
      });
      expect(prismaMock.userEvent.delete).not.toHaveBeenCalled();
    });
  });

  describe('when an event is missing optional tracking data', () => {
    beforeEach(() => {
      prismaMock.userEvent.findMany.mockResolvedValue([
        buildEvent({
          geo: null,
          acceptLanguage: null,
          timeZone: null,
          screen: null,
          userAgent: null
        })
      ]);
    });

    it('builds the fingerprint from fallback values', async () => {
      await runUserTracking(db);

      const fingerprint = 'desktop|Unknown OS|Unknown Browser|en|::1|UTC|0x0';
      expect(tx.deviceFingerprint.upsert).toHaveBeenCalledWith({
        where: { fingerprint },
        create: { fingerprint },
        update: {}
      });
    });

    it('stores an unknown device agent', async () => {
      await runUserTracking(db);

      expect(tx.deviceAgent.upsert).toHaveBeenCalledWith({
        where: { agent: 'unknown' },
        create: {
          agent: 'unknown',
          device: 'desktop',
          os: 'Unknown OS',
          browser: 'Unknown Browser'
        },
        update: {}
      });
    });

    it('does not store an ip address or link one to the user', async () => {
      await runUserTracking(db);

      expect(tx.ipAddress.upsert).not.toHaveBeenCalled();
      expect(tx.userIpAddress.upsert).not.toHaveBeenCalled();
    });

    it('still queues scoring and deletes the event', async () => {
      const result = await runUserTracking(db);

      expect(tx.userScoringRequest.upsert).toHaveBeenCalled();
      expect(tx.userEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' }
      });
      expect(result.processed).toBe(1);
    });
  });

  describe('when the stored geo data has an empty ip', () => {
    it('does not store an ip address', async () => {
      prismaMock.userEvent.findMany.mockResolvedValue([
        buildEvent({ geo: { ...GEO, ip: '' } })
      ]);

      await runUserTracking(db);

      expect(tx.ipAddress.upsert).not.toHaveBeenCalled();
      expect(tx.userIpAddress.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when the stored geo data does not match the ip schema', () => {
    it('falls back to the unknown ip in the fingerprint and skips the ip address', async () => {
      prismaMock.userEvent.findMany.mockResolvedValue([
        buildEvent({ geo: { ip: '203.0.113.7' } })
      ]);

      await runUserTracking(db);

      expect(tx.deviceFingerprint.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            fingerprint:
              'desktop|Windows 10/11|Chrome 120|de-DE|::1|Europe/Berlin|1920x1080'
          }
        })
      );
      expect(tx.ipAddress.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when the device upserts return nothing', () => {
    it('skips linking the missing fingerprint and agent to the user', async () => {
      prismaMock.userEvent.findMany.mockResolvedValue([buildEvent()]);
      tx.deviceFingerprint.upsert.mockResolvedValue(null);
      tx.deviceAgent.upsert.mockResolvedValue(null);
      tx.ipAddress.upsert.mockResolvedValue(null);

      await runUserTracking(db);

      expect(tx.userFingerprint.upsert).not.toHaveBeenCalled();
      expect(tx.userAgent.upsert).not.toHaveBeenCalled();
      expect(tx.userIpAddress.upsert).not.toHaveBeenCalled();
      expect(tx.userScoringRequest.upsert).toHaveBeenCalled();
    });
  });

  describe('when processing an event fails', () => {
    beforeEach(() => {
      prismaMock.userEvent.findMany.mockResolvedValue([
        buildEvent({ id: 'event-1', userId: 'user-1' }),
        buildEvent({ id: 'event-2', userId: 'user-2' })
      ]);
      tx.userScoringRequest.upsert
        .mockRejectedValueOnce(new Error('write failed'))
        .mockResolvedValue({});
    });

    it('counts the failure and keeps processing the remaining events', async () => {
      expect(await runUserTracking(db)).toEqual({
        processed: 1,
        errors: 1,
        total: 2
      });
    });

    it('deletes the failed event with the root client', async () => {
      await runUserTracking(db);

      expect(prismaMock.userEvent.delete).toHaveBeenCalledTimes(1);
      expect(prismaMock.userEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' }
      });
      expect(tx.userEvent.delete).toHaveBeenCalledTimes(1);
      expect(tx.userEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-2' }
      });
    });

    it('throws when deleting the failed event also fails', async () => {
      prismaMock.userEvent.delete.mockRejectedValue(new Error('delete failed'));

      await expect(runUserTracking(db)).rejects.toThrow('delete failed');
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('when reading events fails', () => {
    it('throws', async () => {
      prismaMock.userEvent.findMany.mockRejectedValue(new Error('db down'));

      await expect(runUserTracking(db)).rejects.toThrow('db down');
    });
  });
});
