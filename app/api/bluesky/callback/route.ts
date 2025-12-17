import { NextRequest } from 'next/server';
import { getBlueskyClient } from '@/lib/auth/bluesky-client';
import prisma from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Agent } from '@atproto/api';
import { REQUIRED_BLUESKY_SCOPES } from '@/lib/integrations/scopes';
import { getUserAuthRedirect } from '@/lib/redirect';
import { auth } from '@/lib/auth/config';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const client = await getBlueskyClient();

  // Retrieve redirectTo from cookie
  const redirectTo = req.cookies.get('bluesky_redirect')?.value || '';

  // Check if user is already authenticated (account linking scenario)
  const currentSession = await auth();

  // Process the OAuth callback
  // This validates the code, exchanges it for tokens, and stores the session
  const { session } = await client.callback(searchParams);

  // Create an Agent to fetch the user's profile
  const agent = new Agent(session);
  const profileResponse = await agent.getProfile({ actor: session.did });
  const profile = profileResponse.data;

  const handle = profile.handle;
  const displayName = profile.displayName || handle;
  const avatar = profile.avatar;

  // Check if this Bluesky account already exists
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'bluesky',
        providerAccountId: session.did
      }
    },
    include: { user: true }
  });

  let userId: string;
  let shouldSignIn = true;

  if (existingAccount) {
    // Account exists and is linked to a user
    // If user is trying to link but the account belongs to someone else, throw error
    if (currentSession?.user?.id && existingAccount.userId !== currentSession.user.id) {
      const { redirect } = await import('next/navigation');
      const errorUrl = new URL(redirectTo || '/account', req.url);
      errorUrl.searchParams.set('error', 'OAuthAccountAlreadyLinked');
      redirect(errorUrl.toString());
    }

    userId = existingAccount.userId;

    // Update the account with fresh session data
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'bluesky',
          providerAccountId: session.did
        }
      },
      data: {
        label: handle,
        link: `https://bsky.app/profile/${handle}`,
        scope: REQUIRED_BLUESKY_SCOPES.join(' '),
        session_state: JSON.stringify(session),
        updatedAt: new Date()
      }
    });
  } else if (currentSession?.user?.id) {
    // User is already logged in - link this Bluesky account to their existing account
    userId = currentSession.user.id;
    shouldSignIn = false;

    await prisma.account.create({
      data: {
        userId,
        type: 'oauth',
        provider: 'bluesky',
        providerAccountId: session.did,
        label: handle,
        link: `https://bsky.app/profile/${handle}`,
        scope: REQUIRED_BLUESKY_SCOPES.join(' '),
        session_state: JSON.stringify(session)
      }
    });
  } else {
    // Create new user and account
    const newUser = await prisma.user.create({
      data: {
        id: createId(),
        name: displayName,
        username: handle,
        image: avatar,
        source: 'SIGNUP',
        accounts: {
          create: {
            type: 'oauth',
            provider: 'bluesky',
            providerAccountId: session.did,
            label: handle,
            link: `https://bsky.app/profile/${handle}`,
            scope: REQUIRED_BLUESKY_SCOPES.join(' '),
            session_state: JSON.stringify(session)
          }
        }
      }
    });
    userId = newUser.id;
  }

  if (shouldSignIn) {
    // Use NextAuth's signIn to create a proper session for new users or existing account reconnect
    // This will throw NEXT_REDIRECT which Next.js handles automatically
    const { signIn } = await import('@/lib/auth/config');

    const finalRedirect = getUserAuthRedirect({ redirectTo });

    // Note: signIn throws a NEXT_REDIRECT, so the cookie cleanup won't execute
    // The cookie will expire naturally after 10 minutes
    await signIn('bluesky-direct', {
      userId,
      redirectTo: finalRedirect
    });
  } else {
    // Account was linked to existing session - redirect back to the page they came from
    const { redirect } = await import('next/navigation');
    const finalRedirect = redirectTo || '/account';
    redirect(finalRedirect);
  }
}
