import { ApplicationError } from '@/lib/errors';
import { z } from 'zod';

// JWK (JSON Web Key) schema
const jwkSchema = z.object({
  kty: z.string(),
  crv: z.string().optional(),
  x: z.string().optional(),
  y: z.string().optional(),
  d: z.string().optional(),
  alg: z.string().optional(),
  kid: z.string().optional(),
  key_ops: z.array(z.string()).optional()
});

// DPoP Key schema
const dpopKeySchema = z.object({
  jwk: jwkSchema,
  'get algorithms': z.array(z.string()).optional(),
  'get isSymetric': z.boolean().optional(),
  'get bareJwk': jwkSchema.optional(),
  'get isPrivate': z.boolean().optional()
});

// Auth Method schema
const authMethodSchema = z.object({
  kid: z.string(),
  method: z.string()
});

// Server Metadata schema
const serverMetadataSchema = z.object({
  issuer: z.string(),
  request_parameter_supported: z.boolean().optional(),
  request_uri_parameter_supported: z.boolean().optional(),
  require_request_uri_registration: z.boolean().optional(),
  scopes_supported: z.array(z.string()).optional(),
  subject_types_supported: z.array(z.string()).optional(),
  response_types_supported: z.array(z.string()).optional(),
  response_modes_supported: z.array(z.string()).optional(),
  grant_types_supported: z.array(z.string()).optional(),
  code_challenge_methods_supported: z.array(z.string()).optional(),
  ui_locales_supported: z.array(z.string()).optional(),
  display_values_supported: z.array(z.string()).optional(),
  request_object_signing_alg_values_supported: z.array(z.string()).optional(),
  authorization_response_iss_parameter_supported: z.boolean().optional(),
  request_object_encryption_alg_values_supported: z
    .array(z.string())
    .optional(),
  request_object_encryption_enc_values_supported: z
    .array(z.string())
    .optional(),
  jwks_uri: z.string().optional(),
  authorization_endpoint: z.string().optional(),
  token_endpoint: z.string().optional(),
  token_endpoint_auth_methods_supported: z.array(z.string()).optional(),
  token_endpoint_auth_signing_alg_values_supported: z
    .array(z.string())
    .optional(),
  revocation_endpoint: z.string().optional(),
  pushed_authorization_request_endpoint: z.string().optional(),
  require_pushed_authorization_requests: z.boolean().optional(),
  dpop_signing_alg_values_supported: z.array(z.string()).optional(),
  client_id_metadata_document_supported: z.boolean().optional()
});

// Client Metadata schema
const clientMetadataSchema = z.object({
  redirect_uris: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  grant_types: z.array(z.string()).optional(),
  scope: z.string().optional(),
  token_endpoint_auth_method: z.string().optional(),
  token_endpoint_auth_signing_alg: z.string().optional(),
  jwks_uri: z.string().optional(),
  application_type: z.string().optional(),
  subject_type: z.string().optional(),
  authorization_signed_response_alg: z.string().optional(),
  client_id: z.string().optional(),
  client_name: z.string().optional(),
  client_uri: z.string().optional(),
  logo_uri: z.string().optional(),
  dpop_bound_access_tokens: z.boolean().optional()
});

// Keyset schema
const keysetSchema = z.object({
  keys: z.array(jwkSchema)
});

// Runtime schema
const runtimeSchema = z.object({
  implementation: z.record(z.unknown()).optional(),
  hasImplementationLock: z.boolean().optional()
});

// Getter schema (used in various resolvers)
const getterSchema = z.object({
  store: z.record(z.unknown()).optional(),
  options: z.record(z.unknown()).optional(),
  pending: z.record(z.unknown()).optional()
});

// Resolver schemas
const didResolverSchema = z.object({
  getter: getterSchema.optional()
});

const handleResolverSchema = z.object({
  getter: getterSchema.optional()
});

const identityResolverSchema = z.object({
  didResolver: didResolverSchema.optional(),
  handleResolver: handleResolverSchema.optional()
});

const protectedResourceMetadataResolverSchema = getterSchema.extend({
  allowHttpResource: z.boolean().optional()
});

const authorizationServerMetadataResolverSchema = getterSchema.extend({
  allowHttpIssuer: z.boolean().optional()
});

const oauthResolverSchema = z.object({
  identityResolver: identityResolverSchema.optional(),
  protectedResourceMetadataResolver:
    protectedResourceMetadataResolverSchema.optional(),
  authorizationServerMetadataResolver:
    authorizationServerMetadataResolverSchema.optional()
});

// Event Target schema
const eventTargetSchema = z.object({
  eventTarget: z.record(z.unknown()).optional()
});

// Session Getter schema
const sessionGetterSchema = getterSchema.extend({
  runtime: runtimeSchema.optional(),
  eventTarget: eventTargetSchema.optional()
});

// Server schema (main container for OAuth server data)
const serverSchema = z.object({
  authMethod: authMethodSchema,
  dpopKey: dpopKeySchema,
  serverMetadata: serverMetadataSchema.optional(),
  clientMetadata: clientMetadataSchema.optional(),
  dpopNonces: z.record(z.unknown()).optional(),
  oauthResolver: oauthResolverSchema.optional(),
  runtime: runtimeSchema.optional(),
  keyset: keysetSchema.optional()
});

// Main Bluesky Session State schema
export const blueskySessionStateSchema = z.object({
  server: serverSchema,
  sub: z.string(), // DID (Decentralized Identifier)
  sessionGetter: sessionGetterSchema.optional()
});

export type BlueskySessionState = z.infer<typeof blueskySessionStateSchema>;

// Helper function to safely parse session state
export function parseBlueskySessionState(
  data: unknown
): BlueskySessionState | null {
  const result = blueskySessionStateSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  throw new ApplicationError({
    code: 'UNPROCESSABLE_CONTENT',
    message: 'Failed to parse Bluesky session state',
    cause: result.error
  });
}

// Helper to extract the DID from session state
export function getDidFromSessionState(data: unknown): string | null {
  const parsed = parseBlueskySessionState(data);
  return parsed?.sub ?? null;
}
