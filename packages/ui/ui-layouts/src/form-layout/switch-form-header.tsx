import { HelpDialog, HelpDialogProps } from '../help-dialog';
import { FormDescription, FormLabel } from '@giveaway/ui-primitives/form';
import { Label } from '@giveaway/ui-primitives/label';
import { cn } from '@giveaway/ui-utils/utils';

export const SwitchBox: React.PC<{ className?: string }> = ({
  children,
  className
}) => {
  return (
    <div className={cn('rounded-lg border p-3 shadow-xs', className)}>
      {children}
    </div>
  );
};

type SwitchHeaderProps = {
  label: string;
  description?: string;
  help?: HelpDialogProps;
  className?: string;
};

const SwitchHeaderLayout: React.FC<{
  label: React.ReactNode;
  description?: React.ReactNode;
  help?: HelpDialogProps;
  className?: string;
}> = ({ label, description, help, className }) => {
  return (
    <div className={cn('space-y-0.5 m-0', className)}>
      <div className="flex gap-1 items-center">
        {label}
        {help && <HelpDialog {...help} />}
      </div>
      {description}
    </div>
  );
};

export const SwitchFormHeader: React.FC<SwitchHeaderProps> = ({
  label,
  description,
  ...props
}) => {
  return (
    <SwitchHeaderLayout
      {...props}
      label={<FormLabel>{label}</FormLabel>}
      description={
        description && <FormDescription>{description}</FormDescription>
      }
    />
  );
};

export const SwitchHeader: React.FC<SwitchHeaderProps> = ({
  label,
  description,
  ...props
}) => {
  return (
    <SwitchHeaderLayout
      {...props}
      label={<Label>{label}</Label>}
      description={
        description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )
      }
    />
  );
};
