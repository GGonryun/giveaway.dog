import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError, type ApplicationErrorCode } from '@/lib/errors';
import { POST } from '../handler';
import * as verifyModule from '../../verify';
import { discordConnectWorkflow } from '../../../workflows/discord-connect/workflow';
import { discordInteractionWorkflow } from '../../../workflows/discord-interaction/workflow';
import {
  DISCORD_TEST_PUBLIC_KEY,
  applicationCommandInteraction,
  buttonInteraction,
  discordRequest,
  pingInteraction
} from '../../../__tests__/fixtures-discord-core';

const workflowApi = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('workflow/api', () => workflowApi);

vi.mock('../../verify', { spy: true });

const GENERIC_ERROR_RESPONSE = {
  type: 4,
  data: {
    content: 'An unexpected error occurred. Please try again later.',
    flags: 64
  }
};

const signedRequest = (payload: unknown) =>
  discordRequest({ body: JSON.stringify(payload) });

const throwFromStart = (error: unknown) => {
  workflowApi.start.mockImplementation(() => {
    throw error;
  });
};

describe('POST discord interactions handler', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', DISCORD_TEST_PUBLIC_KEY);
    workflowApi.start.mockReset();
    consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    consoleError.mockRestore();
  });

  describe('when the interaction is a ping', () => {
    it('responds with a pong', async () => {
      const response = await POST(signedRequest(pingInteraction()));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ type: 1 });
      expect(workflowApi.start).not.toHaveBeenCalled();
    });
  });

  describe('when the interaction is an application command', () => {
    it('starts the connect workflow and responds with a deferred message', async () => {
      const body = applicationCommandInteraction();

      const response = await POST(signedRequest(body));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        type: 5,
        data: {
          flags: 64,
          content:
            'Processing your request... Please wait a few seconds and do not close this message.'
        }
      });
      expect(workflowApi.start).toHaveBeenCalledWith(discordConnectWorkflow, [
        { body }
      ]);
    });
  });

  describe('when the interaction is a button press', () => {
    it('starts the interaction workflow for task buttons', async () => {
      const body = buttonInteraction('task:enter:task-3');

      const response = await POST(signedRequest(body));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        type: 5,
        data: { flags: 64, content: 'Processing your entry... Please wait.' }
      });
      expect(workflowApi.start).toHaveBeenCalledWith(
        discordInteractionWorkflow,
        [{ body, taskId: 'task-3' }]
      );
    });

    it('responds that unknown buttons are no longer functional', async () => {
      const response = await POST(
        signedRequest(buttonInteraction('old:enter:task-3'))
      );

      expect(await response.json()).toEqual({
        type: 5,
        data: {
          flags: 64,
          content: 'This button is no longer functional. Please refresh.'
        }
      });
      expect(workflowApi.start).not.toHaveBeenCalled();
    });
  });

  describe('when the request fails verification', () => {
    it('returns 401 when the public key is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', undefined);

      const response = await POST(signedRequest(pingInteraction()));

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the signature header is missing', async () => {
      const response = await POST(
        discordRequest({
          body: JSON.stringify(pingInteraction()),
          signature: null
        })
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the signature does not match the body', async () => {
      const signed = signedRequest(pingInteraction());
      const tampered = discordRequest({
        body: JSON.stringify(pingInteraction({ id: 'tampered' })),
        signature: signed.headers.get('X-Signature-Ed25519')
      });

      const response = await POST(tampered);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
      expect(workflowApi.start).not.toHaveBeenCalled();
    });

    it('logs the verification error once', async () => {
      await POST(
        discordRequest({
          body: JSON.stringify(pingInteraction()),
          timestamp: null,
          signature: 'ab'
        })
      );

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        'Discord interaction error:',
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Discord request is missing timestamp in header'
        })
      );
    });

    it('returns the generic error message with status 200 for a malformed signature', async () => {
      const response = await POST(
        discordRequest({
          body: JSON.stringify(pingInteraction()),
          signature: 'abcd'
        })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(GENERIC_ERROR_RESPONSE);
    });
  });

  describe('when the verified body is invalid', () => {
    it('returns the generic error message for a non-json body', async () => {
      const response = await POST(discordRequest({ body: 'not json' }));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(GENERIC_ERROR_RESPONSE);
    });

    it('returns the generic error message for an unknown interaction shape', async () => {
      const response = await POST(
        signedRequest({ ...pingInteraction(), type: 7 })
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(GENERIC_ERROR_RESPONSE);
    });

    it('logs the error twice for unhandled failures', async () => {
      await POST(discordRequest({ body: 'not json' }));

      expect(consoleError).toHaveBeenCalledTimes(2);
      expect(consoleError).toHaveBeenNthCalledWith(
        1,
        'Discord interaction error:',
        expect.any(SyntaxError)
      );
      expect(consoleError).toHaveBeenNthCalledWith(
        2,
        'Failed to handle Discord interaction:',
        expect.any(SyntaxError)
      );
    });

    it('returns the generic error message for an unhandled interaction type', async () => {
      vi.mocked(verifyModule.verifyDiscordRequest).mockResolvedValueOnce({
        type: 4
      } as unknown as Awaited<
        ReturnType<typeof verifyModule.verifyDiscordRequest>
      >);

      const response = await POST(signedRequest(pingInteraction()));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(GENERIC_ERROR_RESPONSE);
      expect(consoleError).toHaveBeenCalledWith(
        'Discord interaction error:',
        expect.objectContaining({
          message: 'Unexpected value: [object Object]'
        })
      );
    });
  });

  describe('when verification throws an application error', () => {
    const rejectVerification = (code: ApplicationErrorCode, message: string) =>
      vi
        .mocked(verifyModule.verifyDiscordRequest)
        .mockRejectedValueOnce(new ApplicationError({ code, message }));

    it.each<ApplicationErrorCode>(['UNAUTHORIZED', 'FORBIDDEN'])(
      'returns 401 for %s',
      async (code) => {
        rejectVerification(code, 'nope');

        const response = await POST(signedRequest(pingInteraction()));

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
      }
    );

    it.each<ApplicationErrorCode>(['BAD_REQUEST', 'CONFLICT', 'NOT_FOUND'])(
      'returns the error message as an ephemeral reply for %s',
      async (code) => {
        rejectVerification(code, `Problem: ${code}`);

        const response = await POST(signedRequest(pingInteraction()));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          type: 4,
          data: { content: `Problem: ${code}`, flags: 64 }
        });
        expect(consoleError).toHaveBeenCalledTimes(1);
      }
    );

    it.each<ApplicationErrorCode>([
      'INTERNAL_SERVER_ERROR',
      'VALIDATION_ERROR',
      'TOO_MANY_REQUESTS'
    ])('returns the generic error message for %s', async (code) => {
      rejectVerification(code, 'hidden detail');

      const response = await POST(signedRequest(pingInteraction()));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(GENERIC_ERROR_RESPONSE);
      expect(consoleError).toHaveBeenCalledTimes(2);
    });
  });

  describe('when a command handler throws', () => {
    it('rejects with the application command error instead of mapping it', async () => {
      const error = new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Missing'
      });
      throwFromStart(error);

      await expect(
        POST(signedRequest(applicationCommandInteraction()))
      ).rejects.toBe(error);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('rejects with the button error instead of mapping it', async () => {
      const error = new ApplicationError({
        code: 'FORBIDDEN',
        message: 'Denied'
      });
      throwFromStart(error);

      await expect(
        POST(signedRequest(buttonInteraction('task:enter:task-1')))
      ).rejects.toBe(error);
      expect(consoleError).not.toHaveBeenCalled();
    });
  });
});
