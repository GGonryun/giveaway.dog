import { HelpDialog, HelpDialogProps } from '@/components/patterns/help-dialog';
import { FormDescription, FormLabel } from '@/components/ui/form';

export const SwitchBox: React.PC = ({ children }) => {
  return <div className="rounded-lg border p-3 shadow-xs">{children}</div>;
};

export const SwitchFormHeader: React.FC<{
  label: string;
  description?: string;
  help?: HelpDialogProps;
}> = ({ label, description, help }) => {
  return (
    <div className="space-y-0.5 m-0">
      <div className="flex gap-2 items-center">
        <FormLabel>{label}</FormLabel>
        {help && <HelpDialog {...help} />}
      </div>
      {description && <FormDescription>{description}</FormDescription>}
    </div>
  );
};
