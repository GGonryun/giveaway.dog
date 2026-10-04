import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { verifyDiscordRequest } from '../verify';
import {
  DISCORD_TEST_PUBLIC_KEY,
  discordRequest,
  signDiscordBody
} from '../../__tests__/fixtures-discord-bot';
import {
  buttonInteraction,
  pingInteraction
} from '@giveaway/discord-model/testing/fixtures-discord-model';

const captureError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected promise to reject');
    },
    (error: unknown) => error
  );

describe('verifyDiscordRequest', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', DISCORD_TEST_PUBLIC_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the request is correctly signed', () => {
    it('returns the parsed interaction', async () => {
      const body = JSON.stringify(pingInteraction());

      const result = await verifyDiscordRequest(discordRequest({ body }));

      expect(result).toEqual(pingInteraction());
    });

    it('strips unknown keys from the interaction', async () => {
      const body = JSON.stringify({
        ...buttonInteraction(),
        guild_locale: 'en-US'
      });

      const result = await verifyDiscordRequest(discordRequest({ body }));

      expect(result).toEqual(buttonInteraction());
    });

    it('throws VALIDATION_ERROR when the payload is not a known interaction', async () => {
      const body = JSON.stringify({ ...pingInteraction(), type: 9 });

      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body }))
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Discord interaction data'
      });
      expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
    });

    it('throws a SyntaxError when the body is not json', async () => {
      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body: 'not json' }))
      );

      expect(error).toBeInstanceOf(SyntaxError);
    });
  });

  describe('when the public key is missing', () => {
    it.each([undefined, ''])('throws UNAUTHORIZED for %j', async (value) => {
      vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', value);
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body }))
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Discord public key is not configured'
      });
    });
  });

  describe('when signature headers are missing', () => {
    it('throws UNAUTHORIZED when the signature header is absent', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body, signature: null }))
      );

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Discord request is missing signature in header'
      });
    });

    it('treats an empty signature header as missing', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body, signature: '' }))
      );

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Discord request is missing signature in header'
      });
    });

    it('throws UNAUTHORIZED when the timestamp header is absent', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(
          discordRequest({
            body,
            timestamp: null,
            signature: signDiscordBody(body)
          })
        )
      );

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Discord request is missing timestamp in header'
      });
    });

    it('treats an empty timestamp header as missing even when the signature matches', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(
          discordRequest({
            body,
            timestamp: '',
            signature: signDiscordBody(body, '')
          })
        )
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Discord request is missing timestamp in header'
      });
    });

    it('checks the signature header before the timestamp header', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(
          discordRequest({ body, signature: null, timestamp: null })
        )
      );

      expect(error).toMatchObject({
        message: 'Discord request is missing signature in header'
      });
    });
  });

  describe('when the signature does not match', () => {
    it('rejects a signature made for a different body', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(
          discordRequest({ body, signature: signDiscordBody('{"type":1}') })
        )
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'invalid request signature'
      });
    });

    it('rejects a signature made for a different timestamp', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(
          discordRequest({
            body,
            timestamp: '1700000001',
            signature: signDiscordBody(body, '1700000000')
          })
        )
      );

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'invalid request signature'
      });
    });

    it('rejects a valid signature checked against another public key', async () => {
      vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', 'ab'.repeat(32));
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body }))
      );

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'invalid request signature'
      });
    });

    it('throws a plain Error when the signature has the wrong length', async () => {
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body, signature: 'abcd' }))
      );

      expect(error).not.toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({ message: 'bad signature size' });
    });

    it('throws a plain Error when the public key has the wrong length', async () => {
      vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', 'abcd');
      const body = JSON.stringify(pingInteraction());

      const error = await captureError(
        verifyDiscordRequest(discordRequest({ body }))
      );

      expect(error).not.toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({ message: 'bad public key size' });
    });
  });
});
