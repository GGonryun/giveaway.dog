import { HelpTooltip } from '@/components/patterns/help-tooltip';
import { FormDescription, FormLabel } from '@/components/ui/form';

export const SwitchBox: React.PC = ({ children }) => {
  return <div className="rounded-lg border p-3 shadow-sm">{children}</div>;
};

export const SwitchFormHeader: React.FC<{
  label: string;
  description?: string;
  help?: React.ReactNode;
}> = ({ label, description, help }) => {
  return (
    <div className="space-y-0.5">
      <div className="flex gap-2 items-center">
        <FormLabel>{label}</FormLabel>
        {help && <HelpTooltip content={help} />}
      </div>
      {description && <FormDescription>{description}</FormDescription>}
    </div>
  );
};
