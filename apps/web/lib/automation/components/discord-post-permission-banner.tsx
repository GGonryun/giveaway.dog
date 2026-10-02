import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';

interface DiscordPostPermissionBannerProps {
  hasDiscordIntegration: boolean;
  slug: string;
}

export function DiscordPostPermissionBanner({
  hasDiscordIntegration,
  slug
}: DiscordPostPermissionBannerProps) {
  if (hasDiscordIntegration) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        <p>Connect Discord to schedule automated posts</p>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={`/app/${slug}/settings/integrations`}>
            <SocialDiscordIcon className="h-4 w-4 mr-2" />
            Connect Discord
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
