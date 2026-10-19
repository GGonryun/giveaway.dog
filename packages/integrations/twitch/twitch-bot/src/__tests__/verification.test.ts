import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { handleSubscriptionVerification } from '../verification';
import { subscriptionPayload } from '@giveaway/testing-server/fixtures-twitch';

describe('handleSubscriptionVerification', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the body is a valid challenge', () => {
    const body = {
      challenge: 'pogchamp-kappa-360noscope',
      subscription: subscriptionPayload({
        status: 'webhook_callback_verification_pending'
      })
    };

    it('responds with status 200', () => {
      const response = handleSubscriptionVerification(body);

      expect(response.status).toBe(200);
    });

    it('responds with a plain text content type', () => {
      const response = handleSubscriptionVerification(body);

      expect(response.headers.get('Content-Type')).toBe('text/plain');
    });

    it('echoes the challenge as the raw body', async () => {
      const response = handleSubscriptionVerification(body);

      await expect(response.text()).resolves.toBe('pogchamp-kappa-360noscope');
    });

    it('logs the challenge', () => {
      handleSubscriptionVerification(body);

      expect(console.info).toHaveBeenCalledWith(
        'Handling Twitch subscription verification for challenge:',
        'pogchamp-kappa-360noscope'
      );
    });
  });

  describe('when the body is not a valid challenge', () => {
    it('throws a bad request error', () => {
      let error: unknown;
      try {
        handleSubscriptionVerification({ subscription: subscriptionPayload() });
      } catch (thrown) {
        error = thrown;
      }

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid Twitch subscription verification'
      });
    });
  });
});
