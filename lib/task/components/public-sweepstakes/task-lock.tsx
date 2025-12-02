import z, { date } from 'zod';
import {
  BonusLimitedTaskSchema,
  BonusLoyaltyTaskSchema,
  BonusTimedTaskSchema,
  TaskSchema
} from '../../schemas';
import pluralize from 'pluralize';
import { formatDistance } from 'date-fns';
import { BanIcon, ClockIcon, LockIcon, LucideIcon } from 'lucide-react';
import { assertNever } from '@/lib/errors';

export const lockStateSchema = z.enum([
  'MISSING_REQUIREMENTS',
  'DEADLINE_EXCEEDED',
  'TOO_MANY_ENTRIES'
]);

export type LockState = z.infer<typeof lockStateSchema>;

export type TaskLock = { message: string; icon: LucideIcon } | null;

export const getTaskLock = (args: {
  task: TaskSchema;
  loyalty: number;
  completed: string[];
  entrants: number;
}): TaskLock => {
  const { task, completed, loyalty, entrants } = args;
  const isMissingRequirements =
    task.tasksRequired === 0 ? false : completed.length < task.tasksRequired;

  if (isMissingRequirements) {
    const remainingTasksRequired = Math.max(
      0,
      task.tasksRequired - completed.length
    );

    return {
      message: `You must complete ${remainingTasksRequired} other ${pluralize('action', remainingTasksRequired)} first`,
      icon: LockIcon
    };
  }

  switch (task.type) {
    case 'BONUS_LIMITED':
      return bonusLimitedTaskLock({ task, entrants });
    case 'BONUS_TIMED':
      return bonusTimedTaskLock({ task });
    case 'BONUS_LOYALTY':
      return bonusLoyaltyTaskLock({ task, loyalty });
    case 'BONUS_TASK':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
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

const bonusTimedTaskLock = ({ task }: { task: BonusTimedTaskSchema }) => {
  const now = new Date();

  if (task.startDate != null) {
    const start = new Date(task.startDate);
    if (now < start) {
      return {
        message: `This task will become available in ${formatDistance(start, now)}.`,
        icon: ClockIcon
      };
    }
  }

  if (task.endDate != null) {
    const until = new Date(task.endDate);
    if (now > until) {
      return {
        message: `This task expired ${formatDistance(until, now, { addSuffix: true })}.`,
        icon: BanIcon
      };
    }
  }
  return null;
};

const bonusLimitedTaskLock = ({
  task,
  entrants
}: {
  task: BonusLimitedTaskSchema;
  entrants: number;
}) => {
  if (entrants >= task.maxEntrants) {
    return {
      message: `This task has reached its maximum number of entrants.`,
      icon: BanIcon
    };
  }
  return null;
};

const bonusLoyaltyTaskLock = ({
  task,
  loyalty
}: {
  task: BonusLoyaltyTaskSchema;
  loyalty: number;
}) => {
  // check to see if a user meets the loyalty requirement
  if (loyalty < task.loyaltyRequired) {
    return {
      message: `Unlocks after participating in ${task.loyaltyRequired} sweepstakes with this host.`,
      icon: LockIcon
    };
  }
  return null;
};
