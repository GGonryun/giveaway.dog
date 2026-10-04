import { Badge, BadgeVariants } from '@giveaway/ui-primitives/badge';
import { assertNever } from '@giveaway/util-errors';

import { UserSource } from '@giveaway/db-model';
import { USER_SOURCE_ICON } from './user-source-icon';

export const USER_SOURCE_BADGE_VARIANTS: Record<UserSource, BadgeVariants> = {
  TWITTER_IMPORT: 'secondary',
  BLUESKY_IMPORT: 'secondary',
  TWITCH_IMPORT: 'secondary',
  SIGNUP: 'default',
  DISCORD_IMPORT: 'secondary',
  MANUAL_IMPORT: 'secondary',
  ANONYMOUS: 'secondary'
};

export const UserSourceBadge: React.FC<{ source: UserSource }> = ({
  source
}) => {
  {
    const Icon = USER_SOURCE_ICON[source];
    const variant = USER_SOURCE_BADGE_VARIANTS[source];
    switch (source) {
      case 'ANONYMOUS':
      case 'TWITTER_IMPORT':
      case 'BLUESKY_IMPORT':
      case 'DISCORD_IMPORT':
      case 'TWITCH_IMPORT':
      case 'MANUAL_IMPORT':
        return (
          <Badge variant={variant} className="text-xs p-0.5 [&>svg]:size-2">
            <Icon />
          </Badge>
        );
      case 'SIGNUP':
        return (
          <Badge variant="default" className="text-xs p-0">
            <Icon />
          </Badge>
        );

      default:
        throw assertNever(source);
    }
  }
};
