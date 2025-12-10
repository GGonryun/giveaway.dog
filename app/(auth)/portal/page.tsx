import { Suspense } from 'react';
import { AnonymousRedirectCard, AuthPortal, PortalLayout } from './auth-portal';
import { notFound, redirect } from 'next/navigation';
import { getUserAuthRedirect } from '@/lib/redirect';
import trackUser from '@/procedures/user/track-user';
import { Metadata } from 'next';
import { UserEventType } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Portal | Giveaway.dog',
  description: 'Complete your sign up',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

const PortalPage: React.FC<{
  searchParams: Promise<{
    signup: string;
    name: string;
    emoji: string;
    redirectTo: string;
    token: string;
    email: string;
    revalidate: string;
    provider: string;
  }>;
}> = async ({ searchParams }) => {
  const {
    signup,
    name,
    emoji,
    redirectTo,
    token,
    email,
    revalidate,
    provider
  } = await searchParams;

  if (provider === 'anonymous') {
    return <AnonymousRedirectCard redirectTo={redirectTo} />;
  }

  // If token and email are provided, this is an email verification request
  if (token && email) {
    return (
      <PortalLayout>
        <AuthPortal token={token} email={email} redirectTo={redirectTo} />
      </PortalLayout>
    );
  }

  const result = await trackUser({
    type: UserEventType.LOGIN
  });

  if (!result.ok) {
    notFound();
  }

  if (!signup && !revalidate) {
    redirect(getUserAuthRedirect({ redirectTo }));
  }

  return (
    <PortalLayout>
      <AuthPortal
        name={name}
        emoji={emoji}
        redirectTo={redirectTo}
        signup={signup}
        revalidate={revalidate}
        provider={provider}
      />
    </PortalLayout>
  );
};

export default PortalPage;
