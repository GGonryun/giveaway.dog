import { assertNever } from '@/lib/errors';
import { GiveawaySchema } from '@/schemas/giveaway';
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
import { TaskType } from '@prisma/client';

export const AdditionalSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case TaskType.BONUS_TASK:
        return <></>;
      case TaskType.VISIT_URL:
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
