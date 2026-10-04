import { HelpDialog, HelpDialogProps } from '../help-dialog';
import { FormDescription, FormLabel } from '@giveaway/ui-primitives/form';
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

export const SwitchFormHeader: React.FC<{
  label: string;
  description?: string;
  help?: HelpDialogProps;
  className?: string;
}> = ({ label, description, help, className }) => {
  return (
    <div className={cn('space-y-0.5 m-0', className)}>
      <div className="flex gap-1 items-center">
        <FormLabel>{label}</FormLabel>
        {help && <HelpDialog {...help} />}
      </div>
      {description && <FormDescription>{description}</FormDescription>}
    </div>
  );
};
