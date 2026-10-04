import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BLUESKY_PROFILE_URL } from '@giveaway/app-config/settings';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';

export const BlueskyProfileUrlField = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.profileUrl`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bluesky Profile</FormLabel>
          <FormControl>
            <Input placeholder={BLUESKY_PROFILE_URL} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
