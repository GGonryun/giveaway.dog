import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import nacl from 'tweetnacl';
import { POST } from '../route';
import { POST as handlerPOST } from '@giveaway/discord-bot/commands/handler';
import { discordConnectWorkflow } from '@giveaway/discord-bot/workflows/discord-connect/workflow';
import { discordInteractionWorkflow } from '@giveaway/discord-bot/workflows/discord-interaction/workflow';
import { ApplicationError } from '@giveaway/util-errors';

const m = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('workflow/api', () => ({ start: m.start }));

const KEY_PAIR = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));
const PUBLIC_KEY = Buffer.from(KEY_PAIR.publicKey).toString('hex');
const TIMESTAMP = '1767225600';

const sign = (body: string, timestamp = TIMESTAMP) =>
  Buffer.from(
    nacl.sign.detached(Buffer.from(timestamp + body), KEY_PAIR.secretKey)
  ).toString('hex');

const baseInteraction = {
  app_permissions: '0',
  application_id: 'app-1',
  attachment_size_limit: 1024,
  authorizing_integration_owners: { '0': 'guild-1' },
  entitlements: [],
  id: 'interaction-1',
  token: 'interaction-token',
  version: 1
};

const discordUser = {
  discriminator: '0',
  id: 'discord-user-1',
  public_flags: 0,
  username: 'alice'
};

const pingInteraction = { ...baseInteraction, type: 1, user: discordUser };

const commandInteraction = {
  ...baseInteraction,
  type: 2,
  data: { id: 'command-1', name: 'connect', type: 1 },
  locale: 'en-US',
  user: discordUser
};

const buttonInteraction = (customId: string) => ({
  ...baseInteraction,
  type: 3,
  data: { custom_id: customId, component_type: 2 },
  message: { id: 'message-1', channel_id: 'channel-1' },
  user: discordUser
});

const signedRequest = (
  payload: unknown,
  headers: Record<string, string | null> = {}
) => {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const allHeaders: Record<string, string | null> = {
    'X-Signature-Ed25519': sign(body),
    'X-Signature-Timestamp': TIMESTAMP,
    ...headers
  };
  const presentHeaders = Object.fromEntries(
    Object.entries(allHeaders).filter(
      (entry): entry is [string, string] => entry[1] !== null
    )
  );
  return new NextRequest('http://localhost:3000/api/discord/interactions', {
    method: 'POST',
    headers: presentHeaders,
    body
  });
};

const ephemeral = (content: string) => ({
  type: 4,
  data: { content, flags: 64 }
});

const deferredEphemeral = (content: string) => ({
  type: 5,
  data: { flags: 64, content }
});

const UNEXPECTED = ephemeral(
  'An unexpected error occurred. Please try again later.'
);

describe('POST /api/discord/interactions', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', PUBLIC_KEY);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.start.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('is served by the Discord command handler', () => {
    expect(POST).toBe(handlerPOST);
  });

  describe('when the request cannot be verified', () => {
    it('returns 401 when the public key is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', '');

      const res = await POST(signedRequest(pingInteraction));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the signature header is missing', async () => {
      const res = await POST(
        signedRequest(pingInteraction, { 'X-Signature-Ed25519': null })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the timestamp header is missing', async () => {
      const res = await POST(
        signedRequest(pingInteraction, { 'X-Signature-Timestamp': null })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the signature does not match the body', async () => {
      const res = await POST(
        signedRequest(pingInteraction, {
          'X-Signature-Ed25519': sign('{"tampered":true}')
        })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the signature was made for another timestamp', async () => {
      const body = JSON.stringify(pingInteraction);

      const res = await POST(
        signedRequest(body, { 'X-Signature-Ed25519': sign(body, '1') })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('when a ping is received', () => {
    it('responds with a pong', async () => {
      const res = await POST(signedRequest(pingInteraction));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ type: 1 });
    });
  });

  describe('when an application command is received', () => {
    it('defers an ephemeral processing message', async () => {
      const res = await POST(signedRequest(commandInteraction));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(
        deferredEphemeral(
          'Processing your request... Please wait a few seconds and do not close this message.'
        )
      );
    });

    it('starts the connect workflow with the parsed interaction', async () => {
      await POST(signedRequest(commandInteraction));

      expect(m.start).toHaveBeenCalledWith(discordConnectWorkflow, [
        { body: commandInteraction }
      ]);
    });
  });

  describe('when a button interaction is received', () => {
    it('starts the entry workflow for task buttons', async () => {
      const interaction = buttonInteraction('task:enter:task-1');

      const res = await POST(signedRequest(interaction));

      expect(await res.json()).toEqual(
        deferredEphemeral('Processing your entry... Please wait.')
      );
      expect(m.start).toHaveBeenCalledWith(discordInteractionWorkflow, [
        { body: interaction, taskId: 'task-1' }
      ]);
    });

    it('tells the user that other buttons no longer work', async () => {
      const res = await POST(signedRequest(buttonInteraction('legacy:click')));

      expect(await res.json()).toEqual(
        deferredEphemeral(
          'This button is no longer functional. Please refresh.'
        )
      );
      expect(m.start).not.toHaveBeenCalled();
    });
  });

  describe('when the verified body is not a valid interaction', () => {
    it('responds with a generic ephemeral error for a schema mismatch', async () => {
      const res = await POST(signedRequest({ type: 1 }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(UNEXPECTED);
    });

    it('responds with a generic ephemeral error for an unknown interaction type', async () => {
      const res = await POST(signedRequest({ ...pingInteraction, type: 4 }));

      expect(await res.json()).toEqual(UNEXPECTED);
    });

    it('responds with a generic ephemeral error for a body that is not JSON', async () => {
      const res = await POST(signedRequest('not-json'));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(UNEXPECTED);
    });
  });

  describe('when a command handler throws', () => {
    it('rejects with the error instead of mapping it to a response', async () => {
      const error = new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Task not found'
      });
      m.start.mockImplementation(() => {
        throw error;
      });

      await expect(POST(signedRequest(commandInteraction))).rejects.toBe(error);
    });

    it('rejects for button interactions as well', async () => {
      const error = new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Entry closed'
      });
      m.start.mockImplementation(() => {
        throw error;
      });

      await expect(
        POST(signedRequest(buttonInteraction('task:enter:task-1')))
      ).rejects.toBe(error);
    });
  });
});
