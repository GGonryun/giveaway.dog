'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import {
  ProviderButtons,
  ProviderIcons
} from '@/components/auth/provider-buttons';
import { AuthError } from '@/components/auth/auth-error';
import { ArrowLeftIcon } from 'lucide-react';
import login from '@/procedures/auth/login';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { Typography } from '../ui/typography';
import { Flex } from '../ui/flex';

interface LoginOptionsProps {
  className?: string;
  redirectTo?: string;
  label?: string;
  icons?: boolean;
}

export function LoginOptions({
  className,
  redirectTo = '',
  icons,
  label,
  ...props
}: LoginOptionsProps & React.ComponentProps<'div'>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const loginProcedure = useProcedure({
    action: login,
    onSuccess() {
      toast.success('Successfully logged in! Redirecting...');
    },
    onFailure(error) {
      setErrorMessage(error.message);
    }
  });

  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailSubmit = () => {
    if (!email) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    loginProcedure.run({
      provider: 'email',
      email,
      redirectTo
    });
  };

  const handleCancelEmail = () => {
    setShowEmailForm(false);
    setErrorMessage(null);
    setEmail('');
  };

  const handleProviderLogin = (provider: string) => {
    if (provider === 'email') {
      setShowEmailForm(true);
      setErrorMessage(null);
    } else {
      loginProcedure.run({
        provider,
        redirectTo
      });
    }
  };

  const Providers = icons ? ProviderIcons : ProviderButtons;

  if (loginProcedure.isLoading) {
    return (
      <div className={cn('flex justify-center', className)} {...props}>
        <Spinner size="xl" />
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className={cn('', className)} {...props}>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="player@giveaway.dog"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground -mt-1">
              We'll email you a link to sign in. No password needed.
            </p>
          </div>

          <div className="grid gap-2">
            <Button
              name="provider"
              value="email"
              className="w-full"
              onClick={handleEmailSubmit}
            >
              Send Login Link
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEmail}
              className="w-full"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
        <AuthError error={errorMessage} />
      </div>
    );
  }

  return (
    <Flex.Stack center gap="sm" className={cn(className)} {...props}>
      {label && <Typography.Header level={5}>{label}</Typography.Header>}
      <Providers onSubmit={handleProviderLogin} />
      <AuthError error={errorMessage} />
    </Flex.Stack>
  );
}
