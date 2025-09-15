import { Suspense } from 'react';
import { AuthPortal } from './auth-portal';
import { redirect } from 'next/navigation';
import { parseUserTypes } from './util';
import { getUserAuthRedirect } from '@/lib/redirect';

export const dynamic = 'force-dynamic';

const PortalPage: React.FC<{
  searchParams: Promise<{
    signup: string;
    name: string;
    emoji: string;
    userType: string;
    redirectTo: string;
    token: string;
    email: string;
    revalidate: string;
  }>;
}> = async ({ searchParams }) => {
  const {
    signup,
    name,
    emoji,
    userType,
    redirectTo,
    token,
    email,
    revalidate
  } = await searchParams;

  const userTypes = parseUserTypes(userType);

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

  if (!signup && !revalidate) {
    redirect(getUserAuthRedirect({ redirectTo, userTypes }));
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
            userTypes={userTypes}
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
