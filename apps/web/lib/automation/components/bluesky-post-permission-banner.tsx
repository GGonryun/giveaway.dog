import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';

interface BlueskyPostPermissionBannerProps {
  hasBlueskyIntegration: boolean;
  hasPostingPermission: boolean;
  slug: string;
}

export function BlueskyPostPermissionBanner({
  hasBlueskyIntegration,
  hasPostingPermission,
  slug
}: BlueskyPostPermissionBannerProps) {
  if (hasBlueskyIntegration && hasPostingPermission) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        <p>
          {!hasBlueskyIntegration
            ? 'Connect Bluesky to schedule automated posts'
            : 'Your Bluesky integration needs posting permissions'}
        </p>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={`/app/${slug}/settings/integrations`}>
            <SocialBlueskyIcon className="h-4 w-4 mr-2" />
            {!hasBlueskyIntegration ? 'Connect Bluesky' : 'Add Permissions'}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
