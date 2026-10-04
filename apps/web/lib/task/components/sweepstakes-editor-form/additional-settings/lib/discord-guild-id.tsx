import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
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
import { HelpDialog } from '@giveaway/ui-layouts/help-dialog';
import { DISCORD_PUBLIC_CHANNEL_URL } from '@giveaway/app-config/settings';
import Link from 'next/link';
import Image from 'next/image';

export const DiscordGuildIdFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channel`}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-end gap-1">
            <FormLabel>Channel Link</FormLabel>
            <HelpDialog
              title={'Help: Channel Link'}
              content={
                <div>
                  <p>
                    A discord channel link is used to verify that the user has
                    joined the server. To get the channel link, right-click on
                    any channel in the server and select "Copy Link".
                  </p>
                  <br />
                  <div className="relative mx-auto w-full max-w-64 aspect-[359/500] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/discord-channel-url.png"
                      alt="Discord Channel URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>
                  <br />
                  <p>
                    The URL will look something like this:{' '}
                    <Link
                      href={DISCORD_PUBLIC_CHANNEL_URL}
                      target="_blank"
                      className="hover:underline text-primary wrap-anywhere"
                    >
                      {DISCORD_PUBLIC_CHANNEL_URL}
                    </Link>
                  </p>
                </div>
              }
            />
          </div>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
