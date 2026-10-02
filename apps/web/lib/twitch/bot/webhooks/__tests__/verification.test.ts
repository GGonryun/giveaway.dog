import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { handleSubscriptionVerification } from '../verification';
import { subscriptionPayload } from '@/lib/twitch/__tests__/fixtures-twitch';

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
    it('throws a ZodError', () => {
      expect(() =>
        handleSubscriptionVerification({ subscription: subscriptionPayload() })
      ).toThrow(ZodError);
    });
  });
});
