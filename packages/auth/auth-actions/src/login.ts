'use server';

import { ApplicationError, assertNever } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { parseProvider, blueskyHandleSchema } from '@giveaway/user-model/user';
import { AuthError } from 'next-auth';
import z from 'zod';
import { signIn } from '@giveaway/auth-server/config';
import { IdentityProvider, Prisma, PrismaClient } from '@giveaway/db-model';
import { IDENTITY_PROVIDER_TO_AUTH_PROVIDER } from '@giveaway/integration-model/providers';
import { redirect } from 'next/navigation';
import {
  INVALID_LOGIN_EMAIL_MESSAGE,
  loginEmailSchema
} from '@giveaway/auth-model/email';
import {
  instagramProfileUrlSchema,
  extractInstagramUsername,
  normalizeInstagramUrl
} from '@giveaway/meta-model/instagram';
import {
  facebookProfileUrlSchema,
  extractFacebookIdentifier,
  normalizeFacebookUrl
} from '@giveaway/meta-model/facebook';

const login = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      redirectTo: z.string().optional(),
      provider: z.nativeEnum(IdentityProvider).optional(),
      email: z.string().optional(),
      blueskyHandle: z.string().optional(),
      instagramProfileUrl: z.string().optional(),
      facebookProfileUrl: z.string().optional(),
      revalidate: z.string().optional(),
      returnTo: z.string()
    })
  )
  .handler(async ({ db, user, input }) => {
    const {
      returnTo,
      redirectTo,
      provider,
      blueskyHandle,
      instagramProfileUrl,
      facebookProfileUrl,
      revalidate
    } = input;
    const email = toLoginEmail(provider, input.email);
    // Build query parameters for other providers
    const queryParams = new URLSearchParams();
    if (redirectTo) queryParams.append('redirectTo', redirectTo);
    if (email) queryParams.append('email', email);
    if (revalidate) queryParams.append('revalidate', revalidate);
    if (provider)
      queryParams.append(
        'provider',
        IDENTITY_PROVIDER_TO_AUTH_PROVIDER[provider]
      );

    // Redirect to auth portal which will handle profile creation and final redirect
    const options = { redirectTo: `/portal?${queryParams.toString()}` };

    try {
      console.info(
        'Initiating sign-in with provider:',
        provider,
        'and email:',
        email
      );
      await signInHandler({
        db,
        userId: user?.id ?? undefined,
        provider,
        email,
        options,
        blueskyHandle,
        instagramProfileUrl,
        facebookProfileUrl,
        returnTo
      });
    } catch (error) {
      if (error instanceof AuthError && 'type' in error) {
        switch (error.type) {
          case 'CredentialsSignin':
            throw new ApplicationError({
              code: 'BAD_REQUEST',
              message: 'Invalid credentials. Please try again.'
            });
          default:
            throw new ApplicationError({
              code: 'INTERNAL_SERVER_ERROR',
              message: error.message || 'Sign in failed. Please try again.'
            });
        }
      }

      throw error;
    }
  });

export default login;

const toLoginEmail = (
  provider: IdentityProvider | undefined,
  email: string | undefined
) => {
  if (provider !== IdentityProvider.EMAIL) return email;

  const parsed = loginEmailSchema.safeParse(email);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: INVALID_LOGIN_EMAIL_MESSAGE
    });
  }
  return parsed.data;
};

type MetaProfile = {
  provider: 'instagram' | 'facebook';
  name: string;
  providerAccountId: string;
  label: string;
  link: string;
};

const alreadyLinked = (name: string) =>
  new ApplicationError({
    code: 'CONFLICT',
    message: `This ${name} profile is already linked to another account.`
  });

const linkMetaProfile = async (
  db: PrismaClient,
  userId: string | undefined,
  profile: MetaProfile
) => {
  const { provider, name, providerAccountId, label, link } = profile;

  if (!userId) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: `Sign in to connect your ${name} profile.`
    });
  }

  const existing = await db.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } }
  });

  if (existing && existing.userId !== userId) {
    throw alreadyLinked(name);
  }

  if (existing) {
    await db.account.update({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      data: { label, link, updatedAt: new Date() }
    });
    return;
  }

  try {
    await db.account.create({
      data: {
        userId,
        provider,
        providerAccountId,
        type: 'oauth',
        label,
        link,
        scope: ''
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw alreadyLinked(name);
    }
    throw error;
  }

  console.info(`${name} profile linked to user`, {
    userId,
    providerAccountId
  });
};

const signInHandler = async (args: {
  db: PrismaClient;
  userId: string | undefined;
  provider: string | undefined;
  email: string | undefined;
  options: Record<string, string>;
  blueskyHandle: string | undefined;
  instagramProfileUrl: string | undefined;
  facebookProfileUrl: string | undefined;
  returnTo: string | undefined;
}) => {
  const {
    db,
    userId,
    provider: rawProvider,
    email,
    options,
    blueskyHandle,
    instagramProfileUrl,
    facebookProfileUrl,
    returnTo
  } = args;
  const provider = parseProvider(rawProvider);

  switch (provider) {
    case 'TWITTER':
    case 'GOOGLE':
    case 'DISCORD':
    case 'TWITCH':
    case 'STEAM':
    case 'KICK':
    case 'TIKTOK':
    case 'VELORA':
    case 'LINKEDIN':
      return await signIn(
        IDENTITY_PROVIDER_TO_AUTH_PROVIDER[provider],
        options
      );
    case 'EMAIL':
      return await signIn('email', {
        email,
        ...options
      });
    case 'ANONYMOUS':
      return await signIn('anonymous', options);
    case 'INSTAGRAM': {
      if (!instagramProfileUrl) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Instagram profile URL is required.'
        });
      }

      const validationResult =
        instagramProfileUrlSchema.safeParse(instagramProfileUrl);
      if (!validationResult.success) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          message:
            validationResult.error.errors[0]?.message ||
            'Invalid Instagram profile URL format'
        });
      }

      const normalizedUrl = normalizeInstagramUrl(validationResult.data);
      const username = extractInstagramUsername(validationResult.data);

      await linkMetaProfile(db, userId, {
        provider: 'instagram',
        name: 'Instagram',
        providerAccountId: username,
        label: `@${username}`,
        link: normalizedUrl
      });
      redirect(options.redirectTo);
    }
    case 'FACEBOOK': {
      if (!facebookProfileUrl) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Facebook profile URL is required.'
        });
      }

      const validationResult =
        facebookProfileUrlSchema.safeParse(facebookProfileUrl);
      if (!validationResult.success) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          message:
            validationResult.error.errors[0]?.message ||
            'Invalid Facebook profile URL format'
        });
      }

      const normalizedUrl = normalizeFacebookUrl(validationResult.data);
      const identifier = extractFacebookIdentifier(validationResult.data);

      await linkMetaProfile(db, userId, {
        provider: 'facebook',
        name: 'Facebook',
        providerAccountId: identifier,
        label: /^\d+$/.test(identifier)
          ? `ID: ${identifier}`
          : `@${identifier}`,
        link: normalizedUrl
      });
      redirect(options.redirectTo);
    }
    case 'BLUESKY': {
      if (!blueskyHandle) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Bluesky handle is required.'
        });
      }

      // Validate Bluesky handle format
      const validationResult = blueskyHandleSchema.safeParse(blueskyHandle);
      if (!validationResult.success) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          message:
            validationResult.error.errors[0]?.message ||
            'Invalid Bluesky handle format'
        });
      }

      const params = new URLSearchParams();
      params.append('handle', validationResult.data);
      if (returnTo) params.append('returnTo', returnTo);
      if (options.redirectTo) params.append('redirectTo', options.redirectTo);

      const blueskyUrl = `/api/bluesky/user/authorize?${params.toString()}`;
      redirect(blueskyUrl);
    }
    case 'YOUTUBE':
      throw new ApplicationError({
        code: 'NOT_IMPLEMENTED',
        message: 'YouTube login is not yet implemented.'
      });
    default:
      throw assertNever(provider);
  }
};
