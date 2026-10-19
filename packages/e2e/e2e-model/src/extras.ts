import { z } from 'zod';
import {
  AccountStatus,
  IdentityProvider,
  IntegrationProvider,
  IntegrationStatus,
  LastPostedType,
  PickerStatus,
  TeamRole,
  UserSource
} from '@giveaway/db-model';
import { twitchIntegrationSettingsSchema } from '@giveaway/twitch-model/integration';
import { e2eNamespaceSchema, e2ePersonaSchema } from './personas';
import { e2eTeamSlugSchema } from './naming';
import { E2E_MAX_OFFSET_SECONDS, E2E_RUN_ID_LENGTH } from './requests';

export const E2E_MAX_EXTRA_USERS = 50;
export const E2E_MAX_ACCOUNTS = 5;
export const E2E_MAX_SCOPES = 20;
export const E2E_MAX_LABEL_LENGTH = 80;
export const E2E_MAX_INVITES = 10;
export const E2E_MAX_PICKER_USERS = 50;
export const E2E_MAX_PICKER_POSTS = 10;
export const E2E_MAX_PICKER_DRAWS = 50;
export const E2E_MAX_PICKER_WINNERS = 50;
export const E2E_MAX_TEXT_LENGTH = 280;
export const E2E_IP_PREFIX = '2001:db8:e2e:';

const labelSchema = z.string().trim().min(1).max(E2E_MAX_LABEL_LENGTH);

const textSchema = z.string().max(E2E_MAX_TEXT_LENGTH);

const countSchema = z.number().int().min(0).max(1_000_000_000);

const scopesSchema = z
  .array(z.string().regex(/^[\w.:/-]{1,100}$/))
  .max(E2E_MAX_SCOPES);

type Ctx = z.RefinementCtx;

const issue = (ctx: Ctx, path: (string | number)[], message: string) =>
  ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

const findDuplicate = <T>(values: T[]) => {
  const seen = new Set<T>();
  for (const [index, value] of values.entries()) {
    if (seen.has(value)) return index;
    seen.add(value);
  }
  return undefined;
};

export const toE2eUserNamespace = (
  request: { ns: string },
  user: { ns?: string }
) => user.ns ?? request.ns;

const refineNamespaces = (
  request: { ns: string },
  users: { persona: string; ns?: string }[],
  path: string,
  message: string,
  ctx: Ctx
) => {
  const runId = request.ns.slice(0, E2E_RUN_ID_LENGTH);
  users.forEach((user, index) => {
    if (user.ns && !user.ns.startsWith(runId)) {
      issue(ctx, [path, index, 'ns'], `The namespace must start with ${runId}`);
    }
  });
  const duplicate = findDuplicate(
    users.map((user) => `${user.persona}-${toE2eUserNamespace(request, user)}`)
  );
  if (duplicate !== undefined) {
    issue(ctx, [path, duplicate], message);
  }
};

export const e2eAccountRequestSchema = z
  .object({
    identity: z.nativeEnum(IdentityProvider),
    status: z.nativeEnum(AccountStatus).default(AccountStatus.ACTIVE),
    scopes: scopesSchema.default([]),
    label: labelSchema.optional()
  })
  .strict();

export type E2eAccountRequest = z.infer<typeof e2eAccountRequestSchema>;

export const e2eLocationRequestSchema = z
  .object({
    country: labelSchema,
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    continent: labelSchema.optional(),
    continentCode: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    region: labelSchema.optional(),
    city: labelSchema.optional()
  })
  .strict();

export type E2eLocationRequest = z.infer<typeof e2eLocationRequestSchema>;

export const e2eUserExtrasSchema = z
  .object({
    persona: e2ePersonaSchema,
    ns: e2eNamespaceSchema.optional(),
    source: z.nativeEnum(UserSource).optional(),
    emailVerified: z.boolean().optional(),
    birthday: z
      .string()
      .refine(
        (value) =>
          /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
        'Invalid date'
      )
      .nullable()
      .optional(),
    accounts: z
      .array(e2eAccountRequestSchema)
      .max(E2E_MAX_ACCOUNTS)
      .superRefine((accounts, ctx) => {
        const duplicate = findDuplicate(
          accounts.map((account) => account.identity)
        );
        if (duplicate !== undefined) {
          issue(
            ctx,
            [duplicate],
            'Each identity has at most one account for each user'
          );
        }
      })
      .optional(),
    location: e2eLocationRequestSchema.optional(),
    quality: z.number().int().min(0).max(100).optional(),
    turnstile: z
      .object({
        success: z.boolean(),
        score: z.number().min(0).max(1).optional()
      })
      .strict()
      .optional()
  })
  .strict();

export type E2eUserExtras = z.infer<typeof e2eUserExtrasSchema>;

export const e2eUserExtrasRequestSchema = z
  .object({
    ns: e2eNamespaceSchema,
    users: z.array(e2eUserExtrasSchema).min(1).max(E2E_MAX_EXTRA_USERS)
  })
  .strict()
  .superRefine((value, ctx) =>
    refineNamespaces(
      value,
      value.users,
      'users',
      'Each persona and namespace appears at most once',
      ctx
    )
  );

export type E2eUserExtrasRequest = z.infer<typeof e2eUserExtrasRequestSchema>;

export type E2eUserExtrasRequestInput = z.input<
  typeof e2eUserExtrasRequestSchema
>;

export const e2eIntegrationRequestSchema = z
  .object({
    provider: z.nativeEnum(IntegrationProvider),
    status: z
      .enum([IntegrationStatus.ACTIVE, IntegrationStatus.ERROR])
      .default(IntegrationStatus.ACTIVE),
    label: labelSchema.optional(),
    scopes: scopesSchema.optional(),
    settings: z.record(z.string(), z.unknown()).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.provider !== IntegrationProvider.TWITCH || !value.settings) {
      return;
    }
    const result = twitchIntegrationSettingsSchema
      .strict()
      .safeParse(value.settings);
    if (!result.success) {
      issue(
        ctx,
        ['settings'],
        'Twitch settings need broadcasterId, broadcasterLogin, broadcasterDisplayName and channelUrl'
      );
    }
  });

export type E2eIntegrationRequest = z.infer<typeof e2eIntegrationRequestSchema>;

export const e2eIntegrationsRequestSchema = z
  .object({
    team: e2eTeamSlugSchema,
    integrations: z
      .array(e2eIntegrationRequestSchema)
      .min(1)
      .max(Object.keys(IntegrationProvider).length)
  })
  .strict()
  .superRefine((value, ctx) => {
    const duplicate = findDuplicate(
      value.integrations.map((integration) => integration.provider)
    );
    if (duplicate !== undefined) {
      issue(
        ctx,
        ['integrations', duplicate],
        'Each provider has at most one integration for each team'
      );
    }
  });

export type E2eIntegrationsRequest = z.infer<
  typeof e2eIntegrationsRequestSchema
>;

export type E2eIntegrationsRequestInput = z.input<
  typeof e2eIntegrationsRequestSchema
>;

const offsetSchema = z
  .number()
  .int()
  .min(-E2E_MAX_OFFSET_SECONDS)
  .max(E2E_MAX_OFFSET_SECONDS);

export const e2eInvitesRequestSchema = z
  .object({
    ns: e2eNamespaceSchema,
    team: e2eTeamSlugSchema,
    emails: z
      .array(
        z
          .object({
            persona: e2ePersonaSchema,
            ns: e2eNamespaceSchema.optional(),
            role: z.enum([TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST])
          })
          .strict()
      )
      .max(E2E_MAX_INVITES)
      .default([]),
    link: z
      .object({ expiresIn: offsetSchema.nullable().default(null) })
      .strict()
      .optional()
  })
  .strict()
  .superRefine((value, ctx) =>
    refineNamespaces(
      value,
      value.emails,
      'emails',
      'Each persona and namespace is invited at most once',
      ctx
    )
  );

export type E2eInvitesRequest = z.infer<typeof e2eInvitesRequestSchema>;

export type E2eInvitesRequestInput = z.input<typeof e2eInvitesRequestSchema>;

export const e2ePickerUserRequestSchema = z
  .object({
    username: z.string().regex(/^\w{1,15}$/),
    name: labelSchema.optional(),
    description: textSchema.optional(),
    location: labelSchema.optional(),
    profileImageUrl: z.string().url().max(500).optional(),
    bannerImageUrl: z.string().url().max(500).optional(),
    createdDaysAgo: z.number().int().min(0).max(10_000).optional(),
    followersCount: countSchema.optional(),
    followingCount: countSchema.optional(),
    tweetCount: countSchema.optional(),
    verified: z.boolean().optional(),
    canDm: z.boolean().optional()
  })
  .strict();

export type E2ePickerUserRequest = z.infer<typeof e2ePickerUserRequestSchema>;

export const e2ePickerPostRequestSchema = z
  .object({
    text: textSchema.optional(),
    favoriteCount: countSchema.optional(),
    retweetCount: countSchema.optional(),
    replyCount: countSchema.optional(),
    quoteCount: countSchema.optional(),
    viewCount: countSchema.optional()
  })
  .strict();

export type E2ePickerPostRequest = z.infer<typeof e2ePickerPostRequestSchema>;

export const e2ePickerRequestSchema = z
  .object({
    team: e2eTeamSlugSchema,
    status: z.nativeEnum(PickerStatus).default(PickerStatus.COMPLETE),
    winners: z.number().int().min(1).max(E2E_MAX_PICKER_WINNERS).default(1),
    runIn: offsetSchema.optional(),
    minPostCount: countSchema.optional(),
    minAccountAgeDays: countSchema.optional(),
    minFollowersCount: countSchema.optional(),
    minFollowingCount: countSchema.optional(),
    requireProfileImage: z.boolean().optional(),
    requireBannerImage: z.boolean().optional(),
    requireLocation: z.boolean().optional(),
    requireBio: z.boolean().optional(),
    lastPostWithin: z.nativeEnum(LastPostedType).optional(),
    users: z
      .array(e2ePickerUserRequestSchema)
      .max(E2E_MAX_PICKER_USERS)
      .default([]),
    posts: z
      .array(e2ePickerPostRequestSchema)
      .max(E2E_MAX_PICKER_POSTS)
      .default([]),
    draws: z
      .array(
        z
          .object({
            user: z.number().int().min(0),
            disqualified: z.string().min(1).max(500).optional()
          })
          .strict()
      )
      .max(E2E_MAX_PICKER_DRAWS)
      .default([])
  })
  .strict()
  .superRefine((value, ctx) => {
    value.draws.forEach((draw, index) => {
      if (draw.user >= value.users.length) {
        issue(
          ctx,
          ['draws', index, 'user'],
          `There is no user at index ${draw.user}`
        );
      }
    });
  });

export type E2ePickerRequest = z.infer<typeof e2ePickerRequestSchema>;

export type E2ePickerRequestInput = z.input<typeof e2ePickerRequestSchema>;
