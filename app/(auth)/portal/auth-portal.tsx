'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { UserType } from '@prisma/client';
import { useAccountPage } from '@/components/account/use-account-page';
import { getUserAuthRedirect } from '@/lib/redirect';
import { CheckCircle } from 'lucide-react';
import invalidateUser from '@/procedures/user/invalidate-user';

interface AuthPortalProps {
  // Email verification props
  token?: string;
  email?: string;

  // Signup props
  signup?: string;
  name?: string;
  emoji?: string;
  countryCode?: string;
  userTypes?: UserType[];

  // Common props
  redirectTo?: string;
  revalidate?: string;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  token,
  email,
  signup,
  name,
  emoji,
  countryCode,
  userTypes,
  redirectTo,
  revalidate
}) => {
  const { navigateToAccountOverview } = useAccountPage();
  const router = useRouter();

  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const redirect = useMemo(
    () =>
      getUserAuthRedirect({
        redirectTo: redirectTo || '',
        userTypes: userTypes || []
      }),
    [redirectTo, userTypes]
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

  const { isLoading: isRevalidating, run: runRevalidation } = useProcedure({
    action: invalidateUser,
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
    if (isCreating || isVerifying || isRevalidating) return;
    // Wait for session to load
    if (status === 'loading') return;
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

    if (revalidate) {
      runRevalidation();
      return;
    }

    // Handle email verification flow
    if (token && email) {
      runVerification({ token, email });
      return;
    }

    // If not signing up, redirect to final destination
    if (!signup) {
      router.push(redirect);
      return;
    }

    // Run the profile creation procedure
    runCreate({
      id: session.user.id,
      name: name || '',
      emoji: emoji || '',
      age: null,
      countryCode: countryCode || '',
      type: userTypes || []
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
    userTypes,
    router,
    token,
    email,
    revalidate,
    isRevalidating,
    runVerification
  ]);

  if (revalidate) {
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
