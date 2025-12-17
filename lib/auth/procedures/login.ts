'use server';

import { ApplicationError, assertNever } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { parseProvider, blueskyHandleSchema } from '@/schemas/user';
import { AuthError } from 'next-auth';
import z from 'zod';
import { signIn } from '../config';
import { IdentityProvider } from '@prisma/client';
import { IDENTITY_PROVIDER_TO_AUTH_PROVIDER } from '@/lib/integrations/schemas/providers';
import { redirect } from 'next/navigation';

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
      revalidate: z.string().optional()
    })
  )
  .handler(
    async ({
      input: { redirectTo, provider, email, blueskyHandle, revalidate }
    }) => {
      // Special handling for Bluesky - redirect directly to OAuth flow
      if (provider === 'BLUESKY') {
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
        if (redirectTo) params.append('redirectTo', redirectTo);

        const blueskyUrl = `/api/bluesky/authorize?${params.toString()}`;
        redirect(blueskyUrl);
      }

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
        await signInHandler({ provider, email, options });
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
    }
  );

export default login;

const signInHandler = async (args: {
  provider: string | undefined;
  email: string | undefined;
  options: Record<string, string>;
}) => {
  const { provider: rawProvider, email, options } = args;
  const provider = parseProvider(rawProvider);

  switch (provider) {
    case 'TWITTER':
    case 'GOOGLE':
    case 'DISCORD':
    case 'TWITCH':
    case 'STEAM':
    case 'KICK':
    case 'INSTAGRAM':
    case 'FACEBOOK':
    case 'TIKTOK':
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
    case 'BLUESKY':
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Bluesky login should be handled via OAuth flow.'
      });
    case 'YOUTUBE':
      throw new ApplicationError({
        code: 'NOT_IMPLEMENTED',
        message: 'YouTube login is not yet implemented.'
      });
    default:
      throw assertNever(provider);
  }
};
