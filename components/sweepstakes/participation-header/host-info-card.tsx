import { Button } from '@/components/ui/button';
import { DEFAULT_TEAM_LOGO } from '@/lib/settings';
import { GiveawayHostSchema } from '@/schemas/giveaway/schemas';
import { Award, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';

export const HostInfoCard: React.FC<{
  host: GiveawayHostSchema;
}> = ({ host }) => {
  const hostSlug = `/hosts/${host.slug}`;
  return (
    <div className="px-2 py-1 bg-sidebar border rounded-lg">
      <div className="flex flex-row flex-wrap gap-x-2 items-center justify-between">
        <div className="flex gap-2">
          <span className="text-md">{host.logo || DEFAULT_TEAM_LOGO}</span>
          <div className="flex flex-col">
            <div className="text-md text-muted-foreground">
              Hosted by{' '}
              <Link href={hostSlug} className="font-semibold">
                {host.name}
              </Link>
            </div>
          </div>
        </div>
        <Button size="sm" variant="ghost" asChild>
          <Link href={hostSlug}>
            <ExternalLinkIcon className="h-3 w-3" />
            See More
          </Link>
        </Button>
      </div>
    </div>
  );
};
