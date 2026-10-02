import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  blueskySessionStateSchema,
  parseBlueskySessionState,
  getDidFromSessionState
} from '../bluesky';
import { ApplicationError } from '@/lib/errors';

const minimalState = () => ({
  server: {
    authMethod: { kid: 'key-1', method: 'private_key_jwt' },
    dpopKey: { jwk: { kty: 'EC' } }
  },
  sub: 'did:plc:abc123'
});

const fullState = () => ({
  server: {
    authMethod: { kid: 'key-1', method: 'private_key_jwt' },
    dpopKey: {
      jwk: {
        kty: 'EC',
        crv: 'P-256',
        x: 'x-coord',
        y: 'y-coord',
        d: 'private',
        alg: 'ES256',
        kid: 'dpop-1',
        key_ops: ['sign']
      },
      'get algorithms': ['ES256'],
      'get isSymetric': false,
      'get bareJwk': { kty: 'EC', crv: 'P-256' },
      'get isPrivate': true
    },
    serverMetadata: {
      issuer: 'https://bsky.social',
      request_parameter_supported: true,
      request_uri_parameter_supported: true,
      require_request_uri_registration: true,
      scopes_supported: ['atproto'],
      subject_types_supported: ['public'],
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      ui_locales_supported: ['en-US'],
      display_values_supported: ['page'],
      request_object_signing_alg_values_supported: ['ES256'],
      authorization_response_iss_parameter_supported: true,
      request_object_encryption_alg_values_supported: [],
      request_object_encryption_enc_values_supported: [],
      jwks_uri: 'https://bsky.social/jwks',
      authorization_endpoint: 'https://bsky.social/oauth/authorize',
      token_endpoint: 'https://bsky.social/oauth/token',
      token_endpoint_auth_methods_supported: ['private_key_jwt'],
      token_endpoint_auth_signing_alg_values_supported: ['ES256'],
      revocation_endpoint: 'https://bsky.social/oauth/revoke',
      pushed_authorization_request_endpoint: 'https://bsky.social/oauth/par',
      require_pushed_authorization_requests: true,
      dpop_signing_alg_values_supported: ['ES256'],
      client_id_metadata_document_supported: true
    },
    clientMetadata: {
      redirect_uris: ['https://giveaway.dog/callback'],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'ES256',
      jwks_uri: 'https://giveaway.dog/jwks.json',
      application_type: 'web',
      subject_type: 'public',
      authorization_signed_response_alg: 'RS256',
      client_id: 'https://giveaway.dog/client-metadata.json',
      client_name: 'Giveaway.dog',
      client_uri: 'https://giveaway.dog',
      logo_uri: 'https://giveaway.dog/logo.png',
      dpop_bound_access_tokens: true
    },
    dpopNonces: { 'bsky.social': 'nonce-1' },
    oauthResolver: {
      identityResolver: {
        didResolver: { getter: { store: {}, options: {}, pending: {} } },
        handleResolver: { getter: { store: { a: 1 } } }
      },
      protectedResourceMetadataResolver: {
        store: {},
        allowHttpResource: false
      },
      authorizationServerMetadataResolver: {
        options: {},
        allowHttpIssuer: true
      }
    },
    runtime: { implementation: { name: 'node' }, hasImplementationLock: true },
    keyset: { keys: [{ kty: 'EC', kid: 'key-1' }] }
  },
  sub: 'did:plc:full',
  sessionGetter: {
    store: {},
    options: {},
    pending: {},
    runtime: { hasImplementationLock: false },
    eventTarget: { eventTarget: {} }
  }
});

const withPath = (
  path: (string | number)[],
  value: unknown
): Record<string, unknown> => {
  const state = fullState() as unknown as Record<string, unknown>;
  let cursor = state;
  for (const key of path.slice(0, -1)) {
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
  return state;
};

describe('blueskySessionStateSchema', () => {
  describe('when the state is valid', () => {
    it('accepts the minimal required shape', () => {
      expect(blueskySessionStateSchema.parse(minimalState())).toEqual(
        minimalState()
      );
    });

    it('keeps every known optional field', () => {
      expect(blueskySessionStateSchema.parse(fullState())).toEqual(fullState());
    });

    it('strips unknown keys at every level', () => {
      const state = {
        ...minimalState(),
        extra: true,
        server: {
          ...minimalState().server,
          extra: true,
          dpopKey: { jwk: { kty: 'EC', extra: true } }
        }
      };

      expect(blueskySessionStateSchema.parse(state)).toEqual(minimalState());
    });
  });

  describe('when the state is invalid', () => {
    it.each([
      [['sub'], undefined],
      [['sub'], 123],
      [['server'], undefined],
      [['server', 'authMethod'], undefined],
      [['server', 'authMethod', 'kid'], undefined],
      [['server', 'authMethod', 'method'], 1],
      [['server', 'dpopKey'], undefined],
      [['server', 'dpopKey', 'jwk'], undefined],
      [['server', 'dpopKey', 'jwk', 'kty'], undefined],
      [
        ['server', 'dpopKey', 'jwk', 'key_ops'],
        ['sign', 1]
      ],
      [['server', 'dpopKey', 'get algorithms'], 'ES256'],
      [['server', 'dpopKey', 'get isSymetric'], 'no'],
      [['server', 'dpopKey', 'get bareJwk'], {}],
      [['server', 'dpopKey', 'get isPrivate'], 1],
      [['server', 'serverMetadata', 'issuer'], undefined],
      [['server', 'serverMetadata', 'scopes_supported'], 'atproto'],
      [
        ['server', 'serverMetadata', 'require_pushed_authorization_requests'],
        'yes'
      ],
      [['server', 'clientMetadata', 'redirect_uris'], 'https://a.b'],
      [['server', 'clientMetadata', 'dpop_bound_access_tokens'], 'true'],
      [['server', 'dpopNonces'], 'nonce'],
      [
        [
          'server',
          'oauthResolver',
          'identityResolver',
          'didResolver',
          'getter',
          'store'
        ],
        'x'
      ],
      [
        [
          'server',
          'oauthResolver',
          'identityResolver',
          'handleResolver',
          'getter'
        ],
        'x'
      ],
      [
        [
          'server',
          'oauthResolver',
          'protectedResourceMetadataResolver',
          'allowHttpResource'
        ],
        'no'
      ],
      [
        [
          'server',
          'oauthResolver',
          'authorizationServerMetadataResolver',
          'allowHttpIssuer'
        ],
        'no'
      ],
      [['server', 'runtime', 'implementation'], 'node'],
      [['server', 'runtime', 'hasImplementationLock'], 'yes'],
      [['server', 'keyset', 'keys'], undefined],
      [['server', 'keyset', 'keys', 0, 'kty'], undefined],
      [['sessionGetter', 'pending'], []],
      [['sessionGetter', 'runtime'], 'node'],
      [['sessionGetter', 'eventTarget', 'eventTarget'], 1]
    ])('rejects an invalid value at %j', (path, value) => {
      const result = blueskySessionStateSchema.safeParse(withPath(path, value));

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path.slice(0, path.length)).toEqual(path);
    });

    it('reports the offending array index inside the jwk key operations', () => {
      const result = blueskySessionStateSchema.safeParse(
        withPath(['server', 'dpopKey', 'jwk', 'key_ops'], ['sign', 1])
      );

      expect(result.error?.issues[0].path).toEqual([
        'server',
        'dpopKey',
        'jwk',
        'key_ops',
        1
      ]);
    });

    it('requires kty inside the bare jwk getter when it is present', () => {
      const result = blueskySessionStateSchema.safeParse(
        withPath(['server', 'dpopKey', 'get bareJwk'], {})
      );

      expect(result.error?.issues[0].path).toEqual([
        'server',
        'dpopKey',
        'get bareJwk',
        'kty'
      ]);
    });

    it.each([[null], [undefined], ['state'], [[]]])('rejects %j', (value) => {
      expect(blueskySessionStateSchema.safeParse(value).success).toBe(false);
    });
  });
});

describe('parseBlueskySessionState', () => {
  it('returns the parsed session state', () => {
    expect(parseBlueskySessionState(fullState())).toEqual(fullState());
  });

  it('throws an UNPROCESSABLE_CONTENT application error when parsing fails', () => {
    let thrown: unknown;
    try {
      parseBlueskySessionState({ sub: 'did:plc:abc' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApplicationError);
    expect(thrown).toMatchObject({
      code: 'UNPROCESSABLE_CONTENT',
      message: 'Failed to parse Bluesky session state'
    });
    expect((thrown as ApplicationError).cause).toBeInstanceOf(ZodError);
  });

  it('throws instead of returning null for a null input', () => {
    expect(() => parseBlueskySessionState(null)).toThrow(
      'Failed to parse Bluesky session state'
    );
  });
});

describe('getDidFromSessionState', () => {
  it('returns the DID stored in sub', () => {
    expect(getDidFromSessionState(minimalState())).toBe('did:plc:abc123');
  });

  it('returns an empty sub as-is', () => {
    expect(getDidFromSessionState({ ...minimalState(), sub: '' })).toBe('');
  });

  it('throws instead of returning null when the state is invalid', () => {
    expect(() => getDidFromSessionState(undefined)).toThrow(ApplicationError);
  });
});
