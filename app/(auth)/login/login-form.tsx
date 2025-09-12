'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProviderButtons } from '@/components/auth/provider-buttons';
import { AuthError } from '@/components/auth/auth-error';
import { AuthFooter } from '@/components/auth/auth-footer';
import Link from 'next/link';
import login from '@/procedures/auth/login';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const verify = searchParams.get('verify');
  const redirectTo = searchParams.get('redirectTo') ?? '/';
  const [errorMessage, formAction, isPending] = useActionState(
    login,
    undefined
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-xl">Connect with us</CardTitle>
          <CardDescription>
            Login or sign up with your social account
          </CardDescription>
        </CardHeader>
        {isPending ? (
          <Spinner size="xl" className="mx-auto my-16" />
        ) : (
          <CardContent>
            {verify ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Check your email!</AlertTitle>
                <AlertDescription>
                  A verification email has been sent to your email address.
                </AlertDescription>
              </Alert>
            ) : (
              <form action={formAction}>
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <div className="grid gap-6">
                  <ProviderButtons mode="login" />
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="player@giveaway.dog"
                        required
                      />
                      <p className="text-xs text-muted-foreground -mt-1">
                        We'll email you a link to sign in. No password needed.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      name="provider"
                      value="email"
                      className="w-full"
                    >
                      Login with Email
                    </Button>
                  </div>
                </div>
              </form>
            )}
            <AuthError error={errorMessage || error} />
            <div className="text-center pt-4 border-t mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <AuthFooter />
    </div>
  );
}
