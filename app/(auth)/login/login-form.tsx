'use client';

import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoginOptions } from '@/components/auth/login-options';
import { AuthFooter } from '@/components/auth/auth-footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

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
            Sign in with your account to access Giveaway Dog
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <LoginOptions redirectTo={redirectTo} />
        </CardContent>
      </Card>

      <AuthFooter />
    </div>
  );
}
