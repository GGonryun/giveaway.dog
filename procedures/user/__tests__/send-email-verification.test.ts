import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import sendEmailVerificationDefault, {
  sendEmailVerification
} from '../send-email-verification';
import { NO_REPLY_EMAIL } from '@/lib/email/client';
import { getVerificationEmailContent } from '@/lib/email/templates';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const inbound = vi.hoisted(() => ({
  construct: vi.fn(),
  send: vi.fn()
}));

vi.mock('inboundemail', () => ({
  default: class {
    emails = { send: inbound.send };
    constructor(options: unknown) {
      inbound.construct(options);
    }
  }
}));

type SendInput = Parameters<typeof sendEmailVerification>[0];

const NOW = new Date('2026-10-01T12:00:00.000Z');
const EMAIL = 'jane@example.com';

type SentEmail = { from: string; to: string; text: string; html: string };

const sentEmail = (call = 0): SentEmail => inbound.send.mock.calls[call][0];

const sentUrl = (call = 0) => {
  const match = sentEmail(call).text.match(/(\S*\/portal\?\S*)/);
  if (!match) {
    throw new Error('No verification url in the email text');
  }
  return match[1];
};

const sentParams = (call = 0) =>
  new URLSearchParams(sentUrl(call).split('?')[1]);

describe('sendEmailVerification', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    inbound.construct.mockReset();
    inbound.send.mockReset();
    inbound.send.mockResolvedValue({ id: 'email-1' });
    prismaMock.verificationToken.create.mockResolvedValue({});
    vi.stubEnv('INBOUND_SECRET', 'inbound-secret');
    vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.test');
    vi.stubEnv('VERCEL_URL', 'giveaway-preview.vercel.app');
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('exports the same procedure as the default export', () => {
    expect(sendEmailVerificationDefault).toBe(sendEmailVerification);
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await sendEmailVerification({ email: EMAIL });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.verificationToken.create).not.toHaveBeenCalled();
      expect(inbound.send).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects an invalid email address', async () => {
      const result = await sendEmailVerification({ email: 'nope' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.verificationToken.create).not.toHaveBeenCalled();
    });

    it('rejects a non-string redirect', async () => {
      const result = await sendEmailVerification({
        email: EMAIL,
        redirectTo: 5
      } as unknown as SendInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the email is sent', () => {
    beforeEach(() => {
      signIn();
    });

    it('stores the sha256 hash of the emailed token with a 15 minute expiry', async () => {
      await sendEmailVerification({ email: EMAIL });

      const token = sentParams().get('token') ?? '';
      expect(token).toMatch(/^[0-9a-f]{64}$/);
      expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
        data: {
          identifier: EMAIL,
          token: createHash('sha256').update(token).digest('hex'),
          expires: new Date('2026-10-01T12:15:00.000Z')
        }
      });
    });

    it('builds the portal url on NEXTAUTH_URL with the token and email', async () => {
      await sendEmailVerification({ email: EMAIL });

      const token = sentParams().get('token') ?? '';
      expect(sentUrl()).toBe(
        `https://giveaway.test/portal?${new URLSearchParams({ token, email: EMAIL }).toString()}`
      );
    });

    it('appends the redirect to the portal url when one is given', async () => {
      await sendEmailVerification({
        email: EMAIL,
        redirectTo: '/account?tab=profile'
      });

      expect([...sentParams().keys()]).toEqual([
        'token',
        'email',
        'redirectTo'
      ]);
      expect(sentParams().get('redirectTo')).toBe('/account?tab=profile');
    });

    it('omits an empty redirect from the portal url', async () => {
      await sendEmailVerification({ email: EMAIL, redirectTo: '' });

      expect(sentParams().has('redirectTo')).toBe(false);
    });

    it('falls back to VERCEL_URL without adding a scheme when NEXTAUTH_URL is empty', async () => {
      vi.stubEnv('NEXTAUTH_URL', '');

      await sendEmailVerification({ email: EMAIL });

      expect(sentUrl().startsWith('giveaway-preview.vercel.app/portal?')).toBe(
        true
      );
    });

    it('falls back to localhost when neither NEXTAUTH_URL nor VERCEL_URL is set', async () => {
      vi.stubEnv('NEXTAUTH_URL', '');
      vi.stubEnv('VERCEL_URL', '');

      await sendEmailVerification({ email: EMAIL });

      expect(sentUrl().startsWith('http://localhost:3000/portal?')).toBe(true);
    });

    it('creates the email client with the inbound secret', async () => {
      await sendEmailVerification({ email: EMAIL });

      expect(inbound.construct).toHaveBeenCalledWith({
        apiKey: 'inbound-secret'
      });
    });

    it('sends the verification template from the no-reply address addressed by name', async () => {
      await sendEmailVerification({ email: EMAIL });

      expect(inbound.send).toHaveBeenCalledTimes(1);
      expect(inbound.send).toHaveBeenCalledWith({
        from: NO_REPLY_EMAIL,
        to: EMAIL,
        ...getVerificationEmailContent({ url: sentUrl(), name: 'Test User' })
      });
    });

    it('sends an unnamed greeting when the session user has no name', async () => {
      signIn({ name: '' });

      await sendEmailVerification({ email: EMAIL });

      expect(sentEmail()).toMatchObject(
        getVerificationEmailContent({ url: sentUrl() })
      );
      expect(sentEmail().text.startsWith('Hello! ')).toBe(true);
    });

    it('generates a different token for each request', async () => {
      await sendEmailVerification({ email: EMAIL });
      await sendEmailVerification({ email: EMAIL });

      expect(sentParams(0).get('token')).not.toBe(sentParams(1).get('token'));
    });

    it('returns a success message', async () => {
      const result = await sendEmailVerification({ email: EMAIL });

      expect(expectOk(result)).toEqual({
        success: true,
        message: 'Verification email sent successfully'
      });
    });
  });

  describe('when sending fails', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns INTERNAL_SERVER_ERROR when the token cannot be stored', async () => {
      const error = new Error('db offline');
      prismaMock.verificationToken.create.mockRejectedValue(error);

      const result = await sendEmailVerification({ email: EMAIL });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to send verification email'
      );
      expect(inbound.send).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Email verification error:',
        error
      );
    });

    it('returns INTERNAL_SERVER_ERROR after storing the token when the inbound secret is missing', async () => {
      vi.stubEnv('INBOUND_SECRET', '');

      const result = await sendEmailVerification({ email: EMAIL });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to send verification email'
      );
      expect(prismaMock.verificationToken.create).toHaveBeenCalledTimes(1);
      expect(inbound.construct).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Email verification error:',
        expect.objectContaining({
          message: 'InboundEmailProvider requires a secret'
        })
      );
    });

    it('returns INTERNAL_SERVER_ERROR when the email provider rejects', async () => {
      inbound.send.mockRejectedValue(new Error('provider down'));

      const result = await sendEmailVerification({ email: EMAIL });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to send verification email'
      );
    });
  });
});
