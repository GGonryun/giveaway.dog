import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@/components/hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const VeloraFollowFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.profileUrl`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Velora Profile URL</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="https://velora.tv/username"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
