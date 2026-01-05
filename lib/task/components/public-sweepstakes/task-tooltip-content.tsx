import { TooltipContent } from '@/components/ui/tooltip';
import { useTaskTheme } from '../theme';
import { cn } from '@/lib/utils';
import { TaskLock } from './task-lock';
import { CompletionStatus } from '@prisma/client';
import {
  SUBMISSION_TOOLTIP_COLOR_MAP,
  SUBMISSION_TOOLTIP_CONTENT
} from '../../submission';
import { TaskSchema } from '../../schemas';
import pluralize from 'pluralize';
import { assertNever } from '@/lib/errors';

export const TaskTooltipContent: React.FC<{
  status: CompletionStatus | undefined;
  entries: number;
  task: TaskSchema;
  lock: TaskLock;
}> = ({ status, entries, task, lock }) => {
  const { theme } = useTaskTheme();
  const color = status ? SUBMISSION_TOOLTIP_COLOR_MAP[status] : undefined;

  const content = status
    ? SUBMISSION_TOOLTIP_CONTENT({ entries })[status]
    : null;

  return (
    <TooltipContent
      side="left"
      align="center"
      className={cn(color || theme.arrow)}
      arrowClassName={cn(color || theme.arrow)}
    >
      {content ? (
        <p>{content}</p>
      ) : lock ? (
        <p>{lock.message}</p>
      ) : (
        <p>{toEntriesText({ task })}</p>
      )}
    </TooltipContent>
  );
};

const toEntriesText = ({ task }: { task: TaskSchema }) => {
  switch (task.type) {
    case 'REFERRAL_LINK':
      return `Every referral earns ${task.value} ${pluralize('entry', task.value)}.`;
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'BONUS_COMPLETE_PROFILE':
    case 'VISIT_URL':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'YOUTUBE_VISIT':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
      return `Complete task for ${task.value} ${pluralize('entry', task.value)}.`;
    default:
      throw assertNever(task);
  }
};
