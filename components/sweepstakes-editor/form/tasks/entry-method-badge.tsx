import { Badge } from '@/components/ui/badge';
import { assertNever } from '@/lib/errors';
import { TaskType } from '@prisma/client';
import { WrenchIcon } from 'lucide-react';
export const EntryMethodBadge: React.FC<{ type: TaskType }> = ({ type }) => {
  switch (type) {
    case 'BONUS_COMPLETE_PROFILE':
      return (
        <Badge variant="info">
          <WrenchIcon /> <span className="hidden sm:inline">Automatic</span>
        </Badge>
      );
    case 'BONUS_LIMITED':
    case 'BONUS_TIMED':
    case 'BONUS_TASK':
    case 'BONUS_LOYALTY':
    case 'VISIT_URL':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
    case 'YOUTUBE_VISIT':
    case 'STEAM_WISHLIST':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'SECRET_CODE':
      return null;

    default:
      throw assertNever(type);
  }
};
