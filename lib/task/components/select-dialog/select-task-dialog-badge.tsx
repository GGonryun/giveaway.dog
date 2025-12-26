import { assertNever } from '@/lib/errors';
import { TASK_HAS_AUTOMATIC_VALIDATION } from '@/lib/task/schemas';
import { TaskType } from '@prisma/client';
import { ImportBadge } from '../sweepstakes-editor-form/import-badge';
import { VerifiedBadge } from '../sweepstakes-editor-form/verified-badge';

export const SelectTaskDialogBadge: React.FC<{ type: TaskType }> = ({
  type
}) => {
  switch (type) {
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT':
      return <ImportBadge />;
    case 'BONUS_LIMITED':
    case 'BONUS_TIMED':
    case 'BONUS_TASK':
    case 'BONUS_LOYALTY':
    case 'BONUS_COMPLETE_PROFILE':
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
    case 'BLUESKY_CONNECT':
    case 'SECRET_CODE':
      return TASK_HAS_AUTOMATIC_VALIDATION[type] ? <VerifiedBadge /> : null;
    default:
      throw assertNever(type);
  }
};
