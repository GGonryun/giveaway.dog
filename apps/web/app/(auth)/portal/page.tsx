import { AuthPortal, PortalLayout } from './auth-portal';
import { redirect } from 'next/navigation';
import { getUserAuthRedirect } from '@giveaway/user-model/redirect';
import trackUser from '@/procedures/user/track-user';
import { Metadata } from 'next';
import { UserEventType } from '@prisma/client';
import { auth } from '@/lib/auth/config';

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

  // If token and email are provided, this is an email verification request
  if (token && email) {
    return (
      <PortalLayout>
        <AuthPortal token={token} email={email} redirectTo={redirectTo} />
      </PortalLayout>
    );
  }

  // Skip tracking for revalidation flows
  if (!revalidate) {
    try {
      await trackUser({
        type: UserEventType.LOGIN
      });
    } catch (error) {
      // Log the error but don't block the user from continuing
      console.warn('Failed to track user login:', error);
    }
  }

  if (!signup && !revalidate) {
    redirect(
      getUserAuthRedirect({
        redirectTo: redirectTo ?? '/'
      })
    );
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
