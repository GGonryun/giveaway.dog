import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';

export const TwitchFollowFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channel`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Twitch Channel Link</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
