'use client';

import { cn } from '@giveaway/ui-utils/utils';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2Icon } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { LoginOptions } from './login-options';
import { AuthFooter } from './auth-footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { LOGIN_PROVIDERS } from '@giveaway/integration-model/providers';

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
        <CardHeader className="text-center mb-2">
          <CardTitle className="text-xl">Connect with us</CardTitle>
          <CardDescription>
            Sign in with your account to access Giveaway Dog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginOptions
            type="buttons"
            returnTo={'/login'}
            redirectTo={redirectTo}
            allowedIdentities={LOGIN_PROVIDERS}
            maxVisible={5}
          />
        </CardContent>
      </Card>
      <AuthFooter />
    </div>
  );
}
