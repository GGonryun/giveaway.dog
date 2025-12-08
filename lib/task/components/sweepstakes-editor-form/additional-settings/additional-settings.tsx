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
import { DateValidatorField } from './lib/date-validator';
import { MaxEntrantsField } from './lib/max-entrants';
import { LoyaltyRequiredField } from './lib/bonus-loyalty';
import {
  ImportingAccountField,
  ImportingTweetIdValidation
} from './lib/importing-account';
import { InstagramProfileUrl, InstagramPostUrl } from './lib/instagram';
import { FacebookPageUrl } from './lib/facebook';

export const AdditionalSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'TWITTER_CONNECT':
      case 'BONUS_TASK':
        return <></>;
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
            <DateValidatorField />
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
      default:
        throw assertNever(type);
    }
  }, []);

  return <div className="space-y-2">{content()}</div>;
};
