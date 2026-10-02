import { assertNever } from '@/lib/errors';
import { ImportBadge } from '../badges/import-badge';
import { InstantBadge } from '../badges/instant-badge';
import { VerificationBadge } from '../badges/verification-badge';
import { ErrorCountBadge } from '../badges/error-count-badge';
import { MaxOfOneBadge } from '../badges/max-of-one-badge';
import { TaskType } from '../../schemas';

export const EntryMethodBadge: React.FC<{
  type: TaskType;
  showMaxOfOne?: boolean;
  numErrors?: number;
}> = ({ type, showMaxOfOne = false, numErrors = 0 }) => {
  if (numErrors > 0) {
    return <ErrorCountBadge numErrors={numErrors} />;
  }

  if (showMaxOfOne) {
    return <MaxOfOneBadge />;
  }

  switch (type) {
    case 'BONUS_COMPLETE_PROFILE':
      return <InstantBadge />;
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE_IMPORT':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'TWITCH_CHAT_IMPORT':
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
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'VELORA_CONNECT':
    case 'VELORA_FOLLOW':
    case 'LINKEDIN_CONNECT':
    case 'LINKEDIN_FOLLOW':
    case 'REFERRAL_LINK':
    case 'SUBMIT_MEDIA':
      return <VerificationBadge type={type} />;
    default:
      throw assertNever(type);
  }
};
