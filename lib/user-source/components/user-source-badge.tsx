import { Badge } from '@/components/ui/badge';
import { assertNever } from '@/lib/errors';

import { UserSource } from '@prisma/client';
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
          </Badge>
        );
      case 'SIGNUP':
        return (
          <Badge variant="default" className="text-xs p-0 py-0">
            <Icon />
          </Badge>
        );
      case 'DISCORD_IMPORT':
        return (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            <Icon />
          </Badge>
        );
      case 'MANUAL_IMPORT':
        return (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            <Icon />
          </Badge>
        );
      default:
        throw assertNever(source);
    }
  }
};
