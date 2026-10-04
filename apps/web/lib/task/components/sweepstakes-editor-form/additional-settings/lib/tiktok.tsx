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

export const TikTokProfileUrl: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.profileUrl`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Profile URL</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const TikTokPostUrl: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.postUrl`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Post URL</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
