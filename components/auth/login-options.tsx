'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { ProviderButtons } from '@/components/auth/provider-buttons';
import { AuthError } from '@/components/auth/auth-error';
import { MailIcon, ArrowLeftIcon } from 'lucide-react';
import login from '@/procedures/auth/login';

interface LoginOptionsProps {
  className?: string;
  redirectTo?: string;
}

export function LoginOptions({
  className,
  redirectTo = '',
  ...props
}: LoginOptionsProps & React.ComponentProps<'div'>) {
  const [errorMessage, formAction, isPending] = useActionState(
    login,
    undefined
  );
  const [showEmailForm, setShowEmailForm] = useState(false);

  if (isPending) {
    return (
      <div className={cn('flex justify-center', className)} {...props}>
        <Spinner size="xl" className="my-8" />
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className={cn('', className)} {...props}>
        <form action={formAction}>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                type="email"
                placeholder="player@giveaway.dog"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground -mt-1">
                We'll email you a link to sign in. No password needed.
              </p>
            </div>

            <div className="grid gap-2">
              <Button
                type="submit"
                name="provider"
                value="email"
                className="w-full"
              >
                Send Login Link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmailForm(false)}
                className="w-full"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </form>
        <AuthError error={errorMessage} />
      </div>
    );
  }

  return (
    <div className={cn('', className)} {...props}>
      <form action={formAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="grid gap-3">
          <ProviderButtons mode="login" />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEmailForm(true)}
            className="w-full justify-start"
          >
            <MailIcon className="mr-2 h-4 w-4" />
            Login with Email
          </Button>
        </div>
      </form>
      <AuthError error={errorMessage} />
    </div>
  );
}