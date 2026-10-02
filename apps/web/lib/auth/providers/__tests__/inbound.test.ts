import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InboundEmailProvider } from '../inbound';
import { getMagicLinkEmailContent } from '@/lib/email/templates';

const inbound = vi.hoisted(() => {
  const send = vi.fn();
  const Inbound = vi.fn(function () {
    return { emails: { send } };
  });
  return { send, Inbound };
});

vi.mock('inboundemail', () => ({ default: inbound.Inbound }));

const MAGIC_URL = 'https://giveaway.dog/api/auth/callback/email?token=abc';

beforeEach(() => {
  inbound.send.mockReset();
  inbound.Inbound.mockClear();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('InboundEmailProvider', () => {
  describe('configuration', () => {
    it('describes an email provider whose links expire after 24 hours', () => {
      expect(InboundEmailProvider({ secret: 'key' })).toEqual({
        id: 'email',
        name: 'Email',
        type: 'email',
        maxAge: 86400,
        sendVerificationRequest: expect.any(Function)
      });
    });

    it('does not create an email client until a request is sent', () => {
      InboundEmailProvider({ secret: 'key' });

      expect(inbound.Inbound).not.toHaveBeenCalled();
    });
  });

  describe('sendVerificationRequest', () => {
    it('creates an inbound client with the configured secret', async () => {
      inbound.send.mockResolvedValue({ id: 'email-1' });
      const { sendVerificationRequest } = InboundEmailProvider({
        secret: 'key'
      });

      await sendVerificationRequest({
        identifier: 'user@example.com',
        url: MAGIC_URL
      });

      expect(inbound.Inbound).toHaveBeenCalledWith({ apiKey: 'key' });
    });

    it('sends the magic link email from the no-reply address', async () => {
      inbound.send.mockResolvedValue({ id: 'email-1' });
      const { sendVerificationRequest } = InboundEmailProvider({
        secret: 'key'
      });

      await sendVerificationRequest({
        identifier: 'user@example.com',
        url: MAGIC_URL
      });

      expect(inbound.send).toHaveBeenCalledWith({
        from: 'noreply@giveaway.dog',
        to: 'user@example.com',
        ...getMagicLinkEmailContent({ url: MAGIC_URL })
      });
    });

    it('includes the magic link in the email body', async () => {
      inbound.send.mockResolvedValue({ id: 'email-1' });
      const { sendVerificationRequest } = InboundEmailProvider({
        secret: 'key'
      });

      await sendVerificationRequest({
        identifier: 'user@example.com',
        url: MAGIC_URL
      });

      const [payload] = inbound.send.mock.calls[0] as [
        { subject: string; html: string; text: string }
      ];
      expect(payload.subject).toBe('Your Magic Sign-In Link ✨ - Giveaway.Dog');
      expect(payload.html).toContain(MAGIC_URL);
      expect(payload.text).toContain(MAGIC_URL);
    });

    it('logs the id of the sent email', async () => {
      inbound.send.mockResolvedValue({ id: 'email-1' });
      const { sendVerificationRequest } = InboundEmailProvider({
        secret: 'key'
      });

      await sendVerificationRequest({
        identifier: 'user@example.com',
        url: MAGIC_URL
      });

      expect(console.info).toHaveBeenCalledWith('Email sent successfully!');
      expect(console.info).toHaveBeenCalledWith('Email ID:', 'email-1');
    });

    it('resolves and logs when sending fails', async () => {
      const error = new Error('rate limited');
      inbound.send.mockRejectedValue(error);
      const { sendVerificationRequest } = InboundEmailProvider({
        secret: 'key'
      });

      await expect(
        sendVerificationRequest({
          identifier: 'user@example.com',
          url: MAGIC_URL
        })
      ).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send email:',
        error
      );
    });

    it('rejects when no secret is configured', async () => {
      const { sendVerificationRequest } = InboundEmailProvider({});

      await expect(
        sendVerificationRequest({
          identifier: 'user@example.com',
          url: MAGIC_URL
        })
      ).rejects.toThrow('InboundEmailProvider requires a secret');
      expect(inbound.send).not.toHaveBeenCalled();
    });
  });
});
