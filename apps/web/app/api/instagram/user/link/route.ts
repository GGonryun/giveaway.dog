import { NextRequest } from 'next/server';
import prisma from '@giveaway/db-client/prisma';
import { auth } from '@giveaway/auth-server/config';
import { redirect } from 'next/navigation';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const profileUrl = searchParams.get('profileUrl');
  const username = searchParams.get('username');
  const redirectTo = searchParams.get('redirectTo') || '/account';

  console.info('Instagram link request started', {
    username,
    redirectTo
  });

  if (!profileUrl || !username) {
    console.warn('Instagram link failed - missing parameters', {
      hasProfileUrl: !!profileUrl,
      hasUsername: !!username
    });

    const errorUrl = new URL(redirectTo, req.url);
    errorUrl.searchParams.set('error', 'instagram_link_failed');
    redirect(errorUrl.toString());
  }

  const currentSession = await auth();

  if (!currentSession?.user?.id) {
    console.warn('Instagram link failed - not authenticated');

    const errorUrl = new URL(redirectTo, req.url);
    errorUrl.searchParams.set('error', 'Authentication required');
    redirect(errorUrl.toString());
  }

  const userId = currentSession.user.id;

  const existingAccountForUser = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'instagram',
      providerAccountId: username
    }
  });

  if (existingAccountForUser) {
    console.info('Instagram account re-linked - updating existing account', {
      userId,
      username
    });

    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'instagram',
          providerAccountId: username
        }
      },
      data: {
        label: `@${username}`,
        link: profileUrl,
        updatedAt: new Date()
      }
    });

    redirect(redirectTo);
  }

  console.info('Instagram account linked to user', {
    userId,
    username
  });

  await prisma.account.create({
    data: {
      userId,
      provider: 'instagram',
      providerAccountId: username,
      type: 'oauth',
      label: `@${username}`,
      link: profileUrl,
      scope: ''
    }
  });

  redirect(redirectTo);
}
