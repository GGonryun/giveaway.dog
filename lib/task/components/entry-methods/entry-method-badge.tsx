import { Badge } from '@/components/ui/badge';
import { assertNever } from '@/lib/errors';
import { TaskType } from '@prisma/client';
import { ShieldCheck, ZapIcon } from 'lucide-react';
import pluralize from 'pluralize';
import { TASK_HAS_AUTOMATIC_VALIDATION } from '../../schemas';
import { ImportBadge } from '../sweepstakes-editor-form/import-badge';
export const EntryMethodBadge: React.FC<{
  type: TaskType;
  errorCount: number;
}> = ({ type, errorCount }) => {
  if (errorCount > 0) {
    return (
      <Badge variant="destructive">
        {errorCount} {pluralize('error', errorCount)}
      </Badge>
    );
  }

  switch (type) {
    case 'BONUS_COMPLETE_PROFILE':
      return (
        <Badge variant="info">
          <ZapIcon /> <span className="hidden sm:inline">Instant</span>
        </Badge>
      );
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT':
      return <ImportBadge />;
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
    case 'TWITTER_LIKE':
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
    case 'BLUESKY_CONNECT':
      return TASK_HAS_AUTOMATIC_VALIDATION[type] ? (
        <Badge variant="success">
          <ShieldCheck /> <span className="hidden sm:inline">Verified</span>
        </Badge>
      ) : null;

    default:
      throw assertNever(type);
  }
};
