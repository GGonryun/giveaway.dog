import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Inbound from 'inboundemail';
import { newEmailClient, NO_REPLY_EMAIL } from '../client';

const inbound = vi.hoisted(() => {
  const send = vi.fn();
  const constructed: unknown[] = [];
  class InboundMock {
    emails = { send };
    constructor(options: unknown) {
      constructed.push(options);
    }
  }
  return { send, constructed, InboundMock };
});

vi.mock('inboundemail', () => ({ default: inbound.InboundMock }));

const sendParams = {
  from: NO_REPLY_EMAIL,
  to: 'someone@example.com',
  subject: 'Hello',
  html: '<p>Hi</p>'
} as unknown as Inbound.Emails.EmailSendParams;

describe('NO_REPLY_EMAIL', () => {
  it('is the giveaway.dog no-reply address', () => {
    expect(NO_REPLY_EMAIL).toBe('noreply@giveaway.dog');
  });
});

describe('newEmailClient', () => {
  beforeEach(() => {
    inbound.send.mockReset();
    inbound.constructed.length = 0;
  });

  describe('when the secret is missing', () => {
    it('throws when the secret is undefined', () => {
      expect(() => newEmailClient({})).toThrow(
        'InboundEmailProvider requires a secret'
      );
    });

    it('throws when the secret is an empty string', () => {
      expect(() => newEmailClient({ secret: '' })).toThrow(
        'InboundEmailProvider requires a secret'
      );
    });

    it('does not construct an Inbound client', () => {
      expect(() => newEmailClient({})).toThrow();

      expect(inbound.constructed).toEqual([]);
    });
  });

  describe('when a secret is provided', () => {
    it('constructs the Inbound client with the secret as the api key', () => {
      newEmailClient({ secret: 'sk_live_123' });

      expect(inbound.constructed).toEqual([{ apiKey: 'sk_live_123' }]);
    });

    it('returns a client exposing only a send function', () => {
      const client = newEmailClient({ secret: 'sk_live_123' });

      expect(Object.keys(client)).toEqual(['send']);
      expect(typeof client.send).toBe('function');
    });

    it('forwards send options to inbound.emails.send', async () => {
      inbound.send.mockResolvedValue({ id: 'email-1' });
      const client = newEmailClient({ secret: 'sk_live_123' });

      await client.send(sendParams);

      expect(inbound.send).toHaveBeenCalledWith(sendParams);
    });

    it('returns the value resolved by inbound.emails.send', async () => {
      inbound.send.mockResolvedValue({ id: 'email-1' });
      const client = newEmailClient({ secret: 'sk_live_123' });

      await expect(client.send(sendParams)).resolves.toEqual({
        id: 'email-1'
      });
    });

    it('propagates rejections from inbound.emails.send', async () => {
      inbound.send.mockRejectedValue(new Error('rate limited'));
      const client = newEmailClient({ secret: 'sk_live_123' });

      await expect(client.send(sendParams)).rejects.toThrow('rate limited');
    });
  });
});
