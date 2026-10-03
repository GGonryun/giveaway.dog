import { NextRequest } from 'next/server';
import prisma from '@giveaway/db-client/prisma';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const profileUrl = searchParams.get('profileUrl');
  const identifier = searchParams.get('identifier');
  const redirectTo = searchParams.get('redirectTo') || '/account';

  console.info('Facebook link request started', {
    identifier,
    redirectTo
  });

  if (!profileUrl || !identifier) {
    console.warn('Facebook link failed - missing parameters', {
      hasProfileUrl: !!profileUrl,
      hasIdentifier: !!identifier
    });

    const errorUrl = new URL(redirectTo, req.url);
    errorUrl.searchParams.set('error', 'facebook_link_failed');
    redirect(errorUrl.toString());
  }

  const currentSession = await auth();

  if (!currentSession?.user?.id) {
    console.warn('Facebook link failed - not authenticated');

    const errorUrl = new URL(redirectTo, req.url);
    errorUrl.searchParams.set('error', 'Authentication required');
    redirect(errorUrl.toString());
  }

  const userId = currentSession.user.id;

  const existingAccountForUser = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'facebook',
      providerAccountId: identifier
    }
  });

  if (existingAccountForUser) {
    console.info('Facebook account re-linked - updating existing account', {
      userId,
      identifier
    });

    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'facebook',
          providerAccountId: identifier
        }
      },
      data: {
        label: /^\d+$/.test(identifier)
          ? `ID: ${identifier}`
          : `@${identifier}`,
        link: profileUrl,
        updatedAt: new Date()
      }
    });

    redirect(redirectTo);
  }

  console.info('Facebook account linked to user', {
    userId,
    identifier
  });

  await prisma.account.create({
    data: {
      userId,
      provider: 'facebook',
      providerAccountId: identifier,
      type: 'oauth',
      label: /^\d+$/.test(identifier) ? `ID: ${identifier}` : `@${identifier}`,
      link: profileUrl,
      scope: ''
    }
  });

  redirect(redirectTo);
}
