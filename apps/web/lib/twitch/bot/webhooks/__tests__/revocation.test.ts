import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { handleRevocation } from '../revocation';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  eventSubRecord,
  subscriptionPayload
} from '@/lib/twitch/__tests__/fixtures-twitch';

const revocationBody = {
  subscription: subscriptionPayload({ status: 'authorization_revoked' })
};

describe('handleRevocation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the subscription is not stored', () => {
    beforeEach(() => {
      prismaMock.eventSubSubscription.findUnique.mockResolvedValue(null);
    });

    it('looks the subscription up by its twitch id with its integration', async () => {
      await handleRevocation(revocationBody);

      expect(prismaMock.eventSubSubscription.findUnique).toHaveBeenCalledWith({
        where: { twitch_id: 'twitch-sub-1' },
        include: { integration: true }
      });
    });

    it('does not delete or update anything', async () => {
      await handleRevocation(revocationBody);

      expect(prismaMock.eventSubSubscription.delete).not.toHaveBeenCalled();
      expect(prismaMock.eventSubSubscription.count).not.toHaveBeenCalled();
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('does not log a revocation', async () => {
      await handleRevocation(revocationBody);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('responds with ok', async () => {
      const response = await handleRevocation(revocationBody);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    });
  });

  describe('when the subscription is stored', () => {
    beforeEach(() => {
      prismaMock.eventSubSubscription.findUnique.mockResolvedValue({
        ...eventSubRecord({ id: 'db-sub-9', integrationId: 'integration-7' }),
        integration: { id: 'integration-7' }
      });
    });

    it('deletes the stored subscription', async () => {
      prismaMock.eventSubSubscription.count.mockResolvedValue(1);

      await handleRevocation(revocationBody);

      expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'db-sub-9' }
      });
    });

    it('counts the subscriptions remaining on the integration', async () => {
      prismaMock.eventSubSubscription.count.mockResolvedValue(1);

      await handleRevocation(revocationBody);

      expect(prismaMock.eventSubSubscription.count).toHaveBeenCalledWith({
        where: { integrationId: 'integration-7' }
      });
    });

    it('keeps the integration status when other subscriptions remain', async () => {
      prismaMock.eventSubSubscription.count.mockResolvedValue(2);

      await handleRevocation(revocationBody);

      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('keeps the integration status when exactly one subscription remains', async () => {
      prismaMock.eventSubSubscription.count.mockResolvedValue(1);

      await handleRevocation(revocationBody);

      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('marks the integration as errored when no subscriptions remain', async () => {
      prismaMock.eventSubSubscription.count.mockResolvedValue(0);

      await handleRevocation(revocationBody);

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-7' },
        data: { status: 'ERROR' }
      });
    });

    it('logs the revoked subscription', async () => {
      prismaMock.eventSubSubscription.count.mockResolvedValue(1);

      await handleRevocation(revocationBody);

      expect(console.log).toHaveBeenCalledWith(
        '[Twitch] Subscription twitch-sub-1 (channel.chat.message) revoked'
      );
    });

    it('responds with ok', async () => {
      prismaMock.eventSubSubscription.count.mockResolvedValue(0);

      const response = await handleRevocation(revocationBody);

      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    });
  });

  describe('when the database fails', () => {
    it('propagates the error', async () => {
      prismaMock.eventSubSubscription.findUnique.mockRejectedValue(
        new Error('db down')
      );

      await expect(handleRevocation(revocationBody)).rejects.toThrow('db down');
    });
  });

  describe('when the body is invalid', () => {
    it('throws a ZodError without querying the database', async () => {
      await expect(handleRevocation({ subscription: {} })).rejects.toThrow(
        ZodError
      );
      expect(prismaMock.eventSubSubscription.findUnique).not.toHaveBeenCalled();
    });
  });
});
