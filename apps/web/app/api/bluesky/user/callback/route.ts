import { NextRequest } from 'next/server';
import { getBlueskyClient } from '@giveaway/bluesky-api/bluesky/bluesky-client';
import prisma from '@giveaway/db-client/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Agent } from '@atproto/api';
import { REQUIRED_BLUESKY_SCOPES } from '@giveaway/integration-model/scopes';
import { getUserAuthRedirect } from '@giveaway/user-model/redirect';
import { auth, signIn } from '@giveaway/auth-server/config';
import { createBlueskyLoginToken } from '@giveaway/auth-server/bluesky-login-token';
import { redirect } from 'next/navigation';
import { UserSource } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const client = await getBlueskyClient();

  // Retrieve redirectTo from cookie
  const redirectTo = req.cookies.get('bluesky_redirect')?.value || '';

  // Check if user is already authenticated (account linking scenario)
  const currentSession = await auth();

  console.info('Bluesky OAuth callback started', {
    hasSession: !!currentSession?.user?.id,
    sessionUserId: currentSession?.user?.id,
    redirectTo
  });

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

  console.info('Bluesky profile fetched', {
    did: session.did,
    handle,
    displayName
  });

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

  if (existingAccount?.userId) {
    // Account exists and is already linked to a user
    // If user is trying to link but the account belongs to someone else, throw error
    if (
      currentSession?.user?.id &&
      existingAccount.userId !== currentSession.user.id
    ) {
      console.warn(
        'Bluesky account linking failed - account already linked to different user',
        {
          blueskyHandle: handle,
          blueskyDid: session.did,
          existingUserId: existingAccount.userId,
          attemptedLinkUserId: currentSession.user.id
        }
      );

      const errorUrl = new URL(redirectTo || '/account', req.url);
      errorUrl.searchParams.set('error', 'OAuthAccountAlreadyLinked');
      redirect(errorUrl.toString());
    }

    // Reconnecting existing account
    userId = existingAccount.userId;

    console.info('Bluesky account reconnected - updating existing account', {
      userId,
      handle,
      did: session.did
    });

    // Update the account with fresh profile data
    // Note: session_state was already saved by sessionStore during callback
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
        updatedAt: new Date()
      }
    });

    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        source: UserSource.SIGNUP
      }
    });
  } else if (currentSession?.user?.id) {
    // Account exists (created by sessionStore) but has no userId
    // User is logged in, so link the account to their existing user
    userId = currentSession.user.id;
    shouldSignIn = false;

    console.info('Bluesky account linked to existing user', {
      userId,
      handle,
      did: session.did
    });

    // Update the account that was created by sessionStore.upsert with the actual userId
    // Note: session_state was already saved by sessionStore during callback
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'bluesky',
          providerAccountId: session.did
        }
      },
      data: {
        userId,
        label: handle,
        link: `https://bsky.app/profile/${handle}`,
        scope: REQUIRED_BLUESKY_SCOPES.join(' ')
      }
    });
  } else {
    // Account exists (created by sessionStore) but has no userId
    // No current session, so create a new user and link the account
    const newUser = await prisma.user.create({
      data: {
        id: createId(),
        name: displayName,
        username: handle,
        image: avatar,
        source: UserSource.SIGNUP
      }
    });
    userId = newUser.id;

    // Update the account that was created by sessionStore.upsert with the actual userId
    // Note: session_state was already saved by sessionStore during callback
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'bluesky',
          providerAccountId: session.did
        }
      },
      data: {
        userId,
        label: handle,
        link: `https://bsky.app/profile/${handle}`,
        scope: REQUIRED_BLUESKY_SCOPES.join(' ')
      }
    });

    console.info('New Bluesky user created', {
      userId,
      handle,
      did: session.did,
      displayName
    });
  }

  if (shouldSignIn) {
    // Use NextAuth's signIn to create a proper session for new users or existing account reconnect
    // This will throw NEXT_REDIRECT which Next.js handles automatically

    const finalRedirect = getUserAuthRedirect({ redirectTo });

    console.info('Bluesky OAuth complete - signing in user', {
      userId,
      redirectTo: finalRedirect
    });

    const token = await createBlueskyLoginToken(userId);

    // Note: signIn throws a NEXT_REDIRECT, so the cookie cleanup won't execute
    // The cookie will expire naturally after 10 minutes
    await signIn('bluesky-direct', {
      token,
      redirectTo: finalRedirect
    });
  } else {
    // Account was linked to existing session - redirect back to the page they came from
    const finalRedirect = redirectTo || '/account';

    console.info('Bluesky account linking complete - redirecting', {
      userId,
      redirectTo: finalRedirect
    });

    redirect(finalRedirect);
  }
}
