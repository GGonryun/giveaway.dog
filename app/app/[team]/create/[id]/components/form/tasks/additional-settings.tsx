import { assertNever } from '@/lib/errors';
import { GiveawaySchema, TaskType } from '@/schemas/giveaway';
import { useCallback } from 'react';
import { useArrayContext } from '@/components/hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const AdditionalSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'bonus-task':
        return <></>;
      case 'visit-url':
        return <HrefFormField />;
      default:
        throw assertNever(type);
    }
  }, []);

  return <div className="space-y-2">{content()}</div>;
};

const HrefFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawaySchema>();

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.href`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Link URL</FormLabel>
          <FormControl>
            <Input type="url" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
