import { Button, ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Failure } from '@/lib/mrpc/types';
import { cn } from '@/lib/utils';
import { CheckIcon, LucideIcon, SaveIcon } from 'lucide-react';
import { useMemo } from 'react';
import { TaskSchema } from '../../../schemas';
import { useTaskTheme } from '../../theme';
import { Separator } from '@/components/ui/separator';
import { UserTaskSubmissionSchema } from '@/schemas/giveaway/schemas';
import { OptionalFields } from '@giveaway/util-types/types';

export type TaskActionHandlers = {
  onSubmit: (data?: unknown) => void;
  onUpdate: (data?: unknown) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: Failure['data'];
  submission: UserTaskSubmissionSchema | undefined;
};

export type TaskActionProps<T extends TaskSchema = TaskSchema> =
  TaskActionHandlers & {
    task: T;
    entrants: number;
    loyalty: number;
  };

export const TaskContent: React.PC<{ className?: string }> = ({
  children,
  className
}) => {
  return (
    <div
      className={cn('p-4 flex items-center justify-center gap-2', className)}
    >
      {children}
    </div>
  );
};

export type CustomButtonProps = {
  label?: string;
  className?: string;
  variant?: ButtonProps['variant'];
  icon?: LucideIcon | null;
};

type CustomTooltipButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  tooltip?: string;
  buttonProps?: CustomButtonProps;
  defaultLabel?: string;
  defaultIcon?: LucideIcon;
  defaultVariant?: ButtonProps['variant'];
};

const CustomTooltipButton: React.FC<CustomTooltipButtonProps> = ({
  disabled = false,
  isLoading = false,
  onClick,
  tooltip,
  buttonProps,
  defaultLabel,
  defaultIcon,
  defaultVariant
}) => {
  const { theme } = useTaskTheme();

  const label = buttonProps?.label ?? defaultLabel;
  const variant = buttonProps?.variant ?? defaultVariant;
  const Icon =
    buttonProps?.icon === undefined
      ? defaultIcon
      : buttonProps?.icon === null
        ? () => null
        : buttonProps?.icon;

  return useMemo(
    () =>
      disabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              type="button"
              variant={variant}
              onClick={undefined}
              className={cn(
                'opacity-50 cursor-not-allowed',
                buttonProps?.className
              )}
            >
              {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent className={theme.arrow} arrowClassName={theme.arrow}>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          size="sm"
          type="button"
          variant={variant}
          onClick={onClick}
          className={cn('cursor-pointer', buttonProps?.className)}
          disabled={isLoading}
        >
          {isLoading ? <Spinner /> : Icon && <Icon />}
          {isLoading ? <span>Loading...</span> : label}
        </Button>
      ),
    [
      disabled,
      onClick,
      buttonProps,
      isLoading,
      label,
      variant,
      Icon,
      tooltip,
      theme.arrow
    ]
  );
};

export type TaskControlsProps = {
  disabled?: boolean;
  help?: string;
  allowUpdates?: boolean;
  submit?: CustomButtonProps;
  update?: CustomButtonProps;
  cancel?: CustomButtonProps;
} & OptionalFields<TaskActionHandlers, 'onUpdate'>;

export const TaskControls: React.FC<TaskControlsProps> = ({
  help = 'Complete above to continue',
  disabled,
  isLoading,
  submit,
  cancel,
  update,
  submission,
  onSubmit,
  onUpdate,
  onCancel
}) => {
  return (
    <>
      <Separator />
      <TaskContent className="bg-sidebar">
        {!submission ? (
          <CustomTooltipButton
            disabled={disabled}
            isLoading={isLoading}
            onClick={onSubmit}
            tooltip={help}
            defaultIcon={CheckIcon}
            defaultLabel="Complete Task"
            defaultVariant="outline"
            buttonProps={submit}
          />
        ) : onUpdate ? (
          <CustomTooltipButton
            disabled={disabled}
            isLoading={isLoading}
            onClick={onUpdate}
            tooltip={help}
            defaultIcon={SaveIcon}
            defaultLabel="Update Task"
            defaultVariant="outline"
            buttonProps={update}
          />
        ) : null}

        <CustomTooltipButton
          onClick={onCancel}
          buttonProps={{
            className: 'text-foreground',
            ...cancel
          }}
          defaultLabel="Cancel"
          defaultVariant="link"
        />
      </TaskContent>
    </>
  );
};
