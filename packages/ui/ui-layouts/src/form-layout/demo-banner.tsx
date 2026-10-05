'use client';

import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import { useUnifiedFormLayout } from './use-unified-form-layout';

export const DemoBanner: React.FC = () => {
  const { type, action, banner } = useUnifiedFormLayout();

  if (banner) {
    return (
      <Alert className="border-primary bg-primary/10 rounded-none border-x-0 py-2">
        <AlertDescription className="flex items-center justify-between text-primary text-sm gap-2">
          <div className="min-w-0">
            <strong>{banner.title}</strong>{' '}
            <span className="hidden sm:inline">{banner.fullMessage}</span>
            <span className="sm:hidden">{banner.shortMessage}</span>
          </div>
          {banner.showAction && banner.actionHref && banner.actionText && (
            <Link href={banner.actionHref} className="shrink-0">
              <Button size="sm" className="h-8 text-xs px-3">
                {banner.actionText}
              </Button>
            </Link>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (action !== 'demo') {
    return null;
  }

  return (
    <Alert className="border-primary bg-primary/10 rounded-none border-x-0 py-2">
      <AlertDescription className="flex items-center justify-between text-primary text-sm gap-2">
        <div className="min-w-0">
          <strong>Demo Mode</strong>{' '}
          <span className="hidden sm:inline">
            - You're exploring {type} the editor in evaluation mode.
          </span>
          <span className="sm:hidden"> - Sign up to save!</span>
        </div>
        <Link href="/login" className="shrink-0">
          <Button size="sm" className="h-8 text-xs px-3">
            <span className="hidden sm:inline">Create Free Account</span>
            <span className="sm:hidden">Sign Up</span>
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};
