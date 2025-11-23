import { Badge } from '@/components/ui/badge';
import { assertNever } from '@/lib/errors';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { UserSource } from '@prisma/client';
import { EditIcon, UserIcon, Verified } from 'lucide-react';
import { USER_SOURCE_ICON } from './user-source-icon';

export const UserSourceBadge: React.FC<{ source: UserSource }> = ({
  source
}) => {
  {
    const Icon = USER_SOURCE_ICON[source];
    switch (source) {
      case 'TWITTER_IMPORT':
        return (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            <Icon />
            Imported
          </Badge>
        );
      case 'SIGNUP':
        return (
          <Badge className="text-xs px-1 py-0">
            <Icon />
            Verified
          </Badge>
        );
      case 'DISCORD_IMPORT':
        return (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            <Icon />
            Imported
          </Badge>
        );
      case 'MANUAL_IMPORT':
        return (
          <Badge className="text-xs px-1 py-0">
            <Icon />
            Verified
          </Badge>
        );
      default:
        throw assertNever(source);
    }
  }
};
