import { ButtonVariant } from '@/components/ui/button';
import { UserTaskSubmissionSchema } from '@/schemas/giveaway/schemas';
import { CompletionStatus } from '@prisma/client';
import {
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  LucideIcon,
  XIcon
} from 'lucide-react';
import { assertNever } from '../errors';
import { UserReferralSchema } from '../referrals/schemas';
import { TaskSchema } from './schemas';
import pluralize from 'pluralize';

export const SUBMISSION_COLOR_MAP: Record<CompletionStatus, string> = {
  COMPLETED:
    'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-100 dark:border-r-0',
  PENDING:
    'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-100 dark:border-r-0',
  REJECTED:
    'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-100 dark:border-r-0'
};

export const SUBMISSION_TOOLTIP_COLOR_MAP: Record<CompletionStatus, string> = {
  COMPLETED: 'bg-success text-success-foreground fill-success',
  PENDING: 'bg-success text-success-foreground fill-success',
  REJECTED: 'bg-destructive text-destructive-foreground fill-destructive'
};

export const SUBMISSION_TOOLTIP_CONTENT = ({
  entries
}: {
  entries: number;
}): Record<CompletionStatus, string> => ({
  COMPLETED: `You earned ${entries} ${pluralize('entry', entries)}.`,
  PENDING: `You earned ${entries} ${pluralize('entry', entries)}.`,
  REJECTED: `Your submission was rejected.`
});

export const SUBMISSION_ICON_MAP: Record<CompletionStatus, LucideIcon> = {
  COMPLETED: CircleCheckIcon,
  PENDING: CircleCheckIcon,
  REJECTED: CircleXIcon
};

export const SUBMISSION_BUTTON_VARIANT_MAP: Record<
  CompletionStatus,
  ButtonVariant
> = {
  COMPLETED: 'success',
  PENDING: 'success',
  REJECTED: 'destructive'
};

export const SUBMISSION_BUTTON_ICON_MAP: Record<CompletionStatus, LucideIcon> =
  {
    COMPLETED: CheckIcon,
    PENDING: CheckIcon,
    REJECTED: XIcon
  };

export const SubmissionTaskContent: React.FC<{
  submission: CompletionStatus;
  entriesText: string;
}> = ({ submission, entriesText }) => {
  switch (submission) {
    case 'COMPLETED':
    case 'PENDING':
      return (
        <p>
          Task completed for{' '}
          <span className="font-semibold">{entriesText}</span>.
        </p>
      );
    case 'REJECTED':
      return <p>Your submission was rejected.</p>;
  }
};

export const toTaskStatus = (props: {
  submission: UserTaskSubmissionSchema | undefined;
  task: TaskSchema;
  referral: UserReferralSchema | undefined;
}): CompletionStatus | undefined => {
  switch (props.task.type) {
    case 'REFERRAL_LINK':
      // referrals hide if there is a maximum set and it has been reached
      if (
        props.task.maximum &&
        props.referral &&
        props.referral.referrals.length >= props.task.maximum
      ) {
        return 'COMPLETED';
      }
      return undefined;
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
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
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
    case 'SUBMIT_MEDIA':
      return props.submission?.status ?? undefined;
    default:
      throw assertNever(props.task);
  }
};
