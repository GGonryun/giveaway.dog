import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { assertAsyncProperty } from '@giveaway/testing-server/property';
import { POST } from '../handler';
import { DISCORD_TEST_PUBLIC_KEY } from '../../testing/fixtures-discord-bot';

const workflowApi = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('workflow/api', () => workflowApi);

const headerChar = fc.mapToConstant(
  { num: 95, build: (v) => String.fromCharCode(0x20 + v) },
  { num: 1, build: () => '\t' }
);

const headerValue = fc
  .string({ unit: headerChar, minLength: 1, maxLength: 140 })
  .filter((value) => value.trim() === value && value.length > 0);

const headerName = fc.oneof(
  fc.constantFrom(
    'X-Signature-Ed25519',
    'X-Signature-Timestamp',
    'Content-Type'
  ),
  fc.stringMatching(/^[A-Za-z][A-Za-z0-9-]{0,30}$/)
);

const headerEntry = fc.oneof(
  fc.tuple(headerName, headerValue),
  fc.tuple(
    fc.constant('X-Signature-Ed25519'),
    fc.stringMatching(/^[0-9a-f]{128}$/)
  )
);

const body = fc.oneof(
  fc.jsonValue().map((value) => JSON.stringify(value)),
  fc.string({ unit: 'binary', maxLength: 200 })
);

describe('POST discord interactions handler properties', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', DISCORD_TEST_PUBLIC_KEY);
    workflowApi.start.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('[DISCORD-101] responds 401 to arbitrary headers and bodies without a valid signature', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        fc.array(headerEntry, { maxLength: 6 }),
        body,
        async (headers, raw) => {
          const response = await POST(
            new NextRequest('http://localhost:3000/api/discord/interactions', {
              method: 'POST',
              headers: new Headers(headers),
              body: raw
            })
          );

          expect(response.status).toBe(401);
          expect(workflowApi.start).not.toHaveBeenCalled();
        }
      )
    );
  });
});
