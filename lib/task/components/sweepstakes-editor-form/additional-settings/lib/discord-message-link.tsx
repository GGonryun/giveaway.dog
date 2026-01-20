import { useArrayContext } from '@/components/hooks/use-array-context';
import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useFormContext } from 'react-hook-form';

export const DiscordMessageLinkField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.link`}
      render={({ field }) => (
        <FormItem>
          <SwitchFormHeader
            className="mb-1"
            label="Discord Message Link"
            help={{
              title: 'Help: Discord Message Link',
              content: (
                <p>
                  The full URL to the Discord message. This is automatically
                  generated when the message is posted.
                </p>
              )
            }}
          />
          <FormControl>
            <Input
              placeholder="https://discord.com/channels/123/456/789"
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
