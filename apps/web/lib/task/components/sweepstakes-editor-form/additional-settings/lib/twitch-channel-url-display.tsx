import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';

export const TwitchChannelUrlDisplay: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  // Watch the channelUrl and importingAccount values
  const channelUrl = form.watch(`tasks.${index}.channelUrl`);
  const importingAccount = form.watch(`tasks.${index}.importingAccount`);

  // Don't render if no importing account is selected or channelUrl is empty
  if (!importingAccount || !channelUrl) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channelUrl`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Twitch Channel</FormLabel>
          <FormControl>
            <Input
              type="text"
              readOnly
              disabled
              {...field}
              className="bg-muted cursor-not-allowed"
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
