import { ButtonVariant } from '@/components/ui/button';
import { CompletionStatus } from '@prisma/client';
import {
  CheckIcon,
  CircleCheckIcon,
  CircleEllipsis,
  CircleXIcon,
  EllipsisIcon,
  LucideIcon,
  XIcon
} from 'lucide-react';

export const SUBMISSION_COLOR_MAP: Record<CompletionStatus, string> = {
  COMPLETED:
    'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-100 dark:border-r-0',
  PENDING:
    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-100 dark:border-r-0',
  REJECTED:
    'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-100 dark:border-r-0'
};

export const SUBMISSION_TOOLTIP_COLOR_MAP: Record<CompletionStatus, string> = {
  COMPLETED: 'bg-success text-success-foreground fill-success',
  PENDING: 'bg-warning text-warning-foreground fill-warning',
  REJECTED: 'bg-destructive text-destructive-foreground fill-destructive'
};

export const SUBMISSION_TOOLTIP_CONTENT = ({
  entriesText
}: {
  entriesText: string;
}): Record<CompletionStatus, string> => ({
  COMPLETED: `You earned ${entriesText}.`,
  PENDING: `Your submission is pending review.`,
  REJECTED: `Your submission was rejected.`
});

export const SUBMISSION_ICON_MAP: Record<CompletionStatus, LucideIcon> = {
  COMPLETED: CircleCheckIcon,
  PENDING: CircleEllipsis,
  REJECTED: CircleXIcon
};

export const SUBMISSION_BUTTON_VARIANT_MAP: Record<
  CompletionStatus,
  ButtonVariant
> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  REJECTED: 'destructive'
};

export const SUBMISSION_BUTTON_ICON_MAP: Record<CompletionStatus, LucideIcon> =
  {
    COMPLETED: CheckIcon,
    PENDING: EllipsisIcon,
    REJECTED: XIcon
  };

export const SubmissionTaskContent: React.FC<{
  submission: CompletionStatus;
  entriesText: string;
}> = ({ submission, entriesText }) => {
  switch (submission) {
    case 'COMPLETED':
      return (
        <p>
          Task completed for{' '}
          <span className="font-semibold">{entriesText}</span>.
        </p>
      );
    case 'PENDING':
      return <p>Your submission is pending review.</p>;
    case 'REJECTED':
      return <p>Your submission was rejected.</p>;
  }
};
