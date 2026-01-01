import { assertNever } from '@/lib/errors';

import { TaskActionProps } from './building-blocks';

import { VisitUrlTaskActionForm } from './lib/website/visit-url';
import { BonusTaskActionForm } from './lib/website/bonus-task';
import { TwitterConnectTaskActionForm } from './lib/twitter/twitter-connect';
import { TwitterFollowTaskActionForm } from './lib/twitter/twitter-follow';
import { TwitterRetweetTaskActionForm } from './lib/twitter/twitter-retweet';
import { SteamWishlistTaskActionForm } from './lib/steam/steam-wishlist';
import { DiscordJoinTaskActionForm } from './lib/discord/discord-join';
import { TwitchFollowTaskActionForm } from './lib/twitch/twitch-follow';
import { KickFollowTaskActionForm } from './lib/kick/kick-follow';
import { SecretCodeTaskActionForm } from './lib/form/secret-code';
import { YouTubeVisitTaskActionForm } from './lib/youtube/youtube-visit';
import { TwitterLikeTaskActionForm } from './lib/twitter/twitter-like';
import { BonusTimedActionForm } from './lib/website/bonus-timed';
import { BonusLimitedActionForm } from './lib/website/bonus-limited';
import { BonusLoyaltyActionForm } from './lib/website/bonus-loyalty';
import { InstagramVisitTaskActionForm } from './lib/instagram/visit';
import { BlueskyConnectTaskActionForm } from './lib/bluesky/bluesky-connect';
import { BlueskyFollowTaskActionForm } from './lib/bluesky/bluesky-follow';
import { BlueskyLikeTaskActionForm } from './lib/bluesky/bluesky-like';
import { BlueskyRepostTaskActionForm } from './lib/bluesky/bluesky-repost';
import { InstagramLikeTaskActionForm } from './lib/instagram/like';
import { InstagramCommentTaskActionForm } from './lib/instagram/comment';
import { FacebookVisitPageTaskActionForm } from './lib/facebook/visit-page';
import { FacebookViewPostTaskActionForm } from './lib/facebook/view-post';
import { TikTokFollowTaskActionForm } from './lib/tiktok/tiktok-follow';
import { TikTokLikeTaskActionForm } from './lib/tiktok/tiktok-like';
import { AskQuestionTaskActionForm } from './lib/form/ask-question';
import { SingleChoiceTaskActionForm } from './lib/form/single-choice';
import { MultipleChoiceTaskActionForm } from './lib/form/multiple-choice';
import { ReferralLinkTaskActionForm } from './lib/referral/referral-link';

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
      return <TwitterRetweetTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
      return <TwitterLikeTaskActionForm {...props} task={props.task} />;
    case 'STEAM_WISHLIST':
      return <SteamWishlistTaskActionForm {...props} task={props.task} />;
    case 'DISCORD_JOIN':
      return <DiscordJoinTaskActionForm {...props} task={props.task} />;
    case 'TWITCH_FOLLOW':
      return <TwitchFollowTaskActionForm {...props} task={props.task} />;
    case 'KICK_FOLLOW':
      return <KickFollowTaskActionForm {...props} task={props.task} />;
    case 'SECRET_CODE':
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
    case 'REFERRAL_LINK':
      return <ReferralLinkTaskActionForm {...props} task={props.task} />;
    default:
      throw assertNever(props.task);
  }
};
