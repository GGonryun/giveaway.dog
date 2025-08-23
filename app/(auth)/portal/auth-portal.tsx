'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import updateProfile from '@/actions/user/update-profile';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import { UserType } from '@prisma/client';

const parseUserTypes = (userTypeParam: string | null): UserType[] => {
  if (!userTypeParam) return ['LEARN'];

  return userTypeParam
    .split(',')
    .map((type) => UserType[type as keyof typeof UserType]);
};

export const AuthPortal = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const { isLoading, isPending, run } = useProcedure({
    action: updateProfile,
    onFailure(error) {
      if (error.code === 'CONFLICT') {
        toast.message('Redirecting to your existing profile...');
        router.push('/user');
      } else {
        setError(error.message);
        toast.error(error.message);
      }
    },
    onSuccess() {
      router.push(getFinalRedirect);
    }
  });

  const isSignup = searchParams.get('signup') === 'true';
  const name = searchParams.get('name');
  const emoji = searchParams.get('emoji');
  const userTypeParam = searchParams.get('userType');
  const type = parseUserTypes(userTypeParam);

  // Determine final redirect URL based on userTypes
  const getFinalRedirect = useMemo(() => {
    // Prioritize hosting if selected (they can also browse and learn)
    if (type.includes('HOST')) return '/app';
    // If only participating, go to browse page
    if (type.includes('PARTICIPATE')) return '/browse';
    // If only learning or default, go to browse page to explore giveaways
    if (type.includes('LEARN')) return '/browse';
    return '/browse'; // default fallback for learning
  }, [type]);

  useEffect(() => {
    const processAuth = async () => {
      if (isLoading) return;
      // Wait for session to load
      if (status === 'loading') return;

      // If not authenticated, redirect to login
      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }

      // If this is a signup with name to update
      if (isSignup && session?.user?.id && name) {
        run({
          userId: session.user.id,
          name,
          emoji,
          type
        });
      } else {
        // No profile update needed, redirect immediately
        router.push(getFinalRedirect);
      }
    };

    processAuth();
  }, [session, status, isLoading, isSignup, name, emoji, type, router]);

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
          <CardTitle>Setting up your account...</CardTitle>
          <CardDescription>
            {isSignup ? 'Creating your profile' : 'Signing you in'}
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
