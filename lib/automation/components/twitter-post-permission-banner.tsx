import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';

interface TwitterPostPermissionBannerProps {
  hasTwitterIntegration: boolean;
  hasPostingPermission: boolean;
  slug: string;
}

export function TwitterPostPermissionBanner({
  hasTwitterIntegration,
  hasPostingPermission,
  slug
}: TwitterPostPermissionBannerProps) {
  if (hasTwitterIntegration && hasPostingPermission) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        <p>
          {!hasTwitterIntegration
            ? 'Connect Twitter to schedule automated posts'
            : 'Your Twitter integration needs posting permissions'}
        </p>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={`/app/${slug}/settings/integrations`}>
            <SocialXIcon className="h-4 w-4 mr-2" />
            {!hasTwitterIntegration ? 'Connect Twitter' : 'Add Permissions'}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
