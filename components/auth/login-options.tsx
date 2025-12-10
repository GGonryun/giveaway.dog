'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import {
  ProviderBadges,
  ProviderButtons,
  ProviderIcons
} from '@/components/auth/provider-buttons';
import { AuthError } from '@/components/auth/auth-error';
import { AlertCircle, ArrowLeftIcon } from 'lucide-react';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { Typography } from '../ui/typography';
import { Flex } from '../ui/flex';
import login from '@/lib/auth/procedures/login';
import { Alert, AlertDescription } from '../ui/alert';
import { toAuthErrorDescription } from '@/lib/auth/util';
import { useSearchParams } from 'next/navigation';
import { IdentityProvider } from '@prisma/client';
import { assertNever } from '@/lib/errors';
import { Separator } from '../ui/separator';

type LoginButtonType = 'buttons' | 'icons' | 'badges';
interface LoginOptionsProps {
  className?: string;
  redirectTo?: string;
  label?: string;
  dividers?: boolean;
  type?: LoginButtonType;
  allowedIdentities: IdentityProvider[];
}

export function LoginOptions({
  className,
  redirectTo = '',
  type,
  label,
  dividers = false,
  allowedIdentities,
  ...props
}: LoginOptionsProps & React.ComponentProps<'div'>) {
  const searchParams = useSearchParams();

  const error = searchParams.get('error');

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
      provider: 'EMAIL',
      email,
      redirectTo
    });
  };

  const handleCancelEmail = () => {
    setShowEmailForm(false);
    setErrorMessage(null);
    setEmail('');
  };

  const handleProviderLogin = (provider: IdentityProvider) => {
    if (provider === 'EMAIL') {
      setShowEmailForm(true);
      setErrorMessage(null);
    } else {
      loginProcedure.run({
        provider,
        redirectTo
      });
    }
  };

  if (loginProcedure.isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
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
    <div className="w-full">
      <Alert className={cn('mb-4', !error && 'hidden')} variant="destructive">
        <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground" />
        <AlertDescription className="text-sm">
          {toAuthErrorDescription(error)}
        </AlertDescription>
      </Alert>
      <Flex.Stack center gap="sm" className={cn(className)} {...props}>
        {label && (
          <div
            className={cn(
              'w-full items-center',
              dividers && 'grid grid-cols-5'
            )}
          >
            {dividers && <Separator className="col-span-2" />}
            <Typography.Header
              level={5}
              className="mb-1 text-center col-span-1"
            >
              {label}
            </Typography.Header>
            {dividers && <Separator className="col-span-2" />}
          </div>
        )}
        <Providers
          onSubmit={handleProviderLogin}
          identities={allowedIdentities}
          type={type}
        />
        <AuthError error={errorMessage} />
      </Flex.Stack>
    </div>
  );
}

const Providers: React.FC<{
  identities: IdentityProvider[];
  onSubmit: (provider: IdentityProvider) => void;
  type?: LoginButtonType;
}> = ({ identities, onSubmit, type = 'buttons' }) => {
  switch (type) {
    case 'buttons':
      return <ProviderButtons identities={identities} onSubmit={onSubmit} />;
    case 'icons':
      return <ProviderIcons identities={identities} onSubmit={onSubmit} />;
    case 'badges':
      return <ProviderBadges identities={identities} onSubmit={onSubmit} />;
    default:
      throw assertNever(type);
  }
};
