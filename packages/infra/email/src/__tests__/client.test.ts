import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Inbound from 'inboundemail';
import {
  E2E_CLOSED_GATES,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';
import {
  clearMemoryOutbox,
  memoryOutbox
} from '@giveaway/e2e-fakes/testing/outbox';
import { readE2eOutbox } from '@giveaway/e2e-fakes/outbox';
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

vi.mock(
  '@giveaway/e2e-fakes/outbox',
  () => import('@giveaway/e2e-fakes/testing/outbox')
);

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

describe('newEmailClient with the email fake', () => {
  const E2E_RECIPIENT = 'e2e-invitee-abcd12@example.com';
  const e2eParams = {
    from: NO_REPLY_EMAIL,
    to: E2E_RECIPIENT,
    subject: 'Sign in',
    html: '<a href="https://preview.example/link">Sign in</a>',
    text: 'https://preview.example/link'
  } as unknown as Inbound.Emails.EmailSendParams;

  beforeEach(() => {
    inbound.send.mockReset();
    inbound.constructed.length = 0;
    clearMemoryOutbox();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('records an email to an e2e recipient in the outbox', async () => {
    stubE2eFakeEnvironment('preview', 'email');

    const result = await newEmailClient({}).send(e2eParams);

    expect(result).toEqual({ id: expect.any(String), status: 'sent' });
    const entries = await readE2eOutbox({
      channel: 'email',
      target: E2E_RECIPIENT
    });
    expect(entries).toEqual([
      expect.objectContaining({
        id: result.id,
        payload: {
          from: NO_REPLY_EMAIL,
          to: E2E_RECIPIENT,
          subject: 'Sign in',
          html: '<a href="https://preview.example/link">Sign in</a>',
          text: 'https://preview.example/link'
        }
      })
    ]);
  });

  it('never calls Inbound for an e2e recipient', async () => {
    stubE2eFakeEnvironment('preview', 'email');

    await newEmailClient({ secret: 'sk_preview' }).send(e2eParams);

    expect(inbound.constructed).toEqual([]);
    expect(inbound.send).not.toHaveBeenCalled();
  });

  it('records one entry for each e2e recipient', async () => {
    stubE2eFakeEnvironment('preview', 'email');
    const second = 'e2e-member-abcd12@example.com';

    await newEmailClient({}).send({
      ...e2eParams,
      to: [E2E_RECIPIENT, second]
    });

    for (const target of [E2E_RECIPIENT, second]) {
      await expect(
        readE2eOutbox({ channel: 'email', target })
      ).resolves.toHaveLength(1);
    }
  });

  it('sends through Inbound when one recipient is not an e2e user', async () => {
    stubE2eFakeEnvironment('preview', 'email');
    inbound.send.mockResolvedValue({ id: 'email-1' });

    await newEmailClient({ secret: 'sk_preview' }).send({
      ...e2eParams,
      to: [E2E_RECIPIENT, 'someone@example.com']
    });

    expect(inbound.send).toHaveBeenCalledTimes(1);
    expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
  });

  it('sends through Inbound when there is no recipient', async () => {
    stubE2eFakeEnvironment('preview', 'email');
    inbound.send.mockResolvedValue({ id: 'email-1' });

    await newEmailClient({ secret: 'sk_preview' }).send({
      ...e2eParams,
      to: []
    });

    expect(inbound.send).toHaveBeenCalledTimes(1);
    expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
  });

  it('fails for a real recipient when no secret is set', async () => {
    stubE2eFakeEnvironment('preview', 'email');

    await expect(
      newEmailClient({}).send({ ...e2eParams, to: 'someone@example.com' })
    ).rejects.toThrow('InboundEmailProvider requires a secret');
  });

  it('sends through Inbound when only other fakes are on', async () => {
    stubE2eFakeEnvironment('preview', 'geo');
    inbound.send.mockResolvedValue({ id: 'email-1' });

    await newEmailClient({ secret: 'sk_preview' }).send(e2eParams);

    expect(inbound.send).toHaveBeenCalledWith(e2eParams);
    expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
  });

  it.each(E2E_CLOSED_GATES)(
    'sends an e2e recipient through Inbound on %s',
    async (environment) => {
      stubE2eFakeEnvironment(environment, 'all');
      inbound.send.mockResolvedValue({ id: 'email-1' });

      await newEmailClient({ secret: 'sk_live_123' }).send(e2eParams);

      expect(inbound.send).toHaveBeenCalledWith(e2eParams);
      expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
    }
  );
});
