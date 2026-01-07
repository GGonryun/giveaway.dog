'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import {
  ProviderDots,
  ProviderButtons,
  ProviderIcons,
  ProviderPills
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
import { BlueskyConnectForm } from '@/lib/auth/components/bluesky-connect-form';
import { InstagramConnectForm } from '@/lib/auth/components/instagram-connect-form';
import { FacebookConnectForm } from '@/lib/auth/components/facebook-connect-form';

type LoginButtonType = 'pill' | 'buttons' | 'icons' | 'dots';
interface LoginOptionsProps {
  className?: string;
  redirectTo?: string;
  label?: string;
  dividers?: boolean;
  type?: LoginButtonType;
  allowedIdentities: IdentityProvider[];
  returnTo: string;
}

export function LoginOptions({
  className,
  redirectTo = '',
  returnTo,
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

  useEffect(() => {
    if (error) {
      setErrorMessage(toAuthErrorDescription(error));
    }
  }, [error]);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showBlueskyForm, setShowBlueskyForm] = useState(false);
  const [showInstagramForm, setShowInstagramForm] = useState(false);
  const [showFacebookForm, setShowFacebookForm] = useState(false);

  const handleEmailSubmit = () => {
    if (!email) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    loginProcedure.run({
      provider: 'EMAIL',
      email,
      redirectTo,
      returnTo
    });
  };

  const handleCancelEmail = () => {
    setShowEmailForm(false);
    setErrorMessage(null);
    setEmail('');
  };

  const handleConnectBluesky = () => {
    setShowBlueskyForm(false);
    setErrorMessage(null);
  };

  const handleCancelBluesky = () => {
    setShowBlueskyForm(false);
    setErrorMessage(null);
  };

  const handleConnectInstagram = () => {
    setShowInstagramForm(false);
    setErrorMessage(null);
  };

  const handleCancelInstagram = () => {
    setShowInstagramForm(false);
    setErrorMessage(null);
  };

  const handleConnectFacebook = () => {
    setShowFacebookForm(false);
    setErrorMessage(null);
  };

  const handleCancelFacebook = () => {
    setShowFacebookForm(false);
    setErrorMessage(null);
  };

  const handleProviderLogin = (provider: IdentityProvider) => {
    if (provider === 'EMAIL') {
      setShowEmailForm(true);
      setErrorMessage(null);
    } else if (provider === 'BLUESKY') {
      setShowBlueskyForm(true);
      setErrorMessage(null);
    } else if (provider === 'INSTAGRAM') {
      setShowInstagramForm(true);
      setErrorMessage(null);
    } else if (provider === 'FACEBOOK') {
      setShowFacebookForm(true);
      setErrorMessage(null);
    } else {
      loginProcedure.run({
        provider,
        redirectTo,
        returnTo
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

  if (showBlueskyForm) {
    return (
      <div className={cn('', className)} {...props}>
        <BlueskyConnectForm
          returnTo={returnTo}
          redirectTo={redirectTo}
          onConnect={handleConnectBluesky}
          onCancel={handleCancelBluesky}
        />
        <AuthError error={errorMessage} />
      </div>
    );
  }

  if (showInstagramForm) {
    return (
      <div className={cn('', className)} {...props}>
        <InstagramConnectForm
          returnTo={returnTo}
          redirectTo={redirectTo}
          onConnect={handleConnectInstagram}
          onCancel={handleCancelInstagram}
        />
        <AuthError error={errorMessage} />
      </div>
    );
  }

  if (showFacebookForm) {
    return (
      <div className={cn('', className)} {...props}>
        <FacebookConnectForm
          returnTo={returnTo}
          redirectTo={redirectTo}
          onConnect={handleConnectFacebook}
          onCancel={handleCancelFacebook}
        />
        <AuthError error={errorMessage} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Alert
        className={cn('mb-4', !errorMessage && 'hidden')}
        variant="destructive"
      >
        <AlertCircle />
        <AlertDescription>{errorMessage}</AlertDescription>
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
    case 'dots':
      return <ProviderDots identities={identities} onSubmit={onSubmit} />;
    case 'pill':
      return <ProviderPills identities={identities} onSubmit={onSubmit} />;
    default:
      throw assertNever(type);
  }
};
