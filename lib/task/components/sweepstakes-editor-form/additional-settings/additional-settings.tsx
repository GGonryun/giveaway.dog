import { assertNever } from '@/lib/errors';
import { useCallback } from 'react';
import { TaskType } from '@prisma/client';
import { StartDateField } from './lib/start-date';
import { EndDateField } from './lib/end-date';
import { YouTubeChannelUrlFormField } from './lib/youtube-channel-url';
import { YouTubeSubscriptionConfirmationFormField } from './lib/youtube-subscription-confirmation';
import { DiscordGuildIdFormField } from './lib/discord-guild-id';
import { DiscordInviteLinkFormField } from './lib/discord-invite-link';
import { HrefFormField } from './lib/href';
import { KickFollowFormField } from './lib/kick-follow';
import { LabelFormField } from './lib/label';
import { SecretCodeFormField } from './lib/secret-code';
import { TweetIdFormField } from './lib/tweet-id';
import { TwitchFollowFormField } from './lib/twitch-follow';
import { TwitterUsernameFormField } from './lib/twitter-username';
import { SecretHintFormField } from './lib/secret-hint';
import { SteamAppIdFormField } from './lib/steam-app-id';
import { MaxEntrantsField } from './lib/max-entrants';
import { LoyaltyRequiredField } from './lib/bonus-loyalty';
import {
  ImportingAccountField,
  ImportingTweetIdValidation
} from './lib/importing-account';
import { InstagramProfileUrl, InstagramPostUrl } from './lib/instagram';
import { FacebookPageUrl, FacebookPostUrl } from './lib/facebook';
import { TikTokProfileUrl, TikTokPostUrl } from './lib/tiktok';
import { AskQuestionFormFields } from './lib/ask-question';
import { SingleChoiceFormFields } from './lib/single-choice';
import { MultipleChoiceFormFields } from './lib/multiple-choice';
import { Typography } from '@/components/ui/typography';
import { AlertCircle } from 'lucide-react';
import { BlueskyProfileUrlField } from './lib/bluesky-profile-url';
import { BlueskyPostUrlField } from './lib/bluesky-post-url';

export const AdditionalSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'TWITTER_CONNECT':
      case 'BLUESKY_CONNECT':

      case 'BONUS_TASK':
        return <></>;
      case 'BONUS_COMPLETE_PROFILE':
        return (
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <Typography.Paragraph
                size="sm"
                weight="medium"
                className="text-blue-900 dark:text-blue-100"
              >
                Automatic Profile Completion Task
              </Typography.Paragraph>
              <Typography.Paragraph
                size="sm"
                className="text-blue-800 dark:text-blue-200"
              >
                This task is automatically managed by the "Reward Profile
                Completion" setting in the Audience section. It will be removed
                if you disable that setting, and all associated entries will be
                deleted.
              </Typography.Paragraph>
            </div>
          </div>
        );
      case 'VISIT_URL':
        return (
          <>
            <HrefFormField />
            <LabelFormField />
          </>
        );
      case 'BONUS_LIMITED':
        return (
          <>
            <MaxEntrantsField />
          </>
        );
      case 'BONUS_LOYALTY':
        return (
          <>
            <LoyaltyRequiredField />
          </>
        );
      case 'BONUS_TIMED':
        return (
          <>
            <StartDateField />
            <EndDateField />
          </>
        );
      case 'SECRET_CODE':
        return (
          <>
            <SecretCodeFormField />
            <SecretHintFormField />
          </>
        );
      case 'TWITTER_FOLLOW':
        return <TwitterUsernameFormField />;
      case 'TWITTER_LIKE':
      case 'TWITTER_RETWEET':
        return (
          <>
            <TweetIdFormField />
          </>
        );
      case 'TWITTER_LIKE_IMPORT':
      case 'TWITTER_RETWEET_IMPORT':
        return (
          <>
            <ImportingAccountField />
            <TweetIdFormField />
            <ImportingTweetIdValidation />
          </>
        );
      case 'STEAM_WISHLIST':
        return <SteamAppIdFormField />;
      case 'DISCORD_JOIN':
        return (
          <>
            <DiscordGuildIdFormField />
            <DiscordInviteLinkFormField />
          </>
        );
      case 'TWITCH_FOLLOW':
        return <TwitchFollowFormField />;
      case 'KICK_FOLLOW':
        return <KickFollowFormField />;
      case 'YOUTUBE_VISIT':
        return (
          <>
            <YouTubeChannelUrlFormField />
            <YouTubeSubscriptionConfirmationFormField />
          </>
        );
      case 'INSTAGRAM_VISIT':
        return (
          <>
            <InstagramProfileUrl />
          </>
        );
      case 'INSTAGRAM_LIKE':
      case 'INSTAGRAM_COMMENT':
        return (
          <>
            <InstagramPostUrl />
          </>
        );
      case 'FACEBOOK_VISIT_PAGE':
        return (
          <>
            <FacebookPageUrl />
          </>
        );
      case 'FACEBOOK_VIEW_POST':
        return (
          <>
            <FacebookPostUrl />
          </>
        );
      case 'TIKTOK_FOLLOW':
        return (
          <>
            <TikTokProfileUrl />
          </>
        );
      case 'TIKTOK_LIKE':
        return (
          <>
            <TikTokPostUrl />
          </>
        );
      case 'BLUESKY_FOLLOW':
        return (
          <>
            <BlueskyProfileUrlField />
          </>
        );
      case 'BLUESKY_LIKE':
      case 'BLUESKY_REPOST':
        return (
          <>
            <BlueskyPostUrlField />
          </>
        );
      case 'ASK_QUESTION':
        return <AskQuestionFormFields />;
      case 'SINGLE_CHOICE':
        return <SingleChoiceFormFields />;
      case 'MULTIPLE_CHOICE':
        return <MultipleChoiceFormFields />;
      default:
        throw assertNever(type);
    }
  }, []);

  return <div className="space-y-2">{content()}</div>;
};
