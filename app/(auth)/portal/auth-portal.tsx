'use client';

import { useEffect, useState } from 'react';
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
import { updateUserProfile } from './actions';

export function AuthPortal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = searchParams.get('signup') === 'true';
  const name = searchParams.get('name');
  const userType = searchParams.get('userType');

  // Determine final redirect URL based on userType
  const getFinalRedirect = () => {
    if (userType === 'host') return '/app';
    if (userType === 'participate') return '/browse';
    return '/app'; // default fallback
  };

  useEffect(() => {
    const processAuth = async () => {
      // Wait for session to load
      if (status === 'loading') return;

      // If not authenticated, redirect to login
      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }

      // If this is a signup with name to update
      if (isSignup && session?.user?.id && name) {
        setIsUpdating(true);
        try {
          const result = await updateUserProfile({
            userId: session.user.id,
            name: name
          });

          if (result.error) {
            setError(result.error);
            return;
          }

          // Success - redirect to final destination
          router.push(getFinalRedirect());
        } catch (error) {
          setError('Failed to update profile. Please try again.');
          console.error('Profile update error:', error);
        } finally {
          setIsUpdating(false);
        }
      } else {
        // No profile update needed, redirect immediately
        router.push(getFinalRedirect());
      }
    };

    processAuth();
  }, [session, status, isSignup, name, userType, router]);

  if (status === 'loading' || isUpdating) {
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

  return null; // Should not reach here due to redirects
}
