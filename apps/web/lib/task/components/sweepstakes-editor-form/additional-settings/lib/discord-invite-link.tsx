import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const DiscordInviteLinkFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.invite`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Invite Link</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
