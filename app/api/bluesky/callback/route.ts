import { NextRequest } from 'next/server';
import { getBlueskyClient } from '@/lib/auth/bluesky-client';
import prisma from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Agent } from '@atproto/api';
import { REQUIRED_BLUESKY_SCOPES } from '@/lib/integrations/scopes';
import { getUserAuthRedirect } from '@/lib/redirect';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const client = await getBlueskyClient();

  // Retrieve redirectTo from cookie
  const redirectTo = req.cookies.get('bluesky_redirect')?.value || '';

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

  if (existingAccount) {
    // Account exists and is linked to a real user
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

  // Use NextAuth's signIn to create a proper session
  // This will throw NEXT_REDIRECT which Next.js handles automatically
  const { signIn } = await import('@/lib/auth/config');

  const finalRedirect = getUserAuthRedirect({ redirectTo });

  // Note: signIn throws a NEXT_REDIRECT, so the cookie cleanup won't execute
  // The cookie will expire naturally after 10 minutes
  await signIn('bluesky-direct', {
    userId,
    redirectTo: finalRedirect
  });
}
