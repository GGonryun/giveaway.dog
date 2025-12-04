import {
  AlarmClockIcon,
  ClockIcon,
  HeartIcon,
  KeyIcon,
  LockIcon,
  LucideIcon,
  UnlockIcon
} from 'lucide-react';
import {
  BonusLimitedTaskSchema,
  BonusLoyaltyTaskSchema,
  BonusTimedTaskSchema,
  TaskSchema
} from '../../schemas';
import { formatDistanceToNowStrict } from 'date-fns';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../theme';
import { assertNever } from '@/lib/errors';
import { CompletionStatus } from '@prisma/client';

const Container: React.PC<{
  Icon?: LucideIcon;
}> = ({ children, Icon }) => {
  const { theme } = useTaskTheme();

  if (!children || (Array.isArray(children) && children.length === 0))
    return null;

  return (
    <Badge className={cn('text-xs hidden md:inline-flex', theme.action)}>
      <span className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3" />}
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

type TaskBadgeProps<T extends TaskSchema = TaskSchema> = {
  submission: CompletionStatus | undefined;
  entrants: number;
  loyalty: number;
  task: T;
};

export const TaskBadge: React.FC<TaskBadgeProps> = ({
  submission,
  task,
  entrants,
  loyalty
}) => {
  if (submission) return null;

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
    case 'BONUS_TASK':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE':
    case 'STEAM_WISHLIST':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'YOUTUBE_VISIT':
      return null;
    default:
      throw assertNever(task);
  }
};
