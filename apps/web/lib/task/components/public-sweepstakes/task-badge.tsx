import {
  AlarmClockIcon,
  ClockIcon,
  LockIcon,
  LucideIcon,
  UnlockIcon
} from 'lucide-react';
import {
  BonusLimitedTaskSchema,
  BonusLoyaltyTaskSchema,
  BonusTimedTaskSchema,
  ReferralLinkTaskSchema,
  TaskSchema,
  TwitterLikeImportTaskSchema,
  TwitterRetweetImportTaskSchema
} from '@giveaway/task-model/schemas';
import { formatDistanceToNowStrict } from 'date-fns';
import React from 'react';
import { Badge } from '@giveaway/ui-primitives/badge';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '@giveaway/task-ui/theme';
import { assertNever } from '@giveaway/util-errors';
import { SocialXBlueCheckmarkIcon } from '@giveaway/integration-icons/x-icon';
import pluralize from 'pluralize';
import { UserTaskSubmissionSchema } from '@giveaway/sweepstakes-model/schemas';
import { UserReferralSchema } from '@giveaway/referrals-model/schemas';
import { toTaskStatus } from '../../submission';
import { CompletionStatus } from '@prisma/client';

const Container: React.PC<{
  Icon?: LucideIcon;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}> = ({ children, Icon, className, iconClassName, textClassName }) => {
  const { theme } = useTaskTheme();

  if (!children || (Array.isArray(children) && children.length === 0))
    return null;

  return (
    <Badge
      className={cn('text-xs hidden md:inline-flex', theme.action, className)}
    >
      <span className={cn('flex items-center gap-1.5', textClassName)}>
        {Icon && <Icon className={cn('size-3', iconClassName)} />}
        {children}
      </span>
    </Badge>
  );
};

const BonusTimedContent: React.FC<{ task: BonusTimedTaskSchema }> = ({
  task
}) => {
  if (task.startDate) {
    const start = new Date(task.startDate);
    if (start > new Date()) {
      return (
        <Container Icon={ClockIcon}>
          Unlocks in {formatDistanceToNowStrict(start)}
        </Container>
      );
    }
  }

  if (task.endDate) {
    const end = new Date(task.endDate);
    if (end < new Date()) {
      return <Container Icon={AlarmClockIcon}>Expired</Container>;
    } else {
      const end = new Date(task.endDate);
      return (
        <Container Icon={AlarmClockIcon}>
          {formatDistanceToNowStrict(end)} left
        </Container>
      );
    }
  }

  return null;
};

const BonusLimitedContent: React.FC<{
  task: BonusLimitedTaskSchema;
  entrants: number;
}> = ({ task, entrants }) => {
  if (task.maxEntrants != null && entrants >= task.maxEntrants) {
    return null;
  } else {
    return (
      <Container
        Icon={UnlockIcon}
      >{`${entrants} / ${task.maxEntrants} claimed`}</Container>
    );
  }
};

const BonusLoyaltyContent: React.FC<{
  task: BonusLoyaltyTaskSchema;
  loyalty: number;
}> = ({ task, loyalty }) => {
  if (loyalty >= task.loyaltyRequired) {
    return null;
  }

  return (
    <Container Icon={LockIcon}>
      {loyalty} / {task.loyaltyRequired} loyalty
    </Container>
  );
};

const BonusVerifiedContent: React.FC<{
  task: TwitterLikeImportTaskSchema | TwitterRetweetImportTaskSchema;
}> = ({ task }) => {
  if (!task.verifiedBonus) return null;
  return (
    <Badge
      className={cn(
        'text-xs hidden md:inline-flex bg-white border-twitter-2/20'
      )}
    >
      <span className={cn('flex items-center gap-0.5 text-twitter-2')}>
        +{task.verifiedBonus} {pluralize('entry', task.verifiedBonus)} for
        <SocialXBlueCheckmarkIcon className={cn('size-3 mt-px')} />
      </span>
    </Badge>
  );
};

const ReferralLinkContent: React.FC<{
  task: ReferralLinkTaskSchema;
  referral: UserReferralSchema | undefined;
}> = ({ task, referral }) => {
  if (!task.maximum) return null;
  return (
    <Container Icon={UnlockIcon}>
      {referral?.referrals.length ?? 0} / {task.maximum} referrals
    </Container>
  );
};

type TaskBadgeProps<T extends TaskSchema = TaskSchema> = {
  open: boolean;
  status: CompletionStatus | undefined;
  entrants: number;
  loyalty: number;
  referral: UserReferralSchema | undefined;
  task: T;
};

export const TaskBadge: React.FC<TaskBadgeProps> = (props) => {
  const { task, entrants, loyalty, referral, status, open } = props;

  if (open) return null;
  if (status) return null;

  if (task.mandatory) {
    return <Container Icon={LockIcon}>Required</Container>;
  }

  switch (task.type) {
    case 'BONUS_LIMITED':
      return <BonusLimitedContent task={task} entrants={entrants} />;
    case 'BONUS_TIMED':
      return <BonusTimedContent task={task} />;
    case 'BONUS_LOYALTY':
      return <BonusLoyaltyContent task={task} loyalty={loyalty} />;
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE_IMPORT':
      return <BonusVerifiedContent task={task} />;
    case 'REFERRAL_LINK':
      return <ReferralLinkContent task={task} referral={referral} />;
    case 'BONUS_TASK':
    case 'BONUS_COMPLETE_PROFILE':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'TWITCH_FOLLOW':
    case 'TWITCH_CHAT_IMPORT':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
    case 'YOUTUBE_VISIT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'VELORA_CONNECT':
    case 'VELORA_FOLLOW':
    case 'LINKEDIN_CONNECT':
    case 'LINKEDIN_FOLLOW':
    case 'SUBMIT_MEDIA':
      return null;
    default:
      throw assertNever(task);
  }
};
