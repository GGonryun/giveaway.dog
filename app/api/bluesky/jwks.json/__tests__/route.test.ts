import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

const m = vi.hoisted(() => ({
  fromImportable: vi.fn()
}));

vi.mock('@atproto/jwk-jose', () => ({
  JoseKey: { fromImportable: m.fromImportable }
}));

const PRIVATE_JWK_WITHOUT_KID = {
  kty: 'EC',
  crv: 'P-256',
  x: 'x-coord',
  y: 'y-coord',
  d: 'private-scalar'
};

const PRIVATE_JWK = { ...PRIVATE_JWK_WITHOUT_KID, kid: 'bluesky-key' };

const PUBLIC_JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'x-coord',
  y: 'y-coord',
  kid: 'bluesky-key',
  alg: 'ES256',
  use: 'sig'
};

describe('bluesky jwks.json GET', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.fromImportable.mockReset();
    m.fromImportable.mockResolvedValue({ publicJwk: PUBLIC_JWK });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when BLUESKY_PRIVATE_KEY is not configured', () => {
    it('returns a 500 error', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', undefined);

      const res = await GET();

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: 'BLUESKY_PRIVATE_KEY not configured'
      });
    });

    it('treats an empty key as not configured', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', '');

      const res = await GET();

      expect(await res.json()).toEqual({
        error: 'BLUESKY_PRIVATE_KEY not configured'
      });
      expect(m.fromImportable).not.toHaveBeenCalled();
    });
  });

  describe('when the key is configured', () => {
    it('imports the parsed private JWK using its kid', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(PRIVATE_JWK));

      await GET();

      expect(m.fromImportable).toHaveBeenCalledWith(PRIVATE_JWK, 'bluesky-key');
    });

    it('falls back to the key1 kid when the JWK has none', async () => {
      vi.stubEnv(
        'BLUESKY_PRIVATE_KEY',
        JSON.stringify(PRIVATE_JWK_WITHOUT_KID)
      );

      await GET();

      expect(m.fromImportable).toHaveBeenCalledWith(
        PRIVATE_JWK_WITHOUT_KID,
        'key1'
      );
    });

    it('falls back to the key1 kid when the kid is empty', async () => {
      vi.stubEnv(
        'BLUESKY_PRIVATE_KEY',
        JSON.stringify({ ...PRIVATE_JWK, kid: '' })
      );

      await GET();

      expect(m.fromImportable).toHaveBeenCalledWith(
        { ...PRIVATE_JWK, kid: '' },
        'key1'
      );
    });

    it('returns a JWKS containing only the public key', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(PRIVATE_JWK));

      const res = await GET();

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ keys: [PUBLIC_JWK] });
    });

    it('awaits a public JWK exposed as a promise', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(PRIVATE_JWK));
      m.fromImportable.mockResolvedValue({
        publicJwk: Promise.resolve(PUBLIC_JWK)
      });

      const res = await GET();

      expect(await res.json()).toEqual({ keys: [PUBLIC_JWK] });
    });

    it('serves the JWKS as JSON cacheable for one hour', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(PRIVATE_JWK));

      const res = await GET();

      expect(res.headers.get('content-type')).toBe('application/json');
      expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    });
  });

  describe('when generating the JWKS fails', () => {
    it('returns a 500 error when the key is not valid JSON', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', 'not-json');

      const res = await GET();

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to generate JWKS' });
      expect(m.fromImportable).not.toHaveBeenCalled();
    });

    it('returns a 500 error when the key cannot be imported', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(PRIVATE_JWK));
      m.fromImportable.mockRejectedValue(new Error('bad key'));

      const res = await GET();

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to generate JWKS' });
    });

    it('returns a 500 error when the key JSON is null', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', 'null');

      const res = await GET();

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to generate JWKS' });
    });

    it('logs the underlying error', async () => {
      const failure = new Error('bad key');
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(PRIVATE_JWK));
      m.fromImportable.mockRejectedValue(failure);

      await GET();

      expect(consoleError).toHaveBeenCalledWith(
        'Error generating JWKS:',
        failure
      );
    });
  });
});
