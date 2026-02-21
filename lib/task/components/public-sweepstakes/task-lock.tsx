import z from 'zod';
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
import { UserTaskSubmissionSchema } from '@/schemas/giveaway/schemas';
import { isLoyal } from '@/lib/loyalty/validation';

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
  submissions: UserTaskSubmissionSchema[];
  entrants: number;
}): TaskLock => {
  const { task, submissions, loyalty, entrants } = args;
  const completedTasks = submissions
    .filter((c) => c.status === 'COMPLETED')
    .map((c) => c.taskId);
  const isMissingRequirements =
    task.tasksRequired === 0
      ? false
      : completedTasks.length < task.tasksRequired;

  if (isMissingRequirements) {
    const remainingTasksRequired = Math.max(
      0,
      task.tasksRequired - completedTasks.length
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
    case 'BONUS_COMPLETE_PROFILE':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
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
    case 'REFERRAL_LINK':
    case 'SUBMIT_MEDIA':
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
  if (isLoyal(loyalty, task)) {
    return null;
  }

  return {
    message: `Unlocks after participating in ${task.loyaltyRequired} sweepstakes with this host. (${loyalty})`,
    icon: LockIcon
  };
};
