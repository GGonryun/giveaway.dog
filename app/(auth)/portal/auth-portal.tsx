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
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import { UserType } from '@prisma/client';
import { useAccountPage } from '@/components/account/use-account-page';
import { getUserAuthRedirect } from '@/lib/redirect';

export const AuthPortal: React.FC<{
  signup: string;
  name: string;
  emoji: string;
  userTypes: UserType[];
  redirectTo: string;
}> = ({ signup, name, emoji, userTypes, redirectTo }) => {
  const { navigateToAccountOverview } = useAccountPage();
  const router = useRouter();

  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const redirect = useMemo(
    () => getUserAuthRedirect({ redirectTo, userTypes }),
    [redirectTo, userTypes]
  );

  const { isLoading, isPending, run } = useProcedure({
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
    if (isLoading) return;

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

    // If not signing up, redirect to final destination
    if (!signup) {
      router.push(redirect);
      return;
    }

    // Run the profile creation procedure
    run({
      id: session.user.id,
      name,
      emoji,
      age: null,
      region: null,
      type: userTypes
    });
  }, [session, status, isLoading, signup, name, emoji, userTypes, router]);

  if (error) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">Setup Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-primary hover:underline"
          >
            Try signing in again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'loading' || isLoading || isPending) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>
            {signup ? 'Setting up your account...' : 'Signing you in...'}
          </CardTitle>
          <CardDescription>We're getting things ready for you.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner size="xl" />
        </CardContent>
      </Card>
    );
  }

  return null; // Should not reach here due to redirects
};
