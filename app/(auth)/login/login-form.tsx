'use client';

import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoginOptions } from '@/components/auth/login-options';
import { AuthFooter } from '@/components/auth/auth-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const searchParams = useSearchParams();
  const verify = searchParams.get('verify');
  const redirectTo = searchParams.get('redirectTo') ?? '';

  if (verify) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <CheckCircle2Icon />
              <AlertTitle>Check your email!</AlertTitle>
              <AlertDescription>
                A verification email has been sent to your email address.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-xl">Connect with us</CardTitle>
          <CardDescription>
            Login or sign up with your social account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginOptions redirectTo={redirectTo} />
          <div className="text-center pt-4 border-t mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <AuthFooter />
    </div>
  );
}
