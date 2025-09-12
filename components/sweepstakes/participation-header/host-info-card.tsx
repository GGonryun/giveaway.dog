import { DEFAULT_TEAM_LOGO } from '@/lib/settings';
import { GiveawayHostSchema } from '@/schemas/giveaway/schemas';

export const HostInfoCard: React.FC<{
  host: GiveawayHostSchema;
}> = ({ host }) => {
  return (
    <div className="px-2 py-1 bg-sidebar border rounded-lg">
      <div className="flex flex-row flex-wrap gap-x-2 items-center justify-between h-8">
        <div className="flex gap-2">
          <span className="text-md">{host.logo || DEFAULT_TEAM_LOGO}</span>
          <div className="flex flex-col">
            <div className="text-md text-muted-foreground">
              Hosted by <span className="font-semibold">{host.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
