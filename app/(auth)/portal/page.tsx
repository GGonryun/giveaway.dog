import { Suspense } from 'react';
import { AuthPortal } from './auth-portal';
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
  }>;
}> = async ({ searchParams }) => {
  const { signup, name, emoji, redirectTo, token, email, revalidate } =
    await searchParams;

  // If token and email are provided, this is an email verification request
  if (token && email) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <AuthPortal token={token} email={email} redirectTo={redirectTo} />
          </Suspense>
        </div>
      </div>
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
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <AuthPortal
            name={name}
            emoji={emoji}
            redirectTo={redirectTo}
            signup={signup}
            revalidate={revalidate}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default PortalPage;
