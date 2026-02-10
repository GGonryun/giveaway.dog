import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldOffIcon } from 'lucide-react';
import { TaskType } from '../../schemas';

const VERIFICATION_WARNINGS: Record<
  TaskType,
  | {
      title: string;
      description: string;
    }
  | undefined
> = {
  STEAM_FOLLOW: {
    title: 'Cannot Be Verified',
    description:
      'Steam follower status is not verifiable. Hosts may request screenshots or rely on an honor system.'
  },
  // All other tasks return undefined
  BONUS_TASK: undefined,
  BONUS_TIMED: undefined,
  BONUS_LIMITED: undefined,
  BONUS_LOYALTY: undefined,
  BONUS_COMPLETE_PROFILE: undefined,
  VISIT_URL: undefined,
  ASK_QUESTION: undefined,
  SINGLE_CHOICE: undefined,
  MULTIPLE_CHOICE: undefined,
  TWITTER_CONNECT: undefined,
  TWITTER_FOLLOW: undefined,
  TWITTER_RETWEET: undefined,
  TWITTER_RETWEET_IMPORT: undefined,
  TWITTER_RETWEET_IMPORT_V2: undefined,
  TWITTER_LIKE: undefined,
  TWITTER_LIKE_IMPORT: undefined,
  STEAM_WISHLIST: undefined,
  DISCORD_JOIN: undefined,
  TWITCH_FOLLOW: undefined,
  KICK_FOLLOW: undefined,
  SECRET_CODE: undefined,
  SECRET_CODE_V2: undefined,
  YOUTUBE_VISIT: undefined,
  INSTAGRAM_VISIT: undefined,
  INSTAGRAM_LIKE: undefined,
  INSTAGRAM_COMMENT: undefined,
  FACEBOOK_VISIT_PAGE: undefined,
  FACEBOOK_VIEW_POST: undefined,
  TIKTOK_FOLLOW: undefined,
  TIKTOK_LIKE: undefined,
  BLUESKY_CONNECT: undefined,
  BLUESKY_FOLLOW: undefined,
  BLUESKY_LIKE: undefined,
  BLUESKY_REPOST: undefined,
  BLUESKY_LIKE_IMPORT: undefined,
  BLUESKY_REPOST_IMPORT: undefined,
  VELORA_CONNECT: undefined,
  DISCORD_INTERACTION_IMPORT: undefined,
  REFERRAL_LINK: undefined,
  SUBMIT_MEDIA: undefined
};

export const VerificationAlert: React.FC<{ type: TaskType }> = ({ type }) => {
  const warning = VERIFICATION_WARNINGS[type];

  // If no warning exists, return null
  if (!warning) {
    return null;
  }

  return (
    <Alert variant="warning" className="mt-1 mb-2">
      <ShieldOffIcon className="h-4 w-4" />
      <AlertTitle>{warning.title}</AlertTitle>
      <AlertDescription>{warning.description}</AlertDescription>
    </Alert>
  );
};
