import { ButtonVariant } from '@/components/ui/button';
import { CompletionStatus } from '@prisma/client';
import {
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  LucideIcon,
  XIcon
} from 'lucide-react';

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
  entriesText
}: {
  entriesText: string;
}): Record<CompletionStatus, string> => ({
  COMPLETED: `You earned ${entriesText}.`,
  PENDING: `You earned ${entriesText}.`,
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
