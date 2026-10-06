import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import {
  assertAsyncProperty,
  propertyParameters
} from '@giveaway/testing-server/property';
import { verifyDiscordRequest } from '../verify';
import {
  DISCORD_TEST_PUBLIC_KEY,
  discordRequest,
  signDiscordBody
} from '../testing/fixtures-discord-bot';

const headerChar = fc.mapToConstant(
  { num: 95, build: (v) => String.fromCharCode(0x20 + v) },
  { num: 1, build: () => '\t' }
);

const headerValue = fc
  .string({ unit: headerChar, minLength: 1, maxLength: 140 })
  .filter((value) => value.trim() === value && value.length > 0);

const timestamp = fc.oneof(
  fc.integer({ min: 0, max: 4_000_000_000 }).map(String),
  headerValue
);

const body = fc.oneof(
  fc.jsonValue().map((value) => JSON.stringify(value)),
  fc.string({ unit: 'binary', maxLength: 200 })
);

const hexSignature = fc.stringMatching(/^[0-9a-fA-F]{128}$/);

const signature = fc.oneof(
  hexSignature,
  headerValue,
  fc.stringMatching(/^[0-9a-f]{0,200}$/).filter((value) => value.length > 0)
);

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected verifyDiscordRequest to reject');
};

const sameBytes = (a: string, b: string) =>
  Buffer.from(a).equals(Buffer.from(b));

const expectUnauthorized = (error: unknown) => {
  expect(error).toBeInstanceOf(ApplicationError);
  expect(error).toMatchObject({ code: 'UNAUTHORIZED' });
};

const timeout = (propertyParameters().numRuns ?? 100) * 200;

describe('verifyDiscordRequest properties', { timeout }, () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', DISCORD_TEST_PUBLIC_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('[DISCORD-001] rejects arbitrary unsigned requests with UNAUTHORIZED, never another error', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        body,
        fc.option(signature, { nil: null }),
        fc.option(timestamp, { nil: null }),
        async (raw, sig, time) => {
          const error = await rejection(
            verifyDiscordRequest(
              discordRequest({ body: raw, signature: sig, timestamp: time })
            )
          );

          expectUnauthorized(error);
        }
      )
    );
  });

  it('[DISCORD-002] rejects any body other than the signed one', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        body,
        body,
        timestamp,
        async (signedBody, sentBody, time) => {
          fc.pre(!sameBytes(signedBody, sentBody));

          const error = await rejection(
            verifyDiscordRequest(
              discordRequest({
                body: sentBody,
                timestamp: time,
                signature: signDiscordBody(signedBody, time)
              })
            )
          );

          expectUnauthorized(error);
        }
      )
    );
  });

  it('[DISCORD-003] rejects any signature other than the one for the body and timestamp', async () => {
    const mutated = (sig: string) =>
      fc.oneof(
        signature,
        fc
          .tuple(
            fc.nat({ max: sig.length - 1 }),
            fc.constantFrom(...'0123456789abcdefxyz ')
          )
          .map(
            ([index, char]) => sig.slice(0, index) + char + sig.slice(index + 1)
          ),
        fc.constant(sig.slice(0, -2)),
        fc.constant(`${sig}00`)
      );

    await assertAsyncProperty(
      fc.asyncProperty(
        fc.tuple(body, timestamp).chain(([raw, time]) => {
          const expected = signDiscordBody(raw, time);
          return fc.tuple(
            fc.constant(raw),
            fc.constant(time),
            fc.constant(expected),
            mutated(expected)
          );
        }),
        async ([raw, time, expected, sig]) => {
          fc.pre(sig.toLowerCase() !== expected.toLowerCase());

          const error = await rejection(
            verifyDiscordRequest(
              discordRequest({ body: raw, timestamp: time, signature: sig })
            )
          );

          expectUnauthorized(error);
        }
      )
    );
  });

  it('[DISCORD-004] rejects a correctly signed request when a signature header is missing', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        body,
        timestamp,
        fc.constantFrom('signature', 'timestamp', 'both'),
        async (raw, time, missing) => {
          const sig = signDiscordBody(raw, time);

          const error = await rejection(
            verifyDiscordRequest(
              discordRequest({
                body: raw,
                signature: missing === 'timestamp' ? sig : null,
                timestamp: missing === 'signature' ? time : null
              })
            )
          );

          expectUnauthorized(error);
        }
      )
    );
  });

  it('[DISCORD-005] rejects every request when the public key is malformed', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        headerValue.filter((key) => !/^[0-9a-f]{64}$/i.test(key)),
        body,
        timestamp,
        async (publicKey, raw, time) => {
          vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', publicKey);

          const error = await rejection(
            verifyDiscordRequest(
              discordRequest({
                body: raw,
                timestamp: time,
                signature: signDiscordBody(raw, time)
              })
            )
          );

          expectUnauthorized(error);
        }
      )
    );
  });

  it('[DISCORD-006] a correctly signed body is either a known interaction or a VALIDATION_ERROR', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(body, timestamp, async (raw, time) => {
        const result = await verifyDiscordRequest(
          discordRequest({
            body: raw,
            timestamp: time,
            signature: signDiscordBody(raw, time)
          })
        ).then(
          (interaction) => ({ interaction }),
          (error: unknown) => ({ error })
        );

        if ('interaction' in result) {
          expect([1, 2, 3]).toContain(result.interaction.type);
        } else {
          expect(result.error).toBeInstanceOf(ApplicationError);
          expect(result.error).toMatchObject({ code: 'VALIDATION_ERROR' });
        }
      })
    );
  });
});
