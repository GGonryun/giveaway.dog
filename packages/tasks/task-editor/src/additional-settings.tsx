import { assertNever } from '@giveaway/util-errors';
import { useCallback } from 'react';
import { StartDateField } from '@giveaway/task-editor-fields/start-date';
import { EndDateField } from '@giveaway/task-editor-fields/end-date';
import { YouTubeChannelUrlFormField } from '@giveaway/youtube-task-editor/youtube-channel-url';
import { YouTubeSubscriptionConfirmationFormField } from '@giveaway/youtube-task-editor/youtube-subscription-confirmation';
import { DiscordGuildIdFormField } from '@giveaway/discord-task-editor/discord-guild-id';
import { DiscordInviteLinkFormField } from '@giveaway/discord-task-editor/discord-invite-link';
import { HrefFormField } from '@giveaway/task-editor-fields/href';
import { KickFollowFormField } from '@giveaway/kick-task-editor/kick-follow';
import { LabelFormField } from '@giveaway/task-editor-fields/label';
import { SecretCodeFormField } from '@giveaway/task-editor-fields/secret-code';
import { SecretCodesFormField } from '@giveaway/task-editor-fields/secret-codes';
import { TweetIdFormField } from '@giveaway/x-task-editor/tweet-id';
import { TwitchFollowFormField } from '@giveaway/twitch-task-editor/twitch-follow';
import { TwitchChatImportFormField } from '@giveaway/twitch-task-editor/twitch-chat-command';
import { TwitchChannelUrlDisplay } from '@giveaway/twitch-task-editor/twitch-channel-url-display';
import { TwitterUsernameFormField } from '@giveaway/x-task-editor/twitter-username';
import { SecretHintFormField } from '@giveaway/task-editor-fields/secret-hint';
import { SteamAppIdFormField } from '@giveaway/steam-task-editor/steam-app-id';
import { MaxEntrantsField } from '@giveaway/task-editor-fields/max-entrants';
import { LoyaltyRequiredField } from '@giveaway/task-editor-fields/bonus-loyalty';
import {
  TwitterImportingAccountField,
  ImportingTweetIdValidation
} from '@giveaway/x-task-editor/twitter-importing-account';
import { BlueskyImportingAccountField } from '@giveaway/bluesky-task-editor/bluesky-importing-account';
import {
  InstagramProfileUrl,
  InstagramPostUrl
} from '@giveaway/meta-task-editor/instagram';
import {
  FacebookPageUrl,
  FacebookPostUrl
} from '@giveaway/meta-task-editor/facebook';
import {
  TikTokProfileUrl,
  TikTokPostUrl
} from '@giveaway/tiktok-task-editor/tiktok';
import { AskQuestionFormFields } from '@giveaway/task-editor-fields/ask-question';
import { SingleChoiceFormFields } from '@giveaway/task-editor-fields/single-choice';
import { MultipleChoiceFormFields } from '@giveaway/task-editor-fields/multiple-choice';
import { SubmitMediaFormFields } from '@giveaway/task-editor-fields/submit-media';
import { Typography } from '@giveaway/ui-primitives/typography';
import { AlertCircle } from 'lucide-react';
import { BlueskyProfileUrlField } from '@giveaway/bluesky-task-editor/bluesky-profile-url';
import { BlueskyPostUrlField } from '@giveaway/bluesky-task-editor/bluesky-post-url';
import { VeloraFollowFormField } from '@giveaway/velora-task-editor/velora-follow';
import { LinkedInFollowFormField } from '@giveaway/linkedin-task-editor/linkedin-follow';
import { MaximumReferralsField } from '@giveaway/task-editor-fields/maximum-referrals';
import { SteamDeveloperFormField } from '@giveaway/steam-task-editor/steam-developer';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import Link from 'next/link';
import { TaskType } from '@giveaway/task-model/schemas';
import { TwitchImportingAccountField } from '@giveaway/twitch-task-editor/twitch-importing-account';
import { TwitchRateLimitField } from '@giveaway/twitch-task-editor/twitch-rate-limit';
import { environment } from '@giveaway/app-config/environment';

export const AdditionalSettings: React.FC<{
  type: TaskType;
}> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'TWITTER_CONNECT':
      case 'BLUESKY_CONNECT':
      case 'VELORA_CONNECT':
      case 'LINKEDIN_CONNECT':
      case 'BONUS_TASK':
        return <></>;
      case 'LINKEDIN_FOLLOW':
        return <LinkedInFollowFormField />;
      case 'BONUS_COMPLETE_PROFILE':
        return (
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
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
      case 'SECRET_CODE_V2':
        return (
          <>
            <SecretCodesFormField />
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
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Deprecated Task</AlertTitle>
            <AlertDescription>
              This task is no longer officially supported and will not process
              new entries.
              <Link
                href={`/learn/integrations/x/tasks/${type === 'TWITTER_LIKE_IMPORT' ? 'like-import' : 'retweet-import'}`}
                target="_blank"
                className="underline mt-1 block"
              >
                Learn more about deprecated X tasks.
              </Link>
            </AlertDescription>
          </Alert>
        );
      case 'TWITTER_RETWEET_IMPORT_V2':
        return (
          <>
            <TweetIdFormField />
          </>
        );
      case 'BLUESKY_LIKE_IMPORT':
      case 'BLUESKY_REPOST_IMPORT':
        return (
          <>
            <BlueskyImportingAccountField />
            <BlueskyPostUrlField />
          </>
        );
      case 'DISCORD_INTERACTION_IMPORT':
        return (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Automatic Discord Interaction Task</AlertTitle>
            <AlertDescription>
              This task is automatically created when posting to Discord with
              interaction tracking enabled. It cannot be created or edited
              manually.
              <Link
                // TODO: create a knowledge base article about this
                href={`${environment.appUrl()}/contact`}
                target="_blank"
                className="underline mt-1"
              >
                Learn more about Discord Interaction Tracking.
              </Link>
            </AlertDescription>
          </Alert>
        );

      case 'STEAM_WISHLIST':
        return <SteamAppIdFormField />;
      case 'STEAM_FOLLOW':
        return (
          <>
            <SteamDeveloperFormField />
          </>
        );
      case 'DISCORD_JOIN':
        return (
          <>
            <DiscordGuildIdFormField />
            <DiscordInviteLinkFormField />
          </>
        );
      case 'TWITCH_FOLLOW':
        return <TwitchFollowFormField />;
      case 'TWITCH_CHAT_IMPORT':
        return (
          <>
            <TwitchImportingAccountField />
            <TwitchChannelUrlDisplay />
            <TwitchChatImportFormField />
            <TwitchRateLimitField />
          </>
        );
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
      case 'VELORA_FOLLOW':
        return <VeloraFollowFormField />;
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
      case 'SUBMIT_MEDIA':
        return <SubmitMediaFormFields />;
      case 'REFERRAL_LINK':
        return <MaximumReferralsField />;
      default:
        throw assertNever(type);
    }
  }, []);

  return <div className="space-y-2">{content()}</div>;
};
