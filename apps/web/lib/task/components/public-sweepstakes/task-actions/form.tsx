import { assertNever } from '@giveaway/util-errors';

import { TaskActionProps } from '@giveaway/task-entry-core/building-blocks';

import { VisitUrlTaskActionForm } from './lib/website/visit-url';
import { BonusTaskActionForm } from './lib/website/bonus-task';
import { TwitterConnectTaskActionForm } from './lib/twitter/twitter-connect';
import { TwitterFollowTaskActionForm } from './lib/twitter/twitter-follow';
import { TwitterRetweetTaskActionForm } from './lib/twitter/twitter-retweet';
import { SteamWishlistTaskActionForm } from '@giveaway/steam-task-entry/steam-wishlist';
import { SteamFollowTaskActionForm } from '@giveaway/steam-task-entry/steam-follow';
import { DiscordJoinTaskActionForm } from '@giveaway/discord-task-entry/discord-join';
import { DiscordInteractionImportTaskActionForm } from '@giveaway/discord-task-entry/discord-interaction-import';
import { TwitchFollowTaskActionForm } from './lib/twitch/twitch-follow';
import { KickFollowTaskActionForm } from '@giveaway/kick-task-entry/kick-follow';
import { SecretCodeTaskActionForm } from '@giveaway/task-entry-form/secret-code';
import { YouTubeVisitTaskActionForm } from './lib/youtube/youtube-visit';
import { TwitterLikeTaskActionForm } from './lib/twitter/twitter-like';
import { BonusTimedActionForm } from './lib/website/bonus-timed';
import { BonusLimitedActionForm } from './lib/website/bonus-limited';
import { BonusLoyaltyActionForm } from './lib/website/bonus-loyalty';
import { InstagramVisitTaskActionForm } from '@giveaway/meta-task-entry/instagram/visit';
import { BlueskyConnectTaskActionForm } from '@giveaway/bluesky-task-entry/bluesky-connect';
import { BlueskyFollowTaskActionForm } from '@giveaway/bluesky-task-entry/bluesky-follow';
import { BlueskyLikeTaskActionForm } from '@giveaway/bluesky-task-entry/bluesky-like';
import { BlueskyRepostTaskActionForm } from '@giveaway/bluesky-task-entry/bluesky-repost';
import { VeloraConnectTaskActionForm } from './lib/velora/velora-connect';
import { VeloraFollowTaskActionForm } from './lib/velora/velora-follow';
import { LinkedInConnectTaskActionForm } from '@giveaway/linkedin-task-entry/linkedin-connect';
import { LinkedInFollowTaskActionForm } from '@giveaway/linkedin-task-entry/linkedin-follow';
import { InstagramLikeTaskActionForm } from '@giveaway/meta-task-entry/instagram/like';
import { InstagramCommentTaskActionForm } from '@giveaway/meta-task-entry/instagram/comment';
import { FacebookVisitPageTaskActionForm } from '@giveaway/meta-task-entry/facebook/visit-page';
import { FacebookViewPostTaskActionForm } from '@giveaway/meta-task-entry/facebook/view-post';
import { TikTokFollowTaskActionForm } from './lib/tiktok/tiktok-follow';
import { TikTokLikeTaskActionForm } from './lib/tiktok/tiktok-like';
import { AskQuestionTaskActionForm } from '@giveaway/task-entry-form/ask-question';
import { SingleChoiceTaskActionForm } from '@giveaway/task-entry-form/single-choice';
import { MultipleChoiceTaskActionForm } from '@giveaway/task-entry-form/multiple-choice';
import { SubmitMediaTaskActionForm } from '@giveaway/task-entry-form/submit-media';
import { ReferralLinkTaskActionForm } from './lib/referral/referral-link';
import { TwitchChatImportTaskActionForm } from './lib/twitch/twitch-chat-import';

export const TaskActionForm: React.FC<
  TaskActionProps & {
    entrants: number;
  }
> = (props) => {
  switch (props.task.type) {
    case 'BONUS_TASK':
      return <BonusTaskActionForm {...props} task={props.task} />;
    case 'BONUS_COMPLETE_PROFILE':
      return <BonusTaskActionForm {...props} task={props.task} />;
    case 'BONUS_TIMED':
      return <BonusTimedActionForm {...props} task={props.task} />;
    case 'BONUS_LIMITED':
      return <BonusLimitedActionForm {...props} task={props.task} />;
    case 'BONUS_LOYALTY':
      return <BonusLoyaltyActionForm {...props} task={props.task} />;
    case 'VISIT_URL':
      return <VisitUrlTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_CONNECT':
      return <TwitterConnectTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_FOLLOW':
      return <TwitterFollowTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
      return <TwitterRetweetTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
      return <TwitterLikeTaskActionForm {...props} task={props.task} />;
    case 'STEAM_WISHLIST':
      return <SteamWishlistTaskActionForm {...props} task={props.task} />;
    case 'STEAM_FOLLOW':
      return <SteamFollowTaskActionForm {...props} task={props.task} />;
    case 'DISCORD_JOIN':
      return <DiscordJoinTaskActionForm {...props} task={props.task} />;
    case 'DISCORD_INTERACTION_IMPORT':
      return (
        <DiscordInteractionImportTaskActionForm {...props} task={props.task} />
      );
    case 'TWITCH_FOLLOW':
      return <TwitchFollowTaskActionForm {...props} task={props.task} />;
    case 'TWITCH_CHAT_IMPORT':
      return <TwitchChatImportTaskActionForm {...props} task={props.task} />;
    case 'KICK_FOLLOW':
      return <KickFollowTaskActionForm {...props} task={props.task} />;
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
      return <SecretCodeTaskActionForm {...props} task={props.task} />;
    case 'YOUTUBE_VISIT':
      return <YouTubeVisitTaskActionForm {...props} task={props.task} />;
    case 'INSTAGRAM_VISIT':
      return <InstagramVisitTaskActionForm {...props} task={props.task} />;
    case 'INSTAGRAM_LIKE':
      return <InstagramLikeTaskActionForm {...props} task={props.task} />;
    case 'INSTAGRAM_COMMENT':
      return <InstagramCommentTaskActionForm {...props} task={props.task} />;
    case 'FACEBOOK_VISIT_PAGE':
      return <FacebookVisitPageTaskActionForm {...props} task={props.task} />;
    case 'FACEBOOK_VIEW_POST':
      return <FacebookViewPostTaskActionForm {...props} task={props.task} />;
    case 'TIKTOK_FOLLOW':
      return <TikTokFollowTaskActionForm {...props} task={props.task} />;
    case 'TIKTOK_LIKE':
      return <TikTokLikeTaskActionForm {...props} task={props.task} />;
    case 'ASK_QUESTION':
      return <AskQuestionTaskActionForm {...props} task={props.task} />;
    case 'SINGLE_CHOICE':
      return <SingleChoiceTaskActionForm {...props} task={props.task} />;
    case 'MULTIPLE_CHOICE':
      return <MultipleChoiceTaskActionForm {...props} task={props.task} />;
    case 'SUBMIT_MEDIA':
      return <SubmitMediaTaskActionForm {...props} task={props.task} />;
    case 'BLUESKY_CONNECT':
      return <BlueskyConnectTaskActionForm {...props} task={props.task} />;
    case 'BLUESKY_FOLLOW':
      return <BlueskyFollowTaskActionForm {...props} task={props.task} />;
    case 'BLUESKY_LIKE':
    case 'BLUESKY_LIKE_IMPORT':
      return <BlueskyLikeTaskActionForm {...props} task={props.task} />;
    case 'BLUESKY_REPOST':
    case 'BLUESKY_REPOST_IMPORT':
      return <BlueskyRepostTaskActionForm {...props} task={props.task} />;
    case 'VELORA_CONNECT':
      return <VeloraConnectTaskActionForm {...props} task={props.task} />;
    case 'VELORA_FOLLOW':
      return <VeloraFollowTaskActionForm {...props} task={props.task} />;
    case 'LINKEDIN_CONNECT':
      return <LinkedInConnectTaskActionForm {...props} task={props.task} />;
    case 'LINKEDIN_FOLLOW':
      return <LinkedInFollowTaskActionForm {...props} task={props.task} />;
    case 'REFERRAL_LINK':
      return <ReferralLinkTaskActionForm {...props} task={props.task} />;
    default:
      throw assertNever(props.task);
  }
};
