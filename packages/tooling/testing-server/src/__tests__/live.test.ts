import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  expectLiveResponse,
  liveVariable,
  missingLiveVariables,
  recordResponses,
  redactSecrets,
  toRecordingFileName
} from '../live';

const CALL = { provider: 'Acme', call: 'get thing' };

const schema = z.object({
  id: z.string(),
  owner: z.object({ name: z.string() })
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('missingLiveVariables', () => {
  it('lists the variables that are not set or are empty', () => {
    vi.stubEnv('LIVE_TEST_SET', 'value');
    vi.stubEnv('LIVE_TEST_EMPTY', '');

    expect(
      missingLiveVariables([
        'LIVE_TEST_SET',
        'LIVE_TEST_EMPTY',
        'LIVE_TEST_UNSET'
      ])
    ).toEqual(['LIVE_TEST_EMPTY', 'LIVE_TEST_UNSET']);
  });
});

describe('liveVariable', () => {
  it('returns the value of a variable', () => {
    vi.stubEnv('LIVE_TEST_SET', 'value');

    expect(liveVariable('LIVE_TEST_SET')).toBe('value');
  });

  it('throws when the variable is not set', () => {
    expect(() => liveVariable('LIVE_TEST_UNSET')).toThrow(
      'LIVE_TEST_UNSET is not set'
    );
  });
});

describe('expectLiveResponse', () => {
  it('returns the parsed response', () => {
    expect(
      expectLiveResponse(
        schema,
        { id: '1', owner: { name: 'a' }, extra: true },
        CALL
      )
    ).toEqual({ id: '1', owner: { name: 'a' } });
  });

  it('names the provider, the call and the issue paths, without the payload', () => {
    const run = () =>
      expectLiveResponse(
        schema,
        { id: 42, owner: { name: 'secret-person' }, token: 'secret-token' },
        CALL
      );

    expect(run).toThrow(
      'Acme get thing: the response does not match the schema of the app\n  id: invalid_type, expected string'
    );
    expect(run).not.toThrow(/secret|42/);
  });

  it('names the root when the whole response is wrong', () => {
    expect(() => expectLiveResponse(schema, 'oops', CALL)).toThrow(
      /\n {2}\(root\): invalid_type, expected object$/
    );
  });

  it('names nested paths and issues that expect no type', () => {
    const run = () =>
      expectLiveResponse(
        z.object({ list: z.array(z.string()).min(2) }),
        { list: ['a'] },
        CALL
      );

    expect(run).toThrow(/\n {2}list: too_small$/);
  });
});

describe('recordResponses', () => {
  const stubFetch = (body: string, status = 200) => {
    const fetchMock = vi.fn(async () => new Response(body, { status }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('records the method, the url, the status and the JSON body, and leaves the response readable', async () => {
    stubFetch('{"id":"1"}');
    const recorder = recordResponses();

    const response = await fetch('https://api.acme.test/things/1', {
      method: 'post'
    });

    expect(await response.json()).toEqual({ id: '1' });
    expect(recorder.responses).toEqual([
      {
        method: 'POST',
        url: 'https://api.acme.test/things/1',
        status: 200,
        body: { id: '1' }
      }
    ]);
    expect(recorder.body('POST https://api.acme.test/things', CALL)).toEqual({
      id: '1'
    });
  });

  it('records a Request and a body that is not JSON', async () => {
    stubFetch('plain text');
    const recorder = recordResponses();

    await fetch(new Request('https://api.acme.test/text', { method: 'PUT' }));

    expect(recorder.responses).toEqual([
      {
        method: 'PUT',
        url: 'https://api.acme.test/text',
        status: 200,
        body: 'plain text'
      }
    ]);
  });

  it('defaults to GET and returns the last matching response', async () => {
    const fetchMock = stubFetch('{}');
    fetchMock
      .mockResolvedValueOnce(new Response('{"n":1}'))
      .mockResolvedValueOnce(new Response('{"n":2}'));
    const recorder = recordResponses();

    await fetch('https://api.acme.test/things?page=1');
    await fetch('https://api.acme.test/things?page=2');

    expect(recorder.body('https://api.acme.test/things', CALL)).toEqual({
      n: 2
    });
  });

  it('fails when the app sent no matching request', async () => {
    stubFetch('{}');
    const recorder = recordResponses();

    await fetch('https://api.acme.test/other');

    expect(() =>
      recorder.body('POST https://api.acme.test/other', CALL)
    ).toThrow(
      'Acme get thing: the app sent no POST https://api.acme.test/other'
    );
  });

  it('fails with the status only when the provider answered an error', async () => {
    stubFetch('{"error":"bad secret-token"}', 401);
    const recorder = recordResponses();

    await fetch('https://api.acme.test/things');

    const run = () => recorder.body('https://api.acme.test/things', CALL);
    expect(run).toThrow('Acme get thing: HTTP 401');
    expect(run).not.toThrow(/secret/);
  });

  it('accepts the last 2xx status and refuses 300', async () => {
    const fetchMock = stubFetch('{}');
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 299 }))
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const recorder = recordResponses();

    await fetch('https://api.acme.test/a');
    await fetch('https://api.acme.test/b');

    expect(recorder.body('https://api.acme.test/a', CALL)).toEqual({});
    expect(() => recorder.body('https://api.acme.test/b', CALL)).toThrow(
      'HTTP 304'
    );
  });
});

describe('redactSecrets', () => {
  it('replaces the string values of token, secret, password and email keys', () => {
    expect(
      redactSecrets({
        access_token: 'abc',
        refresh_token: 'def',
        client_secret: 'ghi',
        password: 'jkl',
        email: 'person@example.com',
        expires_in: 3600,
        token_type: 'bearer',
        name: 'Acme'
      })
    ).toEqual({
      access_token: '[redacted]',
      refresh_token: '[redacted]',
      client_secret: '[redacted]',
      password: '[redacted]',
      email: '[redacted]',
      expires_in: 3600,
      token_type: '[redacted]',
      name: 'Acme'
    });
  });

  it('redacts nested objects and arrays and keeps null', () => {
    expect(
      redactSecrets({
        data: [{ id: '1', Email: 'a@example.com', banner: null }],
        session: { idToken: 'x' }
      })
    ).toEqual({
      data: [{ id: '1', Email: '[redacted]', banner: null }],
      session: { idToken: '[redacted]' }
    });
  });

  it('keeps values that are not objects', () => {
    expect(redactSecrets('text')).toBe('text');
    expect(redactSecrets(null)).toBeNull();
  });
});

describe('toRecordingFileName', () => {
  it('names the file after the provider and the call', () => {
    expect(
      toRecordingFileName({ provider: 'Twitch', call: 'get users by login' })
    ).toBe('twitch-get-users-by-login.json');
    expect(toRecordingFileName({ provider: 'X', call: 'oEmbed!' })).toBe(
      'x-oembed.json'
    );
  });
});

describe('recording live responses', () => {
  it('writes the redacted response to LIVE_RECORD_DIR, also when it does not match', () => {
    const directory = mkdtempSync(join(tmpdir(), 'live-record-'));
    vi.stubEnv('LIVE_RECORD_DIR', join(directory, 'nested'));

    try {
      expectLiveResponse(
        schema,
        { id: '1', owner: { name: 'a' }, access_token: 'secret' },
        CALL
      );
      expect(() => expectLiveResponse(schema, { id: 2 }, CALL)).toThrow();

      const file = join(directory, 'nested', 'acme-get-thing.json');
      expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ id: 2 });
      expect(readFileSync(file, 'utf8').endsWith('}\n')).toBe(true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('writes the first response with its secrets redacted', () => {
    const directory = mkdtempSync(join(tmpdir(), 'live-record-'));
    vi.stubEnv('LIVE_RECORD_DIR', directory);

    try {
      expectLiveResponse(
        schema,
        { id: '1', owner: { name: 'a' }, access_token: 'secret' },
        CALL
      );

      expect(
        JSON.parse(readFileSync(join(directory, 'acme-get-thing.json'), 'utf8'))
      ).toEqual({
        id: '1',
        owner: { name: 'a' },
        access_token: '[redacted]'
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('writes nothing without LIVE_RECORD_DIR', () => {
    const directory = mkdtempSync(join(tmpdir(), 'live-record-'));
    vi.stubEnv('LIVE_RECORD_DIR', '');

    try {
      expectLiveResponse(schema, { id: '1', owner: { name: 'a' } }, CALL);

      expect(readdirSync(directory)).toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
