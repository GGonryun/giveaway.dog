'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import createProfile from '@/procedures/user/create-profile';
import verifyEmail from '@/procedures/user/verify-email';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import { useAccountPage } from '@/components/account/use-account-page';
import { getUserAuthRedirect } from '@/lib/redirect';
import { CheckCircle } from 'lucide-react';

interface AuthPortalProps {
  // Email verification props
  token?: string;
  email?: string;

  // Signup props
  signup?: string;
  name?: string;
  emoji?: string;

  // Common props
  redirectTo?: string;
  revalidate?: string;
  provider?: string;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  token,
  email,
  signup,
  name,
  emoji,
  redirectTo,
  revalidate,
  provider
}) => {
  const { navigateToAccountOverview } = useAccountPage();
  const router = useRouter();

  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const redirect = useMemo(
    () =>
      getUserAuthRedirect({
        redirectTo: redirectTo || ''
      }),
    [redirectTo]
  );

  // Email verification procedure
  const { isLoading: isVerifying, run: runVerification } = useProcedure({
    action: verifyEmail,
    onSuccess() {
      setVerificationSuccess(true);
      toast.success('Email verified successfully!');
      router.push(redirectTo || '/');
    },
    onFailure(error) {
      console.error('Email verification failed:', error);
      setError(error.message || 'Email verification failed');
      toast.error('Email verification failed');
    }
  });

  const {
    isLoading: isCreating,
    isPending,
    run: runCreate
  } = useProcedure({
    action: createProfile,
    onFailure(error) {
      if (error.code === 'CONFLICT') {
        toast.message('Redirecting to your existing profile...');
        navigateToAccountOverview();
      } else {
        setError(error.message);
        toast.error(error.message);
      }
    },
    onSuccess() {
      router.push(redirect);
    }
  });

  useEffect(() => {
    // If there's an existing error, don't proceed
    if (error) return;
    // If verification already succeeded, don't proceed
    if (verificationSuccess) return;
    // Handle signup flow
    if (isCreating || isVerifying) return;
    // Wait for session to load
    if (status === 'loading') return;
    if (provider === 'anonymous') {
      router.push(redirectTo || '/');
      return;
    }
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // If no session or user ID, show error
    if (!session?.user?.id) {
      setError('No session found. Please try logging in again.');
      return;
    }

    // Handle email verification flow
    if (token && email) {
      runVerification({ token, email });
      return;
    }

    if (revalidate) {
      router.push(redirect);
      return;
    }

    // Always try to create a profile for new users, or redirect if profile exists
    runCreate({
      name: name || session.user.name || ''
    });
  }, [
    session,
    status,
    isCreating,
    isVerifying,
    error,
    verificationSuccess,
    signup,
    name,
    emoji,
    router,
    token,
    email,
    revalidate,
    runVerification
  ]);

  if (revalidate) {
    return <RevalidateSessionCard />;
  }

  // Show email verification success
  if (verificationSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <CardTitle className="text-green-600">Email Verified!</CardTitle>
          <CardDescription>
            Your email has been successfully verified. Redirecting you now...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">
            {token && email ? 'Verification Error' : 'Setup Error'}
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <button
            onClick={() => router.push(redirectTo || '/login')}
            className="text-primary hover:underline"
          >
            {token && email ? 'Continue to site' : 'Try signing in again'}
          </button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'loading' || isCreating || isPending || isVerifying) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>
            {isVerifying
              ? 'Verifying your email...'
              : signup
                ? 'Setting up your account...'
                : 'Signing you in...'}
          </CardTitle>
          <CardDescription>
            {isVerifying
              ? 'Please wait while we verify your email address.'
              : "We're getting things ready for you."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner size="xl" />
        </CardContent>
      </Card>
    );
  }

  return null; // Should not reach here due to redirects
};

const RevalidateSessionCard = () => {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Revalidating Session</CardTitle>
        <CardDescription>
          Please wait while we revalidate your session. Redirecting you now...
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-4">
        <Spinner />
      </CardContent>
    </Card>
  );
};

export const PortalLayout: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <Spinner size="lg" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
};
